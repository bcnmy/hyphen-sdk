import { BigNumber, ethers, Wallet } from "ethers"
import { HyphenProvider } from "../../providers"
import { isNativeAddress, formatMessage } from '../../util';
import { config, EXIT_STATUS, RESPONSE_CODES } from "../../config";
import { log } from "../../logs";
import { TransactionManager, TransactionResponse, Transaction } from "..";
import { CheckStatusRequest, CheckStatusResponse, ExitResponse } from "../../types";
import { getHyphenBaseURL, RequestMethod, restAPI } from "../../utils/network";

export type CheckDepositStatusRequest = {
    depositHash: string,
    fromChainId: number
}

export type DepositRequest = {
    sender: string,
    receiver: string,
    tokenAddress: string,
    depositContractAddress: string,
    amount: string,
    fromChainId: string,
    toChainId: string,
    useBiconomy: boolean,
    tag: string
}

export type DepositManagerParams = {
    provider: HyphenProvider,
    signatureType?: string,
    onFundsTransfered?: (data: ExitResponse) => void,
    transferCheckInterval?: number,
    environment?: string
}

export class DepositManager extends TransactionManager {
    hyphenProvider: HyphenProvider;
    signatureType?: string;
    onFundsTransfered?: (data: ExitResponse) => void;
    transferCheckInterval?: number;
    environment?: string;
    depositTransactionListenerMap: Map<string, any>;

    constructor(params: DepositManagerParams) {
        super();
        this.hyphenProvider = params.provider;
        this.signatureType = params.signatureType;
        this.onFundsTransfered = params.onFundsTransfered;
        this.transferCheckInterval = params.transferCheckInterval;
        this.environment = params.environment;
        this.depositTransactionListenerMap = new Map();
    }

    deposit = async (request: DepositRequest, wallet?: Wallet): Promise<TransactionResponse | undefined> => {
        const provider = this.hyphenProvider.getProvider(request.useBiconomy);
        if (isNativeAddress(request.tokenAddress)) {
            const depositTransaction = await this._depositTokensToLiquidityPoolManager(request, wallet);
            if (depositTransaction) {
                await this.listenForExitTransaction(depositTransaction, parseInt(request.fromChainId, 10));
            }
            return depositTransaction;
        } else {
            const tokenContract = new ethers.Contract(request.tokenAddress, config.erc20TokenABI, provider);
            const allowance = await tokenContract.allowance(request.sender, request.depositContractAddress);
            log.info(`Allowance given to LiquidityPoolManager is ${allowance}`);
            if (BigNumber.from(request.amount).lte(allowance)) {
                const depositTransaction = await this._depositTokensToLiquidityPoolManager(request, wallet);
                if (depositTransaction) {
                    await this.listenForExitTransaction(depositTransaction, parseInt(request.fromChainId, 10));
                }
                return depositTransaction;
            } else {
                return Promise.reject(formatMessage(RESPONSE_CODES.ALLOWANCE_NOT_GIVEN, `Not enough allowance given to Liquidity Pool Manager contract`));
            }
        }
    }

    _depositTokensToLiquidityPoolManager = async (request: DepositRequest, wallet?: Wallet) => {
        try {
            const provider = this.hyphenProvider.getProvider(request.useBiconomy);
            const lpManager = new ethers.Contract(request.depositContractAddress,
                config.liquidityPoolManagerABI, provider);

            let txData;
            let value = '0x0';
            if (isNativeAddress(request.tokenAddress)) {
                const { data } = await lpManager.populateTransaction.depositNative(request.receiver, request.toChainId, request.tag);
                txData = data;
                value = ethers.utils.hexValue(ethers.BigNumber.from(request.amount));
            } else {
                const { data } = await lpManager.populateTransaction.depositErc20(request.toChainId, request.tokenAddress, request.receiver,
                    request.amount, request.tag);
                txData = data;
            }

            const txParams: Transaction = {
                data: txData,
                to: request.depositContractAddress,
                from: request.sender,
                value
            };
            if (this.signatureType) {
                txParams.signatureType = this.signatureType;
            }

            return this.sendTransaction(provider, txParams, wallet);
        } catch (error) {
            log.error(String(error));
        }
    }

    async checkDepositStatus(depositRequest: CheckDepositStatusRequest) {
        if (!depositRequest || !depositRequest.depositHash || !depositRequest.fromChainId) {
            return formatMessage(RESPONSE_CODES.BAD_REQUEST, "Bad input params. depositHash and fromChainId are mandatory parameters");
        }
        const queryParamMap = new Map();
        queryParamMap.set("depositHash", depositRequest.depositHash);
        queryParamMap.set("fromChainId", depositRequest.fromChainId);

        const checkTransferStatusRequest = {
            method: RequestMethod.GET,
            baseURL: getHyphenBaseURL(this.environment),
            path: config.checkTransferStatusPath,
            queryParams: queryParamMap
        }
        const response = await restAPI(checkTransferStatusRequest);
        return response;
    }

    async listenForExitTransaction(transaction: TransactionResponse, fromChainId: number) {
        if (this.onFundsTransfered) {
            const interval = this.transferCheckInterval || config.defaultExitCheckInterval;
            await transaction.wait(1);
            log.info(`Deposit transaction Confirmed. Listening for exit transaction now`);
            let invocationCount = 0;
            const intervalId = setInterval(async () => {
                const depositHash = transaction.hash;
                const response: any = await this.checkDepositStatus({ depositHash, fromChainId });
                invocationCount++;
                if (response && response.code === RESPONSE_CODES.SUCCESS) {
                    if (response.statusCode === EXIT_STATUS.PROCESSED && response.exitHash) {
                        if (this.onFundsTransfered)
                            this.onFundsTransfered(response);
                        clearInterval(this.depositTransactionListenerMap.get(depositHash))
                        this.depositTransactionListenerMap.delete(depositHash);
                    } else if (response.exitHash) {
                        if (this.onFundsTransfered)
                            this.onFundsTransfered(response);
                    }
                }
                if (invocationCount >= config.maxDepositCheckCallbackCount) {
                    log.info(`Max callback count reached ${config.maxDepositCheckCallbackCount}. Clearing interval now`);
                    clearInterval(this.depositTransactionListenerMap.get(depositHash))
                    this.depositTransactionListenerMap.delete(depositHash);
                }
            }, interval);
            this.depositTransactionListenerMap.set(transaction.hash, intervalId);
        } else {
            log.info(`onFundsTransfered method is missing from options so not listening for exit transaction`);
        }
    }

    preDepositStatus = async (checkStatusRequest: CheckStatusRequest): Promise<CheckStatusResponse> => {
        const body = {
            tokenAddress: checkStatusRequest.tokenAddress,
            amount: checkStatusRequest.amount,
            fromChainId: checkStatusRequest.fromChainId,
            toChainId: checkStatusRequest.toChainId,
            userAddress: checkStatusRequest.userAddress
        };
        const preDepositStatusRequest = {
            method: RequestMethod.POST,
            baseURL: getHyphenBaseURL(this.environment),
            path: config.checkRequestStatusPath,
            body
        }
        return await restAPI(preDepositStatusRequest);
    }
}