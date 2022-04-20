import { ethers } from "ethers";
import type { Token } from "./types";

function toJSONRPCPayload(engine: any, method: string, params: any) {
  if (!method) {
    throw new Error('JSONRPC method should be specified for params: "' + JSON.stringify(params) + '"!');
  }

  if (!engine.jsonRPC || engine.jsonRPC.messageId === undefined) {
    throw new Error("engine object should have jsonRPC key with field 'messageId'");
  }

  // advance message ID
  engine.jsonRPC.messageId++;

  return {
    jsonrpc: "2.0",
    id: engine.jsonRPC.messageId,
    method,
    params: params || [],
  };
}

const isEthersProvider = (provider: object) => {
  return ethers.providers.Provider.isProvider(provider);
};

const formatMessage = (code: number, message: string) => {
  return {
    code,
    message,
  };
};

function isNumeric(str: string) {
  try {
    if (typeof str !== "string") return false;
    return !isNaN(parseFloat(str));
  } catch (e) {
    return false;
  }
}

const convertTokenAddressesToLowercase = (token: Token): Token => {
  const newToken = JSON.parse(JSON.stringify(token));
  for (const [key, value] of Object.entries(token)) {
    if (isNumeric(key) && typeof value !== "string" && value?.address) {
      newToken[key].address = value.address.toLowerCase();
    }
  }
  return newToken;
};

export { toJSONRPCPayload, isEthersProvider, formatMessage, convertTokenAddressesToLowercase };
