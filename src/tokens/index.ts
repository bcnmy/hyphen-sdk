import { RequestMethod, getHyphenBaseURL, restAPI } from "../utils/network";
import { config, RESPONSE_CODES } from "../config";
import { formatMessage } from "../util";
import { log } from "../logs";
import { ContractManager } from "../contract";
import { HyphenProvider } from "../providers";
import { Transaction, TransactionManager, TransactionResponse } from "../transaction";
import { BigNumber, ContractInterface, ethers } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import { getERC20ApproveDataToSign, getMetaTxnCompatibleTokenData, getSignatureParameters } from "../meta-transaction/util";

export type SupportedToken = {
    tokenSymbol: string,
    decimal: number,
    address: string
}

export type TokenManagerParams = {
    environment: string,
    provider: HyphenProvider,
    infiniteApproval: boolean
}

export class TokenManager extends ContractManager {

    environment: string;
    supportedTokens: Map<number, void | SupportedToken[]>;
    provider: HyphenProvider;
    infiniteApproval: boolean;

    constructor(params: TokenManagerParams) {
        super();
        this.environment = params.environment;
        this.provider = params.provider;
        this.infiniteApproval = params.infiniteApproval;
        this.supportedTokens = new Map();
    }

    async init(networkId: number) {
        const supportedTokens = await this.getSupportedTokensFromServer(networkId);
        this.supportedTokens.set(networkId, supportedTokens);
    }

    async getSupportedTokens(networkId: number): Promise<SupportedToken[] | void> {
        let tokenArray = this.supportedTokens.get(networkId);
        if (!tokenArray) {
            tokenArray = await this.getSupportedTokensFromServer(networkId);
            this.supportedTokens.set(networkId, tokenArray);
        }
        return tokenArray;
    }

    async getSupportedTokensFromServer(networkId: number): Promise<SupportedToken[] | void> {
        const queryParamMap = new Map();
        queryParamMap.set("networkId", networkId);

        const getTokenRequest = {
            method: RequestMethod.GET,
            baseURL: getHyphenBaseURL(this.environment),
            path: config.getSupportedTokensPath,
            body: undefined,
            queryParams: queryParamMap
        }

        try {
            const supportedTokensResponse = await restAPI(getTokenRequest);
            if (supportedTokensResponse && supportedTokensResponse.supportedPairList) {
                log.info(supportedTokensResponse.supportedPairList);
                return supportedTokensResponse.supportedPairList;
            } else {
                const error = formatMessage(RESPONSE_CODES.ERROR_RESPONSE, `Unable to get supported tokens`);
                log.info(error);
                log.info("Returning default list from config");
                return config.defaultSupportedTokens.get(networkId);
            }
        } catch (error: any) {
            log.info(error);
            log.info("Could not get token list from api so returning default list from config");
            return config.defaultSupportedTokens.get(networkId);
        }
    }

    async getERC20TokenDecimals(address: string) {
        const tokenContract = this.getContract({ address, abi: config.erc20TokenABI, provider: this.provider.getProvider(false), networkId: await this.provider.getNetworkId() });
        if (tokenContract) {
            return tokenContract.decimals();
        } else {
            throw new Error("Unable to create token contract object. Please check your network and token address");
        }
    }

    async getERC20Allowance(tokenAddress: string, userAddress: string, spender: string) {
        if(tokenAddress && userAddress && spender) {
            const tokenContract = this.getContract({
                address: tokenAddress,
                abi: config.erc20TokenABI,
                networkId: await this.provider.getNetworkId(),
                provider: this.provider.getProvider(false)
            });
            const allowance = await tokenContract.allowance(userAddress, spender);
            return allowance;
        } else {
            throw new Error("Bad input parameters. Check if all parameters are valid");
        }
    }

    getERC20ABI(networkId: number, tokenAddress: string) {
        let abi = config.erc20ABIByToken.get(tokenAddress.toLowerCase());
        if(!abi) {
            abi = config.erc20ABIByNetworkId.get(networkId);
        }
        // tokenAddress to be used in future for any custom token support
        return abi;
    }

