import { Configuration, RESPONSE_CODES } from "../../../../src/config";
import { DepositManager, DepositManagerParams } from "../../../../src/transaction/deposit/index";
import { HyphenProvider } from "../../../../src/providers";
import { GetTransferFeeRequest, GetTransferFeeResponse } from "../../../../src/types";
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

});
