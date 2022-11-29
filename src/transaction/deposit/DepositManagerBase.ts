import { ethers } from 'ethers';
import { HyphenProvider } from '../../providers';
import { Configuration } from '../../config';
import { log } from '../../logs';
import { TransactionManager, TransactionResponse } from '..';
import { CheckStatusRequest, CheckStatusResponse, Environment } from '../../types';
import { RequestMethod, makeHttpRequest } from '../../utils/network';
import { TokenManager } from '../../tokens';
import type { CheckDepositStatusRequest, DepositManagerParams } from './types';

export abstract class DepositManagerBase<ExitResponseType> extends TransactionManager {
  hyphenProvider: HyphenProvider;
  signatureType?: string;
  onFundsTransfered?: (data: ExitResponseType) => void;
  transferCheckInterval?: number;
  environment: Environment;
  depositTransactionListenerMap: Map<string, any>;
  config: Configuration;
  tokenManager: TokenManager;

  constructor(params: DepositManagerParams<ExitResponseType>) {
    super();
    this.hyphenProvider = params.provider;
    this.signatureType = params.signatureType;
    this.onFundsTransfered = params.onFundsTransfered;
    this.transferCheckInterval = params.transferCheckInterval;
    this.environment = params.environment || 'prod';
    this.config = params.config;
    this.depositTransactionListenerMap = new Map();
    this.tokenManager = new TokenManager({
      environment: params.environment || 'prod',
      provider: this.hyphenProvider,
      infiniteApproval: false,
      config: this.config,
    });
  }

  abstract checkDepositStatus(request: CheckDepositStatusRequest): Promise<ExitResponseType>;

  abstract validateCheckStatusResponse(
    response: ExitResponseType
  ): Promise<{ exitHashGenerated: boolean; processed: boolean }>;

  _getLiquidityPoolManagerInstance = (params: { useBiconomy: boolean; depositContractAddress: string }) => {
    const provider = this.hyphenProvider.getProvider(params.useBiconomy);
    const lpManager = new ethers.Contract(params.depositContractAddress, this.config.liquidityPoolManagerABI, provider);
    return lpManager;
  };

  listenForExitTransaction = async (transaction: TransactionResponse, fromChainId: number) => {
    if (this.onFundsTransfered) {
      const interval = this.transferCheckInterval || this.config.defaultExitCheckInterval;
      await transaction.wait(1);
      log.info(`Deposit transaction Confirmed. Listening for exit transaction now`);
      let invocationCount = 0;
      const intervalId = setInterval(async () => {
        const depositHash = transaction.hash;
        try {
          const response = await this.checkDepositStatus({ depositHash, fromChainId });
          invocationCount++;
          const { exitHashGenerated, processed } = await this.validateCheckStatusResponse(response);
          if (exitHashGenerated && this.onFundsTransfered) {
            await this.onFundsTransfered(response);
          }
          if (processed) {
            clearInterval(this.depositTransactionListenerMap.get(depositHash));
            this.depositTransactionListenerMap.delete(depositHash);
          }
          if (invocationCount >= this.config.maxDepositCheckCallbackCount) {
            log.info(`Max callback count reached ${this.config.maxDepositCheckCallbackCount}. Clearing interval now`);
            clearInterval(this.depositTransactionListenerMap.get(depositHash));
            this.depositTransactionListenerMap.delete(depositHash);
          }
        } catch (e) {
          log.error(`Error while listening for exit transaction ${e instanceof Error ? e.message : JSON.stringify(e)}`);
        }
      }, interval);
      this.depositTransactionListenerMap.set(transaction.hash, intervalId);
    } else {
      log.info(`onFundsTransfered method is missing from options so not listening for exit transaction`);
    }
  };

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
}
