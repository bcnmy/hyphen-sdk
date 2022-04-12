import { Contract } from "@ethersproject/contracts"
import { ContractInterface, ethers } from "ethers"

export type Environment = 'test' | 'staging' | 'prod';

export type Config = {
    hyphenBaseUrl: Record<Environment, string>,
    initiateExitPath: string,
    getSupportedTokensPath: string,
    checkRequestStatusPath: string,
    checkTransferStatusPath: string,
    getPoolInfoPath: string,
    liquidityPoolManagerABI: object[],
    liquidityProvidersManagerABI: object[],
    lpTokenABI: object[],
    erc20TokenABI: object[],
    defaultSupportedTokens: Map<number,SupportedToken[]>,
    supportedNetworkIds: number[],
    defaultExitCheckInterval: number,
    maxDepositCheckCallbackCount: number,
    erc20ABIByNetworkId: Map<number, ContractInterface>,
    getManualTransferPath: string,
    erc20ABIByToken: Map<string, ContractInterface>,
    customMetaTxnSupportedNetworksForERC20Tokens: Record<number, string[]>,
    erc20MetaTxnDomainType: object[],
    customMetaTxnType: object[],
    metaTxnCompatibleTokenData: Record<number, object>,
    tokenAddressMap: Record<string, Record<number, any>>,
    eip2612PermitType: object[],
    domainType: object[],
    NATIVE_ADDRESS: string
}

export type CheckStatusRequest = {
    tokenAddress: string,
    amount: number,
    fromChainId: number,
    toChainId: number,
    userAddress: string
}

export type CheckStatusResponse = {
    code: number,
    message: string
}

export type SupportedToken = {
    tokenSymbol: string,
    decimal: number,
    address: string
}

export type Options = {
    defaultAccount?: string,
    debug?: boolean,
    environment?: Environment,
    signatureType?: string,
    infiniteApproval?: boolean,
    transferCheckInterval?: number, // Interval in milli seconds to check for transfer status
    onFundsTransfered?: (data: ExitResponse) => void,
    biconomy?: BiconomyOption,
    walletProvider?: object
}

export type InternalBiconomyOption = {
    apiKey: string,
    debug: boolean,
    walletProvider?: object
}

export type BiconomyOption = {
    enable: boolean,
    apiKey: string,
    debug: boolean
}

export type FetchOption = {
    body?: string,
    method: string,
    headers: any
}

export type ExitRequest = {
    sender: string,
    receiver: string,
    tokenAddress: string,
    amount: string,
    fromChainId?: string,
    toChainId?: string
}

export type ExitResponse = {
    code: number,
    message: string,
    statusCode: number,
    fromChainId: number,
    toChainId: number,
    amount: string,
    tokenAddress: string,
    depositHash: string,
    exitHash: string
}

export type ERC20ApproveRequest = {
    contract: Contract,
    abi: ContractInterface,
    domainType: object,
    metaTransactionType: object,
    userAddress: string,
    spender: string,
    amount: string,
    name: string,
    version: string,
    address: string,
    salt: string
}