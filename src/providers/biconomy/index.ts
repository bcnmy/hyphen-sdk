import { ethers } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import { HyphenProvider, BiconomyProviderParams } from "..";
import { isEthersProvider } from "../../util";
const { Biconomy } = require("@biconomy/mexa");

export class BiconomyProvider extends HyphenProvider {

    biconomy: any;
    biconomyProvider: any;
    walletProvider?: Web3Provider;

    constructor(params: BiconomyProviderParams) {
        super(params.providerParams);
        if (params.enableBiconomy && params.biconomyOptions) {
            const biconomyOptions = params.biconomyOptions;
            if (biconomyOptions && params.walletProvider) {
                biconomyOptions.walletProvider = params.walletProvider;
            }
            this.biconomy = new Biconomy(this.provider, biconomyOptions);
            this.biconomyProvider = new ethers.providers.Web3Provider(this.biconomy);
        }
        if (params.walletProvider) {
            if (isEthersProvider(params.walletProvider)) {
                throw new Error("Wallet Provider in options can't be an ethers provider. Please pass the provider you get from your wallet directly.")
            }
            this.walletProvider = new ethers.providers.Web3Provider(params.walletProvider);
        }
    }

    getBiconomy() {
        return this.biconomy;
    }

    getProvider(useBiconomy: boolean) {
        if(useBiconomy) {
            return this.biconomyProvider ? this.biconomyProvider : this.provider;
        } else {
            return this.provider;
        }
    }

    getProviderWithAccounts = (useBiconomy: boolean) => {
        let result;
        if(this.walletProvider) {
            result = this.walletProvider;
        } else {
            result = this.getProvider(useBiconomy);
        }
        return result;
    }
}