import { ethers } from "ethers";
import { log } from "../logs";

export type ProviderParams = {
    provider: any,
    isBiconomyEnabled: boolean
}

export type BiconomyProviderParams = {
    providerParams: ProviderParams,
    walletProvider?: any,
    enableBiconomy?: boolean,
    biconomyOptions?: InternalBiconomyOption
}

export type InternalBiconomyOption = {
    apiKey: string,
    debug?: boolean,
    walletProvider?: object
}

export class HyphenProvider {
    provider: ethers.providers.Provider;
    isBiconomyEnabled: boolean;

    constructor(params: ProviderParams) {
        this.isBiconomyEnabled = params.isBiconomyEnabled;
        if (ethers.providers.Provider.isProvider(params.provider)) {
            log.info(`Ethers provider detected`);
            this.provider = params.provider;
        } else {
            log.info(`Non-Ethers provider detected`);
            this.provider = new ethers.providers.Web3Provider(params.provider);
        }
    }

    getCurrentNetwork() {
        return this.provider.getNetwork();
    }

    getProvider(useBiconomy: boolean) {
        return this.provider;
    }

    getProviderWithAccounts = (useBiconomy: boolean) => {
        return this.provider;
    }

    async getNetworkId() {
        const currentNetwork = await this.getCurrentNetwork();
        return currentNetwork.chainId;
    }
}