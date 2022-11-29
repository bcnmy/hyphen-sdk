import { ContractInterface } from "ethers";
import { RequestMethod, makeHttpRequest } from "./utils/network";
import { convertTokenAddressesToLowercase } from "./util";
import type {
  Config,
  Environment,
  SupportedToken,
  TokenConfigurationResponse,
  NetworkConfigurationResponse,
} from "./types";
import LIQUIDITY_POOL_MANAGER_ABI from "./abi/liquidity-pool";
import ERC20_ABI from "./abi/erc20";
import EIP2612_ABI from "./abi/erc20-eip2612";
import CUSTOM_META_TXN_ENABLED_ERC20_ABI from "./abi/erc20-metatx";

const ERC20_META_TXN_DOMAIN_TYPE = JSON.parse(
  '[{ "name": "name", "type": "string" }, { "name": "version", "type": "string" }, { "name": "verifyingContract", "type": "address" }, { "name": "salt", "type": "bytes32" }]'
);
const CUSTOM_META_TXN_TYPE = JSON.parse(
  '[{ "name": "nonce", "type": "uint256" }, { "name": "from", "type": "address" }, { "name": "functionSignature", "type": "bytes" }]'
);

const NATIVE_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

// Set Mumbai Network Default Supported Tokens
const defaultSupportedTokens: Map<number, SupportedToken[]> = new Map();
defaultSupportedTokens.set(80001, [
  {
    tokenSymbol: "USDT",
    decimal: 18,
    address: "0xeabc4b91d9375796aa4f69cc764a4ab509080a58",
  },
  {
    tokenSymbol: "USDC",
    decimal: 6,
    address: "0xda5289fcaaf71d52a80a254da614a192b693e977",
  },
  {
    tokenSymbol: "DAI",
    decimal: 18,
    address: "0x27a44456bedb94dbd59d0f0a14fe977c777fc5c3",
  },
]);

defaultSupportedTokens.set(4, [
  {
    tokenSymbol: "USDT",
    decimal: 18,
    address: "0xfab46e002bbf0b4509813474841e0716e6730136",
  },
]);

defaultSupportedTokens.set(43113, [
  {
    tokenSymbol: "USDT",
    decimal: 18,
    address: "0xb4e0f6fef81bdfea0856bb846789985c9cff7e85",
  },
]);

defaultSupportedTokens.set(43114, [
  {
    tokenSymbol: "USDT",
    decimal: 6,
    address: "0xc7198437980c041c805a1edcba50c1ce5db95118",
  },
  {
    tokenSymbol: "USDC",
    decimal: 6,
    address: "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664",
  },
  {
    tokenSymbol: "ETH",
    decimal: 6,
    address: "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab",
  },
]);

// Set Polygon Network Default Supported Tokens
defaultSupportedTokens.set(137, [
  {
    tokenSymbol: "USDT",
    decimal: 6,
    address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  },
  {
    tokenSymbol: "USDC",
    decimal: 6,
    address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  },
  {
    tokenSymbol: "DAI",
    decimal: 18,
    address: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  },
]);

// Set Goerli Network Default Supported Tokens
defaultSupportedTokens.set(5, [
  {
    tokenSymbol: "USDT",
    decimal: 18,
    address: "0x64ef393b6846114bad71e2cb2ccc3e10736b5716",
  },
  {
    tokenSymbol: "USDC",
    decimal: 6,
    address: "0xb5b640e6414b6def4fc9b3c1eef373925effeccf",
  },
  {
    tokenSymbol: "DAI",
    decimal: 18,
    address: "0x2686eca13186766760a0347ee8eeb5a88710e11b",
  },
]);

// Set Ethereum Network Default Supported Tokens
defaultSupportedTokens.set(1, [
  {
    tokenSymbol: "USDT",
    decimal: 6,
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  },
  {
    tokenSymbol: "USDC",
    decimal: 6,
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  {
    tokenSymbol: "DAI",
    decimal: 18,
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
]);

class Configuration implements Config {
  // API Configuration
  hyphenBaseUrl = {
    test: "https://hyphen-v2-integration-api.biconomy.io",
    staging: "https://hyphen-v2-staging-api.biconomy.io",
    prod: "https://hyphen-v2-api.biconomy.io",
  };
  relayerBaseUrl = {
    // TODO: Update
    test: "http://localhost:3000",
    staging: "http://localhost:3000",
    prod: "http://localhost:3000",
  };
  initiateExitPath = "/api/v1/insta-exit/initiate-exit";
  getSupportedTokensPath = "/api/v1/admin/supported-token/list";
  checkRequestStatusPath = "/api/v1/insta-exit/system-status";
  getPoolInfoPath = "/api/v1/insta-exit/get-pool-info";
  getManualTransferPath = "/api/v1/insta-exit/execute";
  checkTransferStatusPath = "/api/v1/insta-exit/check-status";
  checkDepositAndCallStatusPath = "/api/v1/cross-chain/status/tx";
  estimateDepositAndCallPath = "/api/v1/cross-chain/estimate/depositAndCall";
  tokenConfigurationPath = "/api/v1/configuration/tokens";
  networkConfigurationPath = "/api/v1/configuration/networks";
  getTransferFeePath = "/api/v1/data/transferFee";
  getGasTokenDistributionPath = "/api/v1/insta-exit/gas-token-distribution";

  // ABI
  liquidityPoolManagerABI = LIQUIDITY_POOL_MANAGER_ABI;
  erc20TokenABI = ERC20_ABI;

  erc20ABIByNetworkId: Map<number, ContractInterface> = new Map();
  erc20ABIByToken: Map<string, ContractInterface> = new Map();

  // Meta Transaction Configuration
  customMetaTxnSupportedNetworksForERC20Tokens: Record<number, string[]> = {};
  erc20MetaTxnDomainType = ERC20_META_TXN_DOMAIN_TYPE;
  customMetaTxnType = CUSTOM_META_TXN_TYPE;
  metaTxnCompatibleTokenData: Record<number, Record<string, { name: string; version: string; chainId: string }>> = {};
  eip2612PermitType = [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ];
  // This domain type is used in Permit Client where chainId needs to be preserved
  domainType = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ];

  // Network and Token Configuration
  defaultSupportedTokens = defaultSupportedTokens;
  supportedNetworkIds: number[] = [];
  defaultExitCheckInterval = 5000;
  maxDepositCheckCallbackCount = 720;
  tokensMap: Record<string, Record<number, any>> = {};
  tokenAddressMap: Record<string, Record<number, any>> = {};
  NATIVE_ADDRESS = NATIVE_ADDRESS;

  environment: Environment;

  constructor(environment: Environment) {
    this.environment = environment;
  }

  async init() {
    let tokenConfiguration: TokenConfigurationResponse;
    let networkConfiguration: NetworkConfigurationResponse;

    try {
      const getTokenConfigurationRequest = {
        method: RequestMethod.GET,
        baseURL: this.getHyphenBaseURL(this.environment),
        path: this.tokenConfigurationPath,
      };
      tokenConfiguration = (await makeHttpRequest(getTokenConfigurationRequest)).message;

      const getNetworkConfigurationRequest = {
        method: RequestMethod.GET,
        baseURL: this.getHyphenBaseURL(this.environment),
        path: this.networkConfigurationPath,
      };
      networkConfiguration = (await makeHttpRequest(getNetworkConfigurationRequest)).message;
    } catch (e) {
      console.error(`Error while fetching configuration: ${e}`);
      throw e;
    }

    // Populate Configuration
    this.supportedNetworkIds = networkConfiguration.filter(({ enabled }) => enabled).map(({ chainId }) => chainId);

    this.tokensMap = Object.fromEntries(
      tokenConfiguration.map((data) => [data.symbol, convertTokenAddressesToLowercase(data)])
    );

    /**
     * {
     * 		address: {
     * 			chainId: {
     * 				address
     * 				decimal
     * 				symbol
     * 			}
     * 		}
     * }
     */
    for (const [_, val] of Object.entries(this.tokensMap)) {
      for (const [chainId, data] of Object.entries(val)) {
        if (this.supportedNetworkIds.includes(parseInt(chainId, 10))) {
          this.tokenAddressMap[data.address] = {
            [chainId]: data,
          };
        }
      }
    }

    /**
     * {
     *    chainId: abi
     * }
     */
    this.erc20ABIByNetworkId = new Map(
      networkConfiguration
        .filter(({ enabled }) => enabled)
        .map(({ chainId, sdkConfig }) => [
          chainId,
          sdkConfig.metaTransactionSupported ? CUSTOM_META_TXN_ENABLED_ERC20_ABI : ERC20_ABI,
        ])
    );

    // Populate meta transaction configuration
    for (const token of tokenConfiguration) {
      for (const [chainId, data] of Object.entries(token)) {
        if (
          this.supportedNetworkIds.includes(parseInt(chainId, 10)) &&
          typeof data !== "string" &&
          data?.isSupported &&
          data?.metaTransactionData.supportsEip2612
        ) {
          this.erc20ABIByToken.set(data.address, EIP2612_ABI);
          this.metaTxnCompatibleTokenData[parseInt(chainId, 10)] = {
            ...(this.metaTxnCompatibleTokenData[parseInt(chainId, 10)] || {}),
            [data.address]: data.metaTransactionData.eip2612Data,
          };
          this.customMetaTxnSupportedNetworksForERC20Tokens[parseInt(chainId, 10)] = [
            ...(this.customMetaTxnSupportedNetworksForERC20Tokens[parseInt(chainId, 10)] || []),
            data.address,
          ];
        }
      }
    }
  }

  getHyphenBaseURL(_environment?: Environment) {
    const environment = _environment || "prod";
    return this.hyphenBaseUrl[environment];
  }

  getRelayerBaseURL(_environment?: Environment) {
    const environment = _environment || "prod";
    return this.relayerBaseUrl[environment];
  }

  isNativeAddress(address: string): boolean {
    let result: boolean = false;
    if (address && address.toLowerCase() === this.NATIVE_ADDRESS) {
      result = true;
    }
    return result;
  }
}

const RESPONSE_CODES = {
  ERROR_RESPONSE: 500,
  OK: 144,
  ALREADY_EXISTS: 145,
  UNSUPPORTED_TOKEN: 146,
  NO_LIQUIDITY: 148,
  UNSUPPORTED_NETWORK: 149,
  ALLOWANCE_NOT_GIVEN: 150,
  BAD_REQUEST: 400,
  SUCCESS: 200,
  EXPECTATION_FAILED: 417,
};

const EXIT_STATUS = {
  PROCESSING: 1,
  PROCESSED: 2,
  FAILED: 3,
};

const SIGNATURE_TYPES = {
  EIP712: "EIP712_SIGN",
  PERSONAL: "PERSONAL_SIGN",
};

export { Configuration, RESPONSE_CODES, EXIT_STATUS, SIGNATURE_TYPES };
