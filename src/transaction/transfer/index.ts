import { Configuration, RESPONSE_CODES } from "../../config";
import { Environment } from "../../types";
import { formatMessage } from "../../util";
import { RequestMethod, restAPI } from "../../utils/network";

export type ManualExitResponse = {
    code: number,
    message: string,
    exitHash?: string
}

export type TransferManagerParams = {
    environment: Environment,
    config: Configuration
}
export class TransferManager {
    environment: Environment;
    config: Configuration;

    constructor(params: TransferManagerParams) {
        this.environment = params.environment;
        this.config = params.config
    }

    async triggerManualTransfer(depositHash: string, chainId: string) : Promise<ManualExitResponse | undefined> {
        if(depositHash && chainId && depositHash!=="" && chainId !== "") {
            return formatMessage(RESPONSE_CODES.BAD_REQUEST, "Bad input params. depositHash and chainId are mandatory parameters");
        }
        const queryParamMap = new Map();

        const triggerManualTransferRequest = {
            method: RequestMethod.GET,
            baseURL: this.config.getHyphenBaseURL(this.environment),
            path: this.config.getManualTransferPath,
        }
        const response = await restAPI(triggerManualTransferRequest);
        return response;
    }
}