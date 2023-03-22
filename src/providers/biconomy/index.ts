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
        if (params.walletProvider) {
            if (isEthersProvider(params.walletProvider)) {
                this.walletProvider = params.walletProvider;
            } else {
                this.walletProvider = new ethers.providers.Web3Provider(params.walletProvider);
            }
        }


        if (params.enableBiconomy && params.biconomyOptions) {
            const biconomyOptions = params.biconomyOptions;
            if (biconomyOptions && params.walletProvider) {
                biconomyOptions.walletProvider = this.walletProvider;
            }
            this.biconomy = new Biconomy(this.provider, biconomyOptions);
            this.biconomyProvider = new ethers.providers.Web3Provider(this.biconomy);
        }
    }

    getBiconomy() {
        return this.biconomy;
    }

    getProvider(useBiconomy: boolean) {
        if (useBiconomy) {
            return this.biconomyProvider ? this.biconomyProvider : this.provider;
        } else {
            return this.provider;
        }
    }

    getProviderWithAccounts = (useBiconomy: boolean) => {
        let result;
        if (this.walletProvider) {
            result = this.walletProvider;
        } else {
            result = this.getProvider(useBiconomy);
        }
        return result;
    }
}