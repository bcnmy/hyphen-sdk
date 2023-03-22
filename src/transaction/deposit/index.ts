import { BigNumber, Bytes, ethers, Wallet } from "ethers";
import { HyphenProvider } from "../../providers";
import { formatMessage } from "../../util";
import { Configuration, EXIT_STATUS, RESPONSE_CODES } from "../../config";
import { log } from "../../logs";
import { TransactionManager, TransactionResponse, Transaction } from "..";
import {
  CheckStatusRequest,
  CheckStatusResponse,
  Environment,
  ExitResponse,
  GetTransferFeeRequest,
  GetTransferFeeResponse,
  GasTokenDistributionRequest
} from "../../types";
import { RequestMethod, makeHttpRequest } from "../../utils/network";
import { TokenManager } from "../../tokens";

export type CheckDepositStatusRequest = {
  depositHash: string;
  fromChainId: number;
};

export type DepositRequest = {
  sender: string;
  receiver: string;
  tokenAddress: string;
  depositContractAddress: string;
  amount: string;
  fromChainId: string;
  toChainId: string;
  useBiconomy: boolean;
  dAppName: string;
  tag?: string;
};

export type SwapRequest = {
  tokenAddress: string;
  percentage: number;
  amount: string;
  operation: number;
  path: string;
}

export type DepositAndSwapRequest = {
  sender: string;
  receiver: string;
  tokenAddress: string;
  depositContractAddress: string;
  amount: string;
  fromChainId: string;
  toChainId: string;
  useBiconomy: boolean;
  dAppName: string;
  tag?: string;
  swapRequest: SwapRequest[];
};

export type DepositManagerParams = {
  provider: HyphenProvider;
  signatureType?: string;
  onFundsTransfered?: (data: ExitResponse) => void;
  transferCheckInterval?: number;
  environment?: Environment;
  config: Configuration;
};

export class DepositManager extends TransactionManager {
  hyphenProvider: HyphenProvider;
  signatureType?: string;
  onFundsTransfered?: (data: ExitResponse) => void;
  transferCheckInterval?: number;
  environment?: Environment;
  depositTransactionListenerMap: Map<string, any>;
  config: Configuration;
  tokenManager: TokenManager;

  constructor(params: DepositManagerParams) {
    super();
    this.hyphenProvider = params.provider;
    this.signatureType = params.signatureType;
    this.onFundsTransfered = params.onFundsTransfered;
    this.transferCheckInterval = params.transferCheckInterval;
    this.environment = params.environment;
    this.config = params.config;
    this.depositTransactionListenerMap = new Map();
    this.tokenManager = new TokenManager({
      environment: params.environment || "prod",
      provider: this.hyphenProvider,
      infiniteApproval: false,
      config: this.config
    });
  }

  deposit = async (request: DepositRequest, wallet?: Wallet): Promise<TransactionResponse | undefined> => {
    const provider = this.hyphenProvider.getProvider(request.useBiconomy);
    if (this.config.isNativeAddress(request.tokenAddress)) {
      const depositTransaction = await this._depositTokensToLiquidityPoolManager(request, wallet);
      if (depositTransaction) {
        await this.listenForExitTransaction(depositTransaction, parseInt(request.fromChainId, 10));
      }
      return depositTransaction;
    } else {
      const tokenContract = new ethers.Contract(request.tokenAddress, this.config.erc20TokenABI, provider);
      const allowance = await tokenContract.allowance(request.sender, request.depositContractAddress);
      log.info(`Allowance given to LiquidityPoolManager is ${allowance}`);
      if (BigNumber.from(request.amount).lte(allowance)) {
        const depositTransaction = await this._depositTokensToLiquidityPoolManager(request, wallet);
        if (depositTransaction) {
          await this.listenForExitTransaction(depositTransaction, parseInt(request.fromChainId, 10));
        }
        return depositTransaction;
      } else {
        return Promise.reject(
          formatMessage(
            RESPONSE_CODES.ALLOWANCE_NOT_GIVEN,
            `Not enough allowance given to Liquidity Pool Manager contract`
          )
        );
      }
    }
  };

