import { config, RESPONSE_CODES } from "../config";
import { FetchOption } from "../types";
import { formatMessage } from "../util";
import { log } from "../logs";
import { getHyphenBaseURL, RequestMethod, restAPI } from "../utils/network";

export type LiquidityPoolsParams = {
    environment: string
}

export class LiquidityPools {
    environment: string;

    constructor(params: LiquidityPoolsParams) {
        this.environment = params.environment;
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
            baseURL: getHyphenBaseURL(this.environment),
            path: config.getPoolInfoPath,
            queryParams: queryParamMap
        }
        const response = await restAPI(checkTransferStatusRequest);
        return response;
    }
}