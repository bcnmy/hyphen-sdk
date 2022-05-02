import { Contract } from "@ethersproject/contracts";
import { ContractInterface, ethers } from "ethers";

type Modify<T, R> = Omit<T, keyof R> & R;

export type Environment = "test" | "staging" | "prod";

export type Config = {
  hyphenBaseUrl: Record<Environment, string>;
  initiateExitPath: string;
  getSupportedTokensPath: string;
  checkRequestStatusPath: string;
  checkTransferStatusPath: string;
  getPoolInfoPath: string;
  liquidityPoolManagerABI: ContractInterface;
  erc20TokenABI: ContractInterface;
  defaultSupportedTokens: Map<number, SupportedToken[]>;
  supportedNetworkIds: number[];
  defaultExitCheckInterval: number;
  maxDepositCheckCallbackCount: number;
  erc20ABIByNetworkId: Map<number, ContractInterface>;
  getManualTransferPath: string;
  erc20ABIByToken: Map<string, ContractInterface>;
  customMetaTxnSupportedNetworksForERC20Tokens: Record<number, string[]>;
  erc20MetaTxnDomainType: ContractInterface;
  customMetaTxnType: ContractInterface;
  metaTxnCompatibleTokenData: Record<number, object>;
  tokenAddressMap: Record<string, Record<number, any>>;
  eip2612PermitType: object[];
  domainType: object[];
  NATIVE_ADDRESS: string;
};

export type CheckStatusRequest = {
  tokenAddress: string;
  amount: number;
  fromChainId: number;
  toChainId: number;
  userAddress: string;
};

export type CheckStatusResponse = {
  code: number;
  message: string;
};

export type SupportedToken = {
  tokenSymbol: string;
  decimal: number;
  address: string;
};

export type Options = {
  defaultAccount?: string;
  debug?: boolean;
  environment?: Environment;
  signatureType?: string;
  infiniteApproval?: boolean;
  transferCheckInterval?: number; // Interval in milli seconds to check for transfer status
  onFundsTransfered?: (data: ExitResponse) => void;
  biconomy?: BiconomyOption;
  walletProvider?: object;
};

export type InternalBiconomyOption = {
  apiKey: string;
  debug: boolean;
  walletProvider?: object;
};

export type BiconomyOption = {
  enable: boolean;
  apiKey: string;
  debug: boolean;
};

export type FetchOption = {
  body?: string;
  method: string;
  headers: any;
};

export type ExitRequest = {
  sender: string;
  receiver: string;
  tokenAddress: string;
  amount: string;
  fromChainId?: string;
  toChainId?: string;
};

export type ExitResponse = {
  code: number;
  message: string;
  statusCode: number;
  fromChainId: number;
  toChainId: number;
  amount: string;
  tokenAddress: string;
  depositHash: string;
  exitHash: string;
};

export type ERC20ApproveRequest = {
  contract: Contract;
  abi: ContractInterface;
  domainType: object;
  metaTransactionType: object;
  userAddress: string;
  spender: string;
  amount: string;
  name: string;
  version: string;
  address: string;
  salt: string;
};

export type NetworkConfigurationResponse = {
  enabled: boolean;
  nativeToken: string;
  nativeDecimal: number;
  eip1559Supported: boolean;
  baseFeeMultiplier: number;
  watchTower: string;
  networkAgnosticTransferSupported: boolean;
  tokenPriceToBeCalculated: boolean;
  name: string;
  image: string;
  chainId: number;
  chainColor: string;
  currency: string;
  gasless: {
    enable: boolean;
    apiKey: string;
  };
  topicIds: Record<string, string>;
  graphUrl: string;
  v2GraphUrl: string;
  explorerUrl: string;
  rpc: string;
  contracts: {
    uniswapRouter: string;
    hyphen: {
      tokenManager: string;
      liquidityPool: string;
      executorManager: string;
      lpToken: string;
      liquidityProviders: string;
      liquidityFarming: string;
      whitelistPeriodManager: string;
    };
    biconomyForwarders: string[];
    gnosisMasterAccount: string;
    whiteListedExternalContracts: string[];
  };
  sdkConfig: {
    metaTransactionSupported: boolean;
  };
}[];

export type Token = Modify<
  Record<
    string,
    {
      address: string;
      transferOverhead: number;
      decimal: number;
      symbol: string;
      chainColor: string;
      isSupported: boolean;
      metaTransactionData: {
        supportsEip2612: boolean;
        eip2612Data: {
          name: string;
          version: string;
          chainId: string;
        };
      };
    }
  >,
  {
    symbol: string;
    image: string;
    coinGeckoId: string;
  }
>;

export type TokenConfigurationResponse = Token[];
