import { BigNumber, BigNumberish, ethers, Wallet } from 'ethers';
import {
  CheckDepositStatusRequest,
  DepositAndCallCheckStatusResponseType,
  DepositAndCallFeeRequest,
  DepositAndCallParams,
  DepositAndCallTransferFeeResponse,
  DepositAndCallTxOptions,
  DepositManagerParams,
  GasFeePaymentArgs,
  TransactionStatus,
} from './types';
import { log } from '../../logs';
import { Transaction } from '..';
import { formatMessage } from '../../util';
import { RESPONSE_CODES } from '../../config';
import { CCMPAdaptor, GetTransferFeeResponse } from '../../types';
import { makeHttpRequest, RequestMethod } from '../../utils/network';
import { DepositManagerBase } from './DepositManagerBase';

export class DepositAndCallManager extends DepositManagerBase<DepositAndCallCheckStatusResponseType> {
  abiCoder: ethers.utils.AbiCoder;

  constructor(params: DepositManagerParams<DepositAndCallCheckStatusResponseType>) {
    super(params);
    this.abiCoder = new ethers.utils.AbiCoder();
  }

  #encodeRouterArgs = (params: DepositAndCallParams): string => {
    switch (params.adaptorName) {
      case CCMPAdaptor.WORMHOLE: {
        return this.abiCoder.encode(['uint256'], [params.routerArgs.consistencyLevel]);
      }
      default: {
        return this.abiCoder.encode(['string'], ['null']);
      }
    }
  };

  #encodeHyphenArgs = (params: DepositAndCallParams): string[] => {
    if (params.minAmount) {
      return [this.abiCoder.encode(['uint256'], [params.minAmount])];
    }
    return [];
  };

  #executeDepositAndCall = async (
    request: DepositAndCallParams & { gasFeePaymentArgs: GasFeePaymentArgs },
    wallet?: Wallet,
    options?: DepositAndCallTxOptions
  ) => {
    try {
      const provider = this.hyphenProvider.getProvider(request.useBiconomy);
      const lpManager = this._getLiquidityPoolManagerInstance(request);

      let value: BigNumberish = '0x0';

      if (this.config.isNativeAddress(request.tokenAddress)) {
        value = ethers.BigNumber.from(request.amount);
      }
      const transferredAmount = ethers.BigNumber.from(request.amount).sub(
        request.gasFeePaymentArgs.feeAmount
      );

      const calldata = lpManager.interface.encodeFunctionData('depositAndCall', [
        {
          toChainId: request.toChainId,
          tokenAddress: request.tokenAddress,
          receiver: request.receiver,
          amount: transferredAmount,
          tag: request.tag || request.dAppName,
          payloads: request.payloads,
          gasFeePaymentArgs: request.gasFeePaymentArgs,
          adaptorName: request.adaptorName,
          routerArgs: this.#encodeRouterArgs(request),
          hyphenArgs: this.#encodeHyphenArgs(request),
        },
      ]);

      const txParams: Transaction = {
        data: calldata,
        to: request.depositContractAddress,
        from: request.sender,
        value: ethers.utils.hexValue(value),
        ...(options?.nonce && { nonce: options.nonce }),
        ...(options?.gasPrice && { gasPrice: options.gasPrice }),
      };

      console.log('txParams', txParams);

      if (this.signatureType) {
        txParams.signatureType = this.signatureType;
      }

      return this.sendTransaction(provider, txParams, wallet);
    } catch (error) {
      log.error(JSON.stringify(error));
    }
  };

  #checkAllowance = async (
    provider: ethers.providers.Provider,
    sender: string,
    tokenAddress: string,
    totalAmount: BigNumberish,
    depositContractAddress: string
  ) => {
    if (!this.config.isNativeAddress(tokenAddress)) {
      log.info(`Checking allowance for ${tokenAddress}`);
      const tokenContract = new ethers.Contract(tokenAddress, this.config.erc20TokenABI, provider);
      const allowance = await tokenContract.allowance(sender, depositContractAddress);
      log.info(`Allowance given to LiquidityPoolManager is ${allowance}`);
      if (allowance.lt(totalAmount)) {
        throw new Error(
          JSON.stringify(
            formatMessage(
              RESPONSE_CODES.ALLOWANCE_NOT_GIVEN,
              `Not enough allowance given to Liquidity Pool Manager contract`
            )
          )
        );
      }
    }
  };

  #validate = async (
    request: DepositAndCallParams,
    wallet?: Wallet,
    options?: DepositAndCallTxOptions
  ) => {
    const fromChainId = parseInt(request.fromChainId, 10);
    if (!this.config.suportedRoutersMap[fromChainId].includes(request.adaptorName)) {
      throw new Error(
        JSON.stringify(
          formatMessage(
            RESPONSE_CODES.UNSUPPORTED_ROUTE,
            `Adaptor ${request.adaptorName} not supported for chain id ${fromChainId}`
          )
        )
      );
    }

    const toChainId = parseInt(request.toChainId, 10);
    if (!this.config.suportedRoutersMap[toChainId].includes(request.adaptorName)) {
      throw new Error(
        JSON.stringify(
          formatMessage(
            RESPONSE_CODES.UNSUPPORTED_ROUTE,
            `Adaptor ${request.adaptorName} not supported for chain id ${toChainId}`
          )
        )
      );
    }
  };

  depositAndCall = async (
    request: DepositAndCallParams,
    wallet?: Wallet,
    options?: DepositAndCallTxOptions
  ) => {
    // TODO: Add functions for increasing gas fee
    // TODO: Manual Exit
    await this.#validate(request, wallet, options);

    // Estimate gas fee and generate gas fee payment args
    const { gasFee: gasFeeInWei, relayer } = await this.getGasFee({
      ...request,
      fromChainId: parseInt(request.fromChainId, 10),
      toChainId: parseInt(request.toChainId, 10),
    });
    const gasFeePaymentArgs: GasFeePaymentArgs = {
      feeTokenAddress: request.tokenAddress,
      feeAmount: gasFeeInWei,
      relayer,
    };

    const provider = this.hyphenProvider.getProvider(request.useBiconomy);

    const amount = ethers.BigNumber.from(request.amount);
    if (amount.lte(gasFeeInWei)) {
      throw new Error(
        `Amount should be greater than gas fee. Amount: ${amount.toString()}, Gas Fee: ${gasFeeInWei.toString()}`
      );
    }
    const totalAmount = ethers.BigNumber.from(request.amount).sub(gasFeePaymentArgs.feeAmount);

    log.info(`Gas Fee Payment Args: ${JSON.stringify(gasFeePaymentArgs)}`);
    log.info(`Final Amount: ${totalAmount.toString()}`);

    // Check Allowance
    await this.#checkAllowance(
      provider,
      request.sender,
      request.tokenAddress,
      totalAmount,
      request.depositContractAddress
    );

    // Execute Transaction
    log.info(`Executing depositAndCall transaction`);
    const depositTransaction = await this.#executeDepositAndCall(
      {
        ...request,
        gasFeePaymentArgs,
      },
      wallet,
      options
    );
    if (!depositTransaction) {
      throw new Error(`Deposit transaction failed`);
    }
    if (depositTransaction) {
      await this.listenForExitTransaction(depositTransaction, parseInt(request.fromChainId, 10));
    }
    return depositTransaction;
  };

  checkDepositStatus = async (
    depositRequest: CheckDepositStatusRequest
  ): Promise<DepositAndCallCheckStatusResponseType> => {
    if (!depositRequest?.depositHash || !depositRequest?.fromChainId) {
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
    queryParamMap.set('sourceTxHash', depositRequest.depositHash);
    queryParamMap.set('chainId', depositRequest.fromChainId);

    const checkTransferStatusRequest = {
      method: RequestMethod.GET,
      baseURL: this.config.getRelayerBaseURL(this.environment),
      path: this.config.checkDepositAndCallStatusPath,
      queryParams: queryParamMap,
    };
    const response: DepositAndCallCheckStatusResponseType = await makeHttpRequest(
      checkTransferStatusRequest
    );
    return response;
  };

  async validateCheckStatusResponse(
    response: DepositAndCallCheckStatusResponseType
  ): Promise<{ exitHashGenerated: boolean; processed: boolean }> {
    return {
      exitHashGenerated: !!response?.destinationChainTxHash,
      processed: response?.destinationTransactionStatus === TransactionStatus.SUCCESS,
    };
  }

  getGasFee = async (
    request: DepositAndCallFeeRequest
  ): Promise<{ gasFee: string; relayer: string }> => {
    const params = {
      fromChainId: request.fromChainId,
      toChainId: request.toChainId,
      fromTokenAddress: request.tokenAddress,
      receiverAddress: request.receiver,
      amountInWei: request.amount.toString(),
      adaptorName: request.adaptorName,
      payloads: request.payloads,
    };
    log.info(`Getting gas fee..`);
    const response = await makeHttpRequest({
      method: RequestMethod.POST,
      baseURL: this.config.getRelayerBaseURL(this.environment),
      path: this.config.estimateDepositAndCallPath,
      body: params,
    });
    const gasFee = response.amountInWei;
    const relayer = response.relayer;
    log.info(`Gas fee is ${gasFee}, refund receiver: ${relayer}`);
    return { gasFee, relayer };
  };

  getLiquidityPoolTransferFee = async (
    request: DepositAndCallFeeRequest
  ): Promise<GetTransferFeeResponse> => {
    if (request.fromChainId < 0 || request.toChainId < 0) {
      throw new Error('received invalid chain id');
    }

    const queryParamMap = new Map();
    queryParamMap.set('fromChainId', request.fromChainId);
    queryParamMap.set('toChainId', request.toChainId);
    queryParamMap.set('tokenAddress', request.tokenAddress);
    queryParamMap.set('amount', request.amount.toString());

    const response = await makeHttpRequest({
      method: RequestMethod.GET,
      baseURL: this.config.getHyphenBaseURL(this.environment),
      path: this.config.getTransferFeePath,
      queryParams: queryParamMap,
    });

    return response;
  };

  getTransferFee = async (
    request: DepositAndCallFeeRequest
  ): Promise<DepositAndCallTransferFeeResponse> => {
    const { gasFee, relayer } = await this.getGasFee(request);
    const decimals = await this.tokenManager.getERC20TokenDecimals(request.tokenAddress);
    const gasFeeReadable = ethers.utils.formatUnits(gasFee, decimals);
    log.info(
      `Readable Gas fee for ${JSON.stringify(request)} is ${gasFeeReadable} $${
        request.tokenAddress
      }`
    );
    const { transferFee, transferFeePercentage, reward } = await this.getLiquidityPoolTransferFee(
      request
    );
    log.info(
      `Response from getLiquidityPoolTransferFee is ${JSON.stringify({
        transferFee,
        transferFeePercentage,
        reward,
      })}}`
    );
    if (!transferFee || !transferFeePercentage || !reward) {
      throw new Error('Error fetching transfer fee from Hyphen');
    }

    const netTransferFee =
      parseFloat(transferFee) + parseFloat(gasFeeReadable) - parseFloat(reward);
    const amountToGet =
      parseFloat(ethers.utils.formatUnits(request.amount, decimals)) - netTransferFee;

    return {
      gasFee: gasFeeReadable,
      relayer,
      transferFee,
      transferFeePercentage,
      reward,
      netTransferFee: netTransferFee.toString(),
      amountToGet: amountToGet.toString(),
      message: 'Calculated transfer fee estimate',
      code: 200,
    };
  };
}