    approveERC20 = async (tokenAddress: string, spender: string, amount: string, userAddress: string,
        infiniteApproval: boolean, useBiconomy: boolean):
        Promise<TransactionResponse | undefined> => {
        const provider = this.provider.getProvider(useBiconomy);
        const currentNetwork = await provider.getNetwork();
        let approvalAmount: BigNumber = BigNumber.from(amount);
        if(currentNetwork) {
            const erc20ABI = this.getERC20ABI(currentNetwork.chainId, tokenAddress);
            if(!erc20ABI) {
                throw new Error(`ERC20 ABI not found for token address ${tokenAddress} on networkId ${currentNetwork.chainId}`)
            }

            const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
            const tokenContractInterface = new ethers.utils.Interface(JSON.stringify(erc20ABI));
            const tokenInfo = config.tokenAddressMap[tokenAddress.toLowerCase()] ? config.tokenAddressMap[tokenAddress.toLowerCase()][currentNetwork.chainId] : undefined;
            if (tokenContract) {
                if((infiniteApproval !== undefined && infiniteApproval) || (infiniteApproval === undefined && this.infiniteApproval)) {
                    approvalAmount = ethers.constants.MaxUint256;
                    log.info(`Infinite approval flag is true, so overwriting the amount with value ${amount}`);
                }
                if (spender && approvalAmount) {
                    // check if biconomy enable?
                    if(this.provider.isBiconomyEnabled) {
                        const customMetaTxSupport = config.customMetaTxnSupportedNetworksForERC20Tokens[currentNetwork.chainId];
                        if(customMetaTxSupport && customMetaTxSupport.indexOf(tokenAddress.toLowerCase()) > -1) {
                            // Call executeMetaTransaction method
                            const functionSignature = tokenContractInterface.encodeFunctionData("approve", [spender, approvalAmount.toString()]);
                            const tokenData = getMetaTxnCompatibleTokenData(tokenAddress, currentNetwork.chainId);
                            const dataToSign = await getERC20ApproveDataToSign({
                                contract: tokenContract,
                                abi: erc20ABI,
                                domainType: config.erc20MetaTxnDomainType,
                                metaTransactionType: config.customMetaTxnType,
                                userAddress,
                                spender,
                                amount: approvalAmount.toString(),
                                name: tokenData.name,
                                version: tokenData.version,
                                address: tokenAddress,
                                salt: '0x' + (currentNetwork.chainId).toString(16).padStart(64, '0')
                            });

                            const _provider = this.provider.getProviderWithAccounts(useBiconomy) as JsonRpcProvider;
                            if(_provider) {
                                const signature = await _provider.send("eth_signTypedData_v4", [userAddress, dataToSign])
                                const { r, s, v } = getSignatureParameters(signature);

                                const { data } = await tokenContract.populateTransaction.executeMetaTransaction(userAddress, functionSignature, r, s, v);

                                const txParams: Transaction = {
                                    data,
                                    to: tokenAddress,
                                    from: userAddress,
                                    value: "0x0"
                                };
                                return this.sendTransaction(provider, txParams);

                            } else {
                                throw new Error("Couldn't get a provider to get user signature. Make sure you have passed correct provider or walletProvider field in Hyphen constructor.");
                            }
                        } else if(tokenInfo && tokenInfo.symbol === 'USDC' && tokenInfo.permitSupported) {
                            // If token is USDC call permit method
                            const deadline:number = Number(Math.floor(Date.now() / 1000 + 3600));
                            const usdcDomainData = {
                                name: tokenInfo.name,
                                version: tokenInfo.version,
                                chainId: currentNetwork.chainId,
                                verifyingContract: tokenAddress
                            };
                            const nonce = await tokenContract.nonces(userAddress);
                            const permitDataToSign = {
                                types: {
                                  EIP712Domain: config.domainType,
                                  Permit: config.eip2612PermitType,
                                },
                                domain: usdcDomainData,
                                primaryType: "Permit",
                                message: {
                                  owner: userAddress,
                                  spender,
                                  value: approvalAmount.toString(),
                                  nonce: parseInt(nonce, 10),
                                  deadline
                                },
                            };
                            const _provider = this.provider.getProviderWithAccounts(useBiconomy) as JsonRpcProvider;
                            if(_provider) {
                                const signature = await _provider.send("eth_signTypedData_v4", [userAddress, JSON.stringify(permitDataToSign)]);
                                const { r, s, v } = getSignatureParameters(signature);

                                const { data } = await tokenContract.populateTransaction.permit(userAddress, spender, approvalAmount.toString(), deadline, v, r, s);
                                const txParams: Transaction = {
                                    data,
                                    to: tokenAddress,
                                    from: userAddress,
                                    value: '0x0'
                                };
                                return this.sendTransaction(provider, txParams);
                            } else {
                                throw new Error("Couldn't get a provider to get user signature. Make sure you have passed correct provider or walletProvider field in Hyphen constructor.");
                            }
                        } else {
                            const { data } = await tokenContract.populateTransaction.approve(spender, approvalAmount.toString());
                            const txParams: Transaction = {
                                data,
                                to: tokenAddress,
                                from: userAddress,
                                value: '0x0'
                            };
                            return this.sendTransaction(provider, txParams);
                        }
                    } else {
                        const { data } = await tokenContract.populateTransaction.approve(spender, approvalAmount.toString());
                        const txParams: Transaction = {
                            data,
                            to: tokenAddress,
                            from: userAddress,
                            value: '0x0'
                        };
                        return this.sendTransaction(provider, txParams);
                    }
                } else {
                    log.info(`One of the inputs is not valid => spender: ${spender}, amount: ${amount}`)
                }
            } else {
                log.error("Token contract is not defined");
                throw new Error("Token contract is not defined. Please check if token address is present on the current chain");
            }
        } else {
            throw new Error("Unable to get current network from provider during approveERC20 method");
        }
    }
}