  depositAndSwap = async (request: DepositAndSwapRequest, wallet?: Wallet): Promise<TransactionResponse | undefined> => {
    if (this.config.isNativeAddress(request.tokenAddress)) {
      const depositTransaction = await this._depositTokensToLPAndSwap(request, wallet);
      if (depositTransaction) {
        await this.listenForExitTransaction(depositTransaction, parseInt(request.fromChainId, 10));
      }
      return depositTransaction;
    } else {
      const allowance = await this.tokenManager.getERC20Allowance(request.tokenAddress, request.sender, request.depositContractAddress);
      log.info(`Allowance given to LiquidityPoolManager is ${allowance}`);
      if (BigNumber.from(request.amount).lte(allowance)) {
        const depositTransaction = await this._depositTokensToLPAndSwap(request, wallet);
        if (depositTransaction) {
          await this.listenForExitTransaction(depositTransaction, parseInt(request.fromChainId, 10));
        }
        return depositTransaction;
      } else {
        return Promise.reject(
          formatMessage(
            RESPONSE_CODES.ALLOWANCE_NOT_GIVEN,
            `Not enough allowance given to Liquidity Pool Manager contract`
          )
        );
      }
    }
  };

  _depositTokensToLiquidityPoolManager = async (request: DepositRequest, wallet?: Wallet) => {
    try {
      const provider = this.hyphenProvider.getProvider(request.useBiconomy);
      const lpManager = new ethers.Contract(
        request.depositContractAddress,
        this.config.liquidityPoolManagerABI,
        provider
      );

      let txData;
      let value = "0x0";

      if (request.tag && !request.dAppName) {
        request.dAppName = request.tag;
      }

      if (this.config.isNativeAddress(request.tokenAddress)) {
        const { data } = await lpManager.populateTransaction.depositNative(
          request.receiver,
          request.toChainId,
          request.dAppName
        );
        txData = data;
        value = ethers.utils.hexValue(ethers.BigNumber.from(request.amount));
      } else {
        const { data } = await lpManager.populateTransaction.depositErc20(
          request.toChainId,
          request.tokenAddress,
          request.receiver,
          request.amount,
          request.dAppName
        );
        txData = data;
      }

      const txParams: Transaction = {
        data: txData,
        to: request.depositContractAddress,
        from: request.sender,
        value,
      };
      if (this.signatureType) {
        txParams.signatureType = this.signatureType;
      }

      return this.sendTransaction(provider, txParams, wallet);
    } catch (error) {
      log.error(JSON.stringify(error));
    }
  };

  _depositTokensToLPAndSwap = async (request: DepositAndSwapRequest, wallet?: Wallet) => {
    try {
      const provider = this.hyphenProvider.getProvider(request.useBiconomy);
      const lpManager = new ethers.Contract(
        request.depositContractAddress,
        this.config.liquidityPoolManagerABI,
        provider
      );

      let txData;
      let value = "0x0";

      if (request.tag && !request.dAppName) {
        request.dAppName = request.tag;
      }

      if (this.config.isNativeAddress(request.tokenAddress)) {
        const { data } = await lpManager.populateTransaction.depositNativeAndSwap(
          request.receiver,
          request.toChainId,
          request.dAppName,
          request.swapRequest
        );
        txData = data;
        value = ethers.utils.hexValue(ethers.BigNumber.from(request.amount));
      } else {
        const { data } = await lpManager.populateTransaction.depositAndSwapErc20(
          request.tokenAddress,
          request.receiver,
          request.toChainId,
          request.amount,
          request.dAppName,
          request.swapRequest
        );
        txData = data;
      }

      const txParams: Transaction = {
        data: txData,
        to: request.depositContractAddress,
        from: request.sender,
        value,
      };
      if (this.signatureType) {
        txParams.signatureType = this.signatureType;
      }

      return this.sendTransaction(provider, txParams, wallet);
    } catch (error) {
      log.error(JSON.stringify(error));
    }
  };

  checkDepositStatus = async (depositRequest: CheckDepositStatusRequest) => {
    if (!depositRequest || !depositRequest.depositHash || !depositRequest.fromChainId) {
      return formatMessage(
        RESPONSE_CODES.BAD_REQUEST,
        "Bad input params. depositHash and fromChainId are mandatory parameters"
      );
    }
    const queryParamMap = new Map();
    queryParamMap.set("depositHash", depositRequest.depositHash);
    queryParamMap.set("fromChainId", depositRequest.fromChainId);

    const checkTransferStatusRequest = {
      method: RequestMethod.GET,
      baseURL: this.config.getHyphenBaseURL(this.environment),
      path: this.config.checkTransferStatusPath,
      queryParams: queryParamMap,
    };
    const response = await makeHttpRequest(checkTransferStatusRequest);
    return response;
  }

  listenForExitTransaction = async (transaction: TransactionResponse, fromChainId: number) => {
    if (this.onFundsTransfered) {
      const interval = this.transferCheckInterval || this.config.defaultExitCheckInterval;
      await transaction.wait(1);
      log.info(`Deposit transaction Confirmed. Listening for exit transaction now`);
      let invocationCount = 0;
      const intervalId = setInterval(async () => {
        const depositHash = transaction.hash;
        const response: any = await this.checkDepositStatus({ depositHash, fromChainId });
        invocationCount++;
        if (response && response.code === RESPONSE_CODES.SUCCESS) {
          if (response.statusCode === EXIT_STATUS.PROCESSED && response.exitHash) {
            if (this.onFundsTransfered) this.onFundsTransfered(response);
            clearInterval(this.depositTransactionListenerMap.get(depositHash));
            this.depositTransactionListenerMap.delete(depositHash);
          } else if (response.exitHash) {
            if (this.onFundsTransfered) this.onFundsTransfered(response);
          }
        }
        if (invocationCount >= this.config.maxDepositCheckCallbackCount) {
          log.info(`Max callback count reached ${this.config.maxDepositCheckCallbackCount}. Clearing interval now`);
          clearInterval(this.depositTransactionListenerMap.get(depositHash));
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
      userAddress: checkStatusRequest.userAddress,
    };
    const preDepositStatusRequest = {
      method: RequestMethod.POST,
      baseURL: this.config.getHyphenBaseURL(this.environment),
      path: this.config.checkRequestStatusPath,
      body,
    };
    return await makeHttpRequest(preDepositStatusRequest);
  };

  /*
  * Returns the transfer fee for a given token and amount.
  *
  * @param request - The object containing the request parameters
  * @returns The breakdown of the transfer fees
  *
  * @see: {@link https://docs.biconomy.io/products/hyphen-instant-cross-chain-transfers/apis#transfer-fee|API docs}
  * for more details
  */

  getGasTokenDistribution = async (request: GasTokenDistributionRequest) => {
    return new Promise<GetTransferFeeResponse>(async (resolve, reject) => {
      if (request.fromChainId < 0) {
        reject("received invalid fromChainId");
      }

      const queryParamMap = new Map();
      queryParamMap.set("fromChainId", request.fromChainId);
      queryParamMap.set("fromChainTokenAddress", request.fromChainTokenAddress);
      queryParamMap.set("amount", request.amount);

      const response = await makeHttpRequest({
        method: RequestMethod.GET,
        baseURL: this.config.getHyphenBaseURL(this.environment),
        path: this.config.getGasTokenDistributionPath,
        queryParams: queryParamMap
      });
      resolve(response);
    });
  }

  getTransferFee = async (request: GetTransferFeeRequest) => {
    return new Promise<GetTransferFeeResponse>(async (resolve, reject) => {
      if (request.fromChainId < 0 || request.toChainId < 0) {
        reject("received invalid chain id");
      }

      const queryParamMap = new Map();
      queryParamMap.set("fromChainId", request.fromChainId);
      queryParamMap.set("toChainId", request.toChainId);
      queryParamMap.set("tokenAddress", request.tokenAddress);
      queryParamMap.set("amount", request.amount);

      const response = await makeHttpRequest({
        method: RequestMethod.GET,
        baseURL: this.config.getHyphenBaseURL(this.environment),
        path: this.config.getTransferFeePath,
        queryParams: queryParamMap
      });
      resolve(response);
    });
  }
}
