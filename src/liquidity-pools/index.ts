import { RESPONSE_CODES } from "../config";
import { formatMessage } from "../util";
import { RequestMethod, restAPI } from "../utils/network";
import type { Configuration } from "../config";
import type { Environment } from "../types";

export type LiquidityPoolsParams = {
    environment: Environment
    config: Configuration
}
export class LiquidityPools {
    environment: Environment;
    config: Configuration;

    constructor(params: LiquidityPoolsParams) {
        this.environment = params.environment;
        this.config = params.config;
    }

    async getPoolInformation(tokenAddress: string, fromChainId: number, toChainId: number) {
        if(!tokenAddress || fromChainId === undefined || toChainId === undefined) {
            return formatMessage(RESPONSE_CODES.BAD_REQUEST ,"Bad input params. fromChainId, toChainId and tokenAddress are mandatory parameters");
        }
        const queryParamMap = new Map();
        queryParamMap.set("tokenAddress", tokenAddress);
        queryParamMap.set("fromChainId", fromChainId);
        queryParamMap.set("toChainId", toChainId);

        const checkTransferStatusRequest = {
            method: RequestMethod.GET,
            baseURL: this.config.getHyphenBaseURL(this.environment),
            path: this.config.getPoolInfoPath,
            queryParams: queryParamMap
        }
        const response = await restAPI(checkTransferStatusRequest);
        return response;
    }
}