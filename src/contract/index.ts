import { Contract, ContractInterface, ethers } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import { TransactionManager } from "../transaction";

export type ContractParams = {
    networkId: number,
    address: string,
    abi: ContractInterface,
    provider: Provider
}

export class ContractManager extends TransactionManager{
    contractMap: Map<string, Contract>;

    constructor() {
        super();
        this.contractMap = new Map();
    }

    getContract(params: ContractParams): Contract {
        let contractInstance = this.contractMap.get(this.getKey(params.address, params.networkId));
        if(!contractInstance) {
            contractInstance = new ethers.Contract(params.address, params.abi, params.provider);
        }
        return contractInstance;
    }

    getKey(address: string, networkId: number): string {
        if(!address || !networkId) {
            throw new Error("address and networkId are manadatory parameters");
        }
        return `${address.toLowerCase()}_${networkId}`;
    }
}