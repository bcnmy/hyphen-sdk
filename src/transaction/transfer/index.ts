import { Configuration, RESPONSE_CODES } from "../../config";
import { Environment } from "../../types";
import { formatMessage } from "../../util";
import { RequestMethod, makeHttpRequest } from "../../utils/network";
import { DepositAndCallCheckStatusResponseType, DepositAndCallManualTransferResponseType } from "../deposit";

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
        const response = await makeHttpRequest(triggerManualTransferRequest);
        return response;
    }

    async triggerDepositAndCallManualTransfer(depositHash: string, chainId: string) : Promise<DepositAndCallManualTransferResponseType> {
        if (!depositHash || !chainId || depositHash === '' || chainId === '') {
          return {
            code: RESPONSE_CODES.BAD_REQUEST,
            message: 'Bad input params. depositHash and chainId are mandatory parameters',
          };
        }

        const triggerManualTransferRequest = {
            method: RequestMethod.GET,
            baseURL: this.config.getRelayerBaseURL(this.environment),
            path: this.config.depositAndCallProcessPath,
            queryParamMap: {
                txHash: depositHash,
                chainId
            }
        }
        const response = await makeHttpRequest(triggerManualTransferRequest);
        return response;
    }
}