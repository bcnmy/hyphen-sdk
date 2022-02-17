import { ethers } from "ethers"

export type Transaction = {
    from: string,
    data?: string,
    to: string,
    signatureType?: string,
    value: string
}

export type TransactionResponse = {
    hash: string,
    wait: (confirmations?: number) => ethers.providers.TransactionReceipt
}

export class TransactionManager {

    sendTransaction = async (_provider: any, rawTransaction: Transaction) => {
        if(_provider && rawTransaction) {
            const transactionHash = await _provider.send("eth_sendTransaction", [rawTransaction]);

            const response : TransactionResponse = {
                hash: transactionHash,
                wait: (confirmations?: number): ethers.providers.TransactionReceipt => {
                    return _provider.waitForTransaction(transactionHash, confirmations);
                }
            };
            return response;
        } else {
            throw new Error("Error while sending transaction. Either provider or rawTransaction is not defined");
        }
    }
}