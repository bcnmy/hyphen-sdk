import { ethers } from "ethers";
import { config } from "./config";

function toJSONRPCPayload(engine: any, method: string, params: any) {
    if (!method) {
        throw new Error('JSONRPC method should be specified for params: "'+ JSON.stringify(params) +'"!');
    }

    if(!engine.jsonRPC || engine.jsonRPC.messageId === undefined) {
        throw new Error("engine object should have jsonRPC key with field 'messageId'");
    }

    // advance message ID
    engine.jsonRPC.messageId++;

    return {
        jsonrpc: '2.0',
        id: engine.jsonRPC.messageId,
        method,
        params: params || []
    };
};

function isNativeAddress(address: string) : boolean {
    let result: boolean = false;
    if(address && address.toLowerCase() === config.NATIVE_ADDRESS) {
        result = true;
    }
    return result;
}

const isEthersProvider = (provider: object) => {
    return ethers.providers.Provider.isProvider(provider);
}

const formatMessage = (code: number, message: string) => {
    return {
        code,
        message
    };
}

export {
    toJSONRPCPayload,
    isNativeAddress,
    isEthersProvider,
    formatMessage
}