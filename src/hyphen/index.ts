import { SIGNATURE_TYPES, RESPONSE_CODES, EXIT_STATUS } from "../config";
import { Options, SupportedToken } from "../types";
import { BiconomyProviderParams } from "../providers";
import { BiconomyProvider } from "../providers/biconomy";
import { TokenManager } from "../tokens";
import { ContractManager } from "../contract";
import { DepositManager, DepositManagerParams } from "../transaction/deposit";
import { LiquidityPools, LiquidityPoolsParams } from "../liquidity-pools";
import { log } from "../logs";
import { TransferManager, TransferManagerParams } from "../transaction/transfer";
import { LiquidityProvidersManager, LiquidityProvidersManagerParams } from "../liquidity-providers";

class Hyphen {
    provider: BiconomyProvider;
    tokens: TokenManager;
    contracts: ContractManager;
    depositManager: DepositManager;
    transfer: TransferManager;
    liquidityProviders: LiquidityProvidersManager;
    liquidityPool: LiquidityPools;
    environment?: 'test' | 'staging' | 'prod';
    options: Options;
    supportedTokens: Map<number, void | SupportedToken[]>;

    constructor(provider: any, options: Options) {
        this._validate(options);
        this.options = options;
        this.environment = options.environment ?? 'prod';
        const biconomyProviderParams: BiconomyProviderParams = {
            providerParams: {
                provider,
                isBiconomyEnabled: options.biconomy?.enable ?? false
            },
            walletProvider: options?.walletProvider,
            enableBiconomy: options?.biconomy?.enable,

        };
        if(options?.biconomy?.enable) {
            biconomyProviderParams.biconomyOptions = {
                apiKey: options?.biconomy.apiKey,
                debug: options?.biconomy.debug
            }
        }
        this.provider = new BiconomyProvider(biconomyProviderParams);
        this.tokens = new TokenManager({
            environment: this.environment,
            provider: this.provider,
            infiniteApproval: options.infiniteApproval ?? false
        });
        this.contracts = new ContractManager();
        this.supportedTokens = new Map();

        // Deposit Manager Initialisation
        const depositManagerParams: DepositManagerParams = {
            provider: this.provider,
            signatureType: options.signatureType,
            onFundsTransfered: options.onFundsTransfered,
            transferCheckInterval: options.transferCheckInterval,
            environment: this.environment
        }
        this.depositManager = new DepositManager(depositManagerParams);

        // LiquidityProviders Manager Initialisation
        const liquidityProvidersManagerParams: LiquidityProvidersManagerParams = {
            provider: this.provider,
        }
        this.liquidityProviders = new LiquidityProvidersManager(liquidityProvidersManagerParams);

        // LiquidiyPools Initialisation
        const liquidityPoolManagerParams: LiquidityPoolsParams = {
            environment : this.environment
        }
        this.liquidityPool = new LiquidityPools(liquidityPoolManagerParams);

        // Transfer Manager Initialisation
        const transferManagerParams: TransferManagerParams = {
            environment : this.environment
        }
        this.transfer = new TransferManager(transferManagerParams);
    }

    init = () => {
        const self = this;
        const _biconomy = this.provider.getBiconomy();
        return new Promise<void>(async (resolve, reject) => {
            if(self.options.biconomy && self.options.biconomy.enable
                && _biconomy.status !== _biconomy.READY){
                _biconomy.onEvent(_biconomy.READY, async () => {
                    await self._init();
                    resolve();
                }).onEvent(_biconomy.ERROR, (error: object, message: string) => {
                    log.error(error);
                    log.error(message);
                    reject(error);
                })
            } else {
                await self._init();
                resolve();
            }
        });
    }

    _init = async () => {
        if(this.provider) {
            const currentNetwork = await this.provider.getCurrentNetwork();
            const networkId = currentNetwork.chainId;
            if(networkId) {
                await this.tokens.init(networkId);
            } else {
                throw new Error("Unable to get network id from given provider object");
            }
        }
    }

    _validate = (options: Options) => {
        if (!options) {
            throw new Error(`Options object needs to be passed to Hyphen Object`);
        }
        if(options.biconomy && options.biconomy.enable && !options.biconomy.apiKey) {
            throw new Error(`apiKey is required under biconomy option. Either disable biconomy or provide apiKey`);
        }
    }
}

export { Hyphen, RESPONSE_CODES, SIGNATURE_TYPES, EXIT_STATUS }