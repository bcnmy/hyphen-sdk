import { Configuration, RESPONSE_CODES } from "../../../../src/config";
import { DepositManager, DepositManagerParams } from "../../../../src/transaction/deposit/index";
import { HyphenProvider } from "../../../../src/providers";
import { GetTransferFeeRequest, GetTransferFeeResponse, GasTokenDistributionRequest, GasTokenDistributionResponse } from "../../../../src/types";
import * as networkUtils from "../../../../src/utils/network";

import { MockEthersProvider } from "../../mocks/provider";
jest.mock("../../../../src/utils/network");

describe("deposit manager unit tests", () => {
    let depositManager: DepositManager;

    beforeAll(async () => {
        const hyphenProvider = new HyphenProvider({
            provider: await new MockEthersProvider(),
            isBiconomyEnabled: false,
        });

        const params: DepositManagerParams = {
            provider: hyphenProvider,
            config: new Configuration("test")
        };
        depositManager = new DepositManager(params);
    });

    it("should succesfully get the transfer fees", async () => {
        const request: GetTransferFeeRequest = {
            fromChainId: 123,
            toChainId: 456,
            tokenAddress: "0xabc",
            amount: "1234567890",
        };

        const mockedSuccessMessage = "Successfully fetched transfer fee";
        const mockResponse: GetTransferFeeResponse = {
            code: 200,
            message: mockedSuccessMessage,
            gasFee: "0",
            transferFee: "0.36006636000000003",
            transferFeePercentage: "0.12002212",
            reward: "0",
            netTransferFee: "0.36006636000000003",
            amountToGet: "299.63993364"
        };

        const makeHttpRequestMock = jest.spyOn(networkUtils, "makeHttpRequest").mockResolvedValue(mockResponse);

        const response = await depositManager.getTransferFee(request);

        expect(makeHttpRequestMock).toHaveBeenCalledTimes(1);

        expect(response.code).toEqual(RESPONSE_CODES.SUCCESS);
        expect(response.message).toEqual(mockedSuccessMessage);
    });

    it("should fail to get the transfer fees due to bad params", async () => {
        try {
            const request: GetTransferFeeRequest = {
                fromChainId: -123,
                toChainId: -456,
                tokenAddress: "0xabc",
                amount: "1234567890",
            };

            await depositManager.getTransferFee(request);
        } catch (err) {
            expect(err).toEqual("received invalid chain id");
        }
    });

    it("should successully able to get the gasToken Distribution", async () => {
        const request: GasTokenDistributionRequest = {
            fromChainId: 5,
            fromChainTokenAddress: "0x64ef393b6846114bad71e2cb2ccc3e10736b5716",
            amount: "100000"
        };

        const mockedSuccessMessage = "GasTokenDistribution calculated successfull";
        const mockResponse: GasTokenDistributionResponse = {
            code: 200,
            message: mockedSuccessMessage,
	        responseCode: 200,
	        gasTokenPercentage: 2.423995995995996
        };

        const makeHttpRequestMock = jest.spyOn(networkUtils, "makeHttpRequest").mockResolvedValue(mockResponse);

        const response = await depositManager.getGasTokenDistribution(request);

        expect(makeHttpRequestMock).toHaveBeenCalledTimes;

        expect(response.code).toEqual(RESPONSE_CODES.SUCCESS);
        expect(response.message).toEqual(mockedSuccessMessage);
        
    });

    it("should fail to get the gasToken Distribution: Invalid fromChainId", async () => {
        try {
            const request: GasTokenDistributionRequest = {
                fromChainId: -123,
                fromChainTokenAddress: "0xabc",
                amount: "1234567890",
            };

            await depositManager.getGasTokenDistribution(request);
        } catch (err) {
            expect(err).toEqual("received invalid fromChainId");
        }
    });
});
