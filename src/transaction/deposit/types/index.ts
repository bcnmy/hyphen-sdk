import type { BigNumberish, BigNumber } from 'ethers';
import type { Configuration } from '../../../config';
import type { HyphenProvider } from '../../../providers';
import type { CCMPAdaptor, Environment, GetTransferFeeRequest, GetTransferFeeResponse } from '../../../types';

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
};

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

export type DepositManagerParams<ExitResponseType> = {
  provider: HyphenProvider;
  signatureType?: string;
  onFundsTransfered?: (data: ExitResponseType) => void;
  transferCheckInterval?: number;
  environment?: Environment;
  config: Configuration;
};

export type CCMPMessagePayloadType = {
  to: string;
  _calldata: string;
};

export type GasFeePaymentArgs = {
  feeTokenAddress: string;
  feeAmount: BigNumberish;
  relayer: string;
};

export type WormholeArgs = {
  adaptorName: CCMPAdaptor.WORMHOLE;
  routerArgs: {
    consistencyLevel: number;
  };
};

export type AxelarArgs = {
  adaptorName: CCMPAdaptor.AXELAR;
  routerArgs: {};
};

export type HyperlaneArgs = {
  adaptorName: CCMPAdaptor.HYPERLANE;
  routerArgs: {};
};

export type DepositAndCallParams = DepositRequest & {
  payloads: CCMPMessagePayloadType[];
  minAmount?: BigNumberish;
} & (WormholeArgs | AxelarArgs | HyperlaneArgs);

export type DepositAndCallFeeRequest = GetTransferFeeRequest & {
  receiver: string;
  payloads: CCMPMessagePayloadType[];
  minAmount?: BigNumberish;
} & (WormholeArgs | AxelarArgs | HyperlaneArgs);

export type DepositAndCallTransferFeeResponse = GetTransferFeeResponse & { relayer: string };

export enum CrossChainTransationStatus {
  __START = 'START',
  TRANSACTION_VALIDATED = 'TRANSACTION_VALIDATED',
  SOURCE_TX_RECEIVED = 'SOURCE_TX_RECEIVED',
  PROTOCOL_FEE_PAID = 'PROTOCOL_FEE_PAID',
  PROTOCOL_CONFIRMATION_RECEIVED = 'PROTOCOL_CONFIRMATION_RECEIVED',
  DESTINATION_TRANSACTION_QUEUED = 'DESTINATION_TRANSACTION_QUEUED',
  DESTINATION_TRANSACTION_RELAYED = 'DESTINATION_TRANSACTION_RELAYED',
  DESTINATION_TRANSACTION_CONFIRMED = 'DESTINATION_TRANSACTION_CONFIRMED',
}

export enum TransactionStatus {
  IN_PROCESS = 'IN_PROCESS',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  DROPPED = 'DROPPED',
}

export enum CrossChainTransactionError {
  ALREADY_PROCESSED = 'ERR_ALREADY_PROCESSED',
  INSUFFICIENT_GAS_FEE = 'ERR_INSUFFICIENT_GAS_FEE_PAID',
  UNSUPPORTED_ROUTE = 'ERR_UNSUPPORTED_ROUTE',
  UNKNOWN_ERROR = 'ERR_UNKNOWN_ERR',
  DESTINATION_TRANSACTION_REVERTED = 'ERR_DESTINATION_TRANSACTION_REVERTED',
}

export type DepositAndCallCheckStatusResponseType = {
  sourceTransactionStatus?: CrossChainTransationStatus;
  destinationTransactionStatus?: TransactionStatus;
  error?: CrossChainTransactionError;
  destinationChainTxHash?: string;
  context: any;
};

export type DepositAndCallTxOptions = {
  gasLimit?: BigNumber;
  gasPrice?: BigNumber;
  nonce?: number;
};
