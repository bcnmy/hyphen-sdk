import { BigNumber, ethers, Wallet } from "ethers"

export type Transaction = {
    from: string,
    data?: string,
    to: string,
    signatureType?: string,
    value: string,
    chainId?: number,
    nonce?: number,
    gasLimit?: BigNumber,
    gasPrice?: BigNumber,
}

export type TransactionResponse = {
    hash: string,
    wait: (confirmations?: number) => ethers.providers.TransactionReceipt
}

export class TransactionManager {

    sendTransaction = async (_provider: any, rawTransaction: Transaction, wallet?: Wallet) => {
        if (_provider && rawTransaction) {
            if (wallet === undefined) {
                const transactionHash = await _provider.send("eth_sendTransaction", [rawTransaction]);

                const response: TransactionResponse = {
                    hash: transactionHash,
                    wait: (confirmations?: number): ethers.providers.TransactionReceipt => {
                        return _provider.waitForTransaction(transactionHash, confirmations);
                    }
                };
                return response;
            }
            else {
                const unsignedTx = rawTransaction;

                unsignedTx.nonce = unsignedTx.nonce || await _provider.getTransactionCount(wallet.address);
                const { chainId } = await _provider.getNetwork();
                unsignedTx.chainId = chainId;
                unsignedTx.gasPrice = unsignedTx.gasPrice || await _provider.getGasPrice();
                // Send 1.5x gas limit
                unsignedTx.gasLimit = (await _provider.estimateGas(unsignedTx)).mul(3).div(2);

                const signedTx = await wallet.signTransaction(unsignedTx);
                return this.sendSignedTransaction(_provider, signedTx)
            }
        } else {
            throw new Error("Error while sending transaction. Either provider or rawTransaction is not defined");
        }
    }

    sendSignedTransaction = async (_provider: any, signedTransaction: string) => {
        if (_provider && signedTransaction) {
            const transactionHash = await _provider.send("eth_sendRawTransaction", [signedTransaction]);

            const response: TransactionResponse = {
                hash: transactionHash,
                wait: (confirmations?: number): ethers.providers.TransactionReceipt => {
                    return _provider.waitForTransaction(transactionHash, confirmations);
                }
            };
            return response;
        } else {
            throw new Error("Error while sending transaction. Either provider or signedTransaction is not defined");
        }
    }
}
