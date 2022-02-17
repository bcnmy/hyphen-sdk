import { config, RESPONSE_CODES } from "../../config";
import { formatMessage } from "../../util";
import { getHyphenBaseURL, RequestMethod, restAPI } from "../../utils/network";

export type ManualExitResponse = {
    code: number,
    message: string,
    exitHash?: string
}

export type TransferManagerParams = {
    environment: string
}
export class TransferManager {
    environment: string;

    constructor(params: TransferManagerParams) {
        this.environment = params.environment;
    }

    async triggerManualTransfer(depositHash: string, chainId: string) : Promise<ManualExitResponse | undefined> {
        if(depositHash && chainId && depositHash!=="" && chainId !== "") {
            return formatMessage(RESPONSE_CODES.BAD_REQUEST, "Bad input params. depositHash and chainId are mandatory parameters");
        }
        const queryParamMap = new Map();

        const triggerManualTransferRequest = {
            method: RequestMethod.GET,
            baseURL: getHyphenBaseURL(this.environment),
            path: config.getManualTransferPath,
        }
        const response = await restAPI(triggerManualTransferRequest);
        return response;
    }
}