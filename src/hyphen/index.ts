import { SIGNATURE_TYPES, RESPONSE_CODES, EXIT_STATUS, Configuration } from "../config";
import { BiconomyProviderParams } from "../providers";
import { BiconomyProvider } from "../providers/biconomy";
import { TokenManager } from "../tokens";
import { ContractManager } from "../contract";
import { DepositAndCallCheckStatusResponseType, DepositAndCallManager, DepositManager, DepositManagerParams } from "../transaction/deposit";
import { LiquidityPools, LiquidityPoolsParams } from "../liquidity-pools";
import { log } from "../logs";
import { TransferManager, TransferManagerParams } from "../transaction/transfer";
import type { Environment, ExitResponse, Options, SupportedToken } from "../types";

class Hyphen {
    provider: BiconomyProvider;
    tokens: TokenManager;
    contracts: ContractManager;
    depositManager: DepositManager;
    depositAndCallManager: DepositAndCallManager;
    transfer: TransferManager;
    liquidityPool: LiquidityPools;
    environment?: Environment;
    options: Options;
    supportedTokens: Map<number, void | SupportedToken[]>;
    config: Configuration

    constructor(provider: any, options: Options) {
        this._validate(options);
        this.options = options;
        this.environment = options.environment ?? 'prod';
        this.config = new Configuration(this.environment);
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
            config: this.config,
            environment: this.environment,
            provider: this.provider,
            infiniteApproval: options.infiniteApproval ?? false
        });
        this.contracts = new ContractManager();
        this.supportedTokens = new Map();

        // Deposit Manager Initialisation
        const depositManagerParams: DepositManagerParams<ExitResponse> = {
            provider: this.provider,
            signatureType: options.signatureType,
            onFundsTransfered: options.onFundsTransfered,
            transferCheckInterval: options.transferCheckInterval,
            config: this.config,
            environment: this.environment
        }
        this.depositManager = new DepositManager(depositManagerParams);

        // DepositAndCall Manager Initialisation
        const depositAndCallManagerParams: DepositManagerParams<DepositAndCallCheckStatusResponseType> = {
            provider: this.provider,
            signatureType: options.signatureType,
            onFundsTransfered: options.onDepositAndCallFundsTransfered,
            transferCheckInterval: options.transferCheckInterval,
            config: this.config,
            environment: this.environment
        }
        this.depositAndCallManager = new DepositAndCallManager(depositAndCallManagerParams);

        // LiquidiyPools Initialisation
        const liquidityPoolManagerParams: LiquidityPoolsParams = {
            environment : this.environment,
            config: this.config
        }
        this.liquidityPool = new LiquidityPools(liquidityPoolManagerParams);

        // Transfer Manager Initialisation
        const transferManagerParams: TransferManagerParams = {
            environment : this.environment,
            config: this.config
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
            await this.config.init();
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