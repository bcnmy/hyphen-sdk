import { BigNumber, ethers, Wallet } from 'ethers';
import { formatMessage } from '../../util';
import { EXIT_STATUS, RESPONSE_CODES } from '../../config';
import { log } from '../../logs';
import { TransactionResponse, Transaction } from '..';
import { ExitResponse, GetTransferFeeRequest, GetTransferFeeResponse, GasTokenDistributionRequest } from '../../types';
import { RequestMethod, makeHttpRequest } from '../../utils/network';
import type { CheckDepositStatusRequest, DepositAndSwapRequest, DepositManagerParams, DepositRequest } from './types';
import { DepositManagerBase } from './DepositManagerBase';

export class DepositManager extends DepositManagerBase<ExitResponse> {
  constructor(params: DepositManagerParams<ExitResponse>) {
    super(params);
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

  depositAndSwap = async (
    request: DepositAndSwapRequest,
    wallet?: Wallet
  ): Promise<TransactionResponse | undefined> => {
    if (this.config.isNativeAddress(request.tokenAddress)) {
      const depositTransaction = await this._depositTokensToLPAndSwap(request, wallet);
      if (depositTransaction) {
        await this.listenForExitTransaction(depositTransaction, parseInt(request.fromChainId, 10));
      }
      return depositTransaction;
    } else {
      const allowance = await this.tokenManager.getERC20Allowance(
        request.tokenAddress,
        request.sender,
        request.depositContractAddress
      );
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
      const lpManager = this._getLiquidityPoolManagerInstance(request);

      let txData;
      let value = '0x0';

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
      const lpManager = this._getLiquidityPoolManagerInstance(request);

      let txData;
      let value = '0x0';

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

  _getLiquidityPoolManagerInstance = (params: { useBiconomy: boolean; depositContractAddress: string }) => {
    const provider = this.hyphenProvider.getProvider(params.useBiconomy);
    const lpManager = new ethers.Contract(params.depositContractAddress, this.config.liquidityPoolManagerABI, provider);
    return lpManager;
  };

  checkDepositStatus = async (depositRequest: CheckDepositStatusRequest): Promise<ExitResponse> => {
    if (!depositRequest || !depositRequest.depositHash || !depositRequest.fromChainId) {
      throw new Error(
        JSON.stringify(
          formatMessage(
            RESPONSE_CODES.BAD_REQUEST,
            'Bad input params. depositHash and fromChainId are mandatory parameters'
          )
        )
      );
    }
    const queryParamMap = new Map();
    queryParamMap.set('depositHash', depositRequest.depositHash);
    queryParamMap.set('fromChainId', depositRequest.fromChainId);

    const checkTransferStatusRequest = {
      method: RequestMethod.GET,
      baseURL: this.config.getHyphenBaseURL(this.environment),
      path: this.config.checkTransferStatusPath,
      queryParams: queryParamMap,
    };
    const response = await makeHttpRequest(checkTransferStatusRequest);
    return response;
  };

  async validateCheckStatusResponse(
    response: ExitResponse
  ): Promise<{ exitHashGenerated: boolean; processed: boolean }> {
    return {
      exitHashGenerated: response?.code === RESPONSE_CODES.SUCCESS && !!response?.exitHash,
      processed:
        response?.code === RESPONSE_CODES.SUCCESS &&
        response?.statusCode === EXIT_STATUS.PROCESSED &&
        !!response?.exitHash,
    };
  }

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
        reject('received invalid fromChainId');
      }

      const queryParamMap = new Map();
      queryParamMap.set('fromChainId', request.fromChainId);
      queryParamMap.set('fromChainTokenAddress', request.fromChainTokenAddress);
      queryParamMap.set('amount', request.amount);

      const response = await makeHttpRequest({
        method: RequestMethod.GET,
        baseURL: this.config.getHyphenBaseURL(this.environment),
        path: this.config.getGasTokenDistributionPath,
        queryParams: queryParamMap,
      });
      resolve(response);
    });
  };

  getTransferFee = async (request: GetTransferFeeRequest) => {
    return new Promise<GetTransferFeeResponse>(async (resolve, reject) => {
      if (request.fromChainId < 0 || request.toChainId < 0) {
        reject('received invalid chain id');
      }

      const queryParamMap = new Map();
      queryParamMap.set('fromChainId', request.fromChainId);
      queryParamMap.set('toChainId', request.toChainId);
      queryParamMap.set('tokenAddress', request.tokenAddress);
      queryParamMap.set('amount', request.amount);

      const response = await makeHttpRequest({
        method: RequestMethod.GET,
        baseURL: this.config.getHyphenBaseURL(this.environment),
        path: this.config.getTransferFeePath,
        queryParams: queryParamMap,
      });
      resolve(response);
    });
  };
}
