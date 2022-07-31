import { Configuration, RESPONSE_CODES } from "../../../../src/config";
import { DepositManager, DepositManagerParams, DepositAndSwapRequest } from "../../../../src/transaction/deposit/index";
import { HyphenProvider } from "../../../../src/providers";
import { GetTransferFeeRequest, GetTransferFeeResponse, GasTokenDistributionRequest, GasTokenDistributionResponse } from "../../../../src/types";
import * as networkUtils from "../../../../src/utils/network";
import { BigNumber, ethers, Wallet } from "ethers";
import { MockEthersProvider, MockEther } from "../../mocks/provider";
jest.mock("../../../../src/utils/network");

describe("deposit manager unit tests", () => {
    let depositManager: DepositManager;
    let wallet: Wallet;

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
        
        wallet = new MockEther().Wallet("0a308068097f54bb380363f9c607b2f2e4e651df82c4bd398331a2ea68028678");
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

    it("should successfully deposit Swap request", async () => {

        const dummyTxHash = "0x88E3aB861416b3711E7ECa29c840be607499A474";
        const request: DepositAndSwapRequest = {
            sender: "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c",
            receiver: "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c",
            tokenAddress: "0x64ef393b6846114bad71e2cb2ccc3e10736b5716",
            depositContractAddress: "0x8033Bd14c4C114C14C910fe05Ff13DB4C481a85D",
            amount: "100000000",
            fromChainId: "5",
            toChainId: "69",
            useBiconomy: false,
            dAppName: "test",
            swapRequest: [{
                tokenAddress: "0x4200000000000000000000000000000000000006",
                amount: "0",
                percentage: 200000000,
                operation: 0,
                path: "0x0000000000000000000000000000000000000000",
            }],
        }

        // mock getERC20Allowance method
        jest.spyOn(depositManager.tokenManager, "getERC20Allowance").mockResolvedValue(100000000);

        // mock _depositTokensToLPAndSwap method
        jest.spyOn(depositManager, "_depositTokensToLPAndSwap").mockResolvedValue(
            { hash:dummyTxHash, wait: (confirmations, ) => { 
                return {
                    to: "dummyAddress",
                    from: "dummyAddress",
                    contractAddress: "dummyAddress",
                    transactionIndex: 0,
                    root: "",
                    gasUsed: BigNumber.from(0),
                    logsBloom: "dummyLogs",
                    blockHash: "dummyBlockHash",
                    transactionHash: dummyTxHash,
                    logs: [],
                    blockNumber: 0,
                    confirmations: 0,
                    cumulativeGasUsed:BigNumber.from(0),
                    effectiveGasPrice: BigNumber.from(0),
                    byzantium: false,
                    type: 0,
                    status: 0
                } as ethers.providers.TransactionReceipt
            }
        });

        // mock listenForExitTransaction method
        jest.spyOn(depositManager, "listenForExitTransaction").mockResolvedValue();

        const response = await depositManager.depositAndSwap(request, wallet);
       
        console.log(response);

        expect(response?.hash).toEqual(dummyTxHash);
    });

    it("should successfully deposit Swap request: NATIVE Token", async () => {

        const dummyTxHash = "0x88E3aB861416b3711E7ECa29c840be607499A474";
        const request: DepositAndSwapRequest = {
            sender: "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c",
            receiver: "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c",
            tokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            depositContractAddress: "0x8033Bd14c4C114C14C910fe05Ff13DB4C481a85D",
            amount: "100000000000000",
            fromChainId: "5",
            toChainId: "69",
            useBiconomy: false,
            dAppName: "test",
            swapRequest: [{
                tokenAddress: "0x4200000000000000000000000000000000000006",
                amount: "0",
                percentage: 200000000,
                operation: 0,
                path: "0x0000000000000000000000000000000000000000",
            }],
        }

        // mock _depositTokensToLPAndSwap method
        jest.spyOn(depositManager, "_depositTokensToLPAndSwap").mockResolvedValue(
            { hash:dummyTxHash, wait: (confirmations, ) => { 
                return {
                    to: "dummyAddress",
                    from: "dummyAddress",
                    contractAddress: "dummyAddress",
                    transactionIndex: 0,
                    root: "",
                    gasUsed: BigNumber.from(0),
                    logsBloom: "dummyLogs",
                    blockHash: "dummyBlockHash",
                    transactionHash: dummyTxHash,
                    logs: [],
                    blockNumber: 0,
                    confirmations: 0,
                    cumulativeGasUsed:BigNumber.from(0),
                    effectiveGasPrice: BigNumber.from(0),
                    byzantium: false,
                    type: 0,
                    status: 0
                } as ethers.providers.TransactionReceipt
            }
        });

        // mock listenForExitTransaction method
        jest.spyOn(depositManager, "listenForExitTransaction").mockResolvedValue();

        const response = await depositManager.depositAndSwap(request, wallet);
       
        console.log(response);

        expect(response?.hash).toEqual(dummyTxHash);
    });

    it("should fail if allowance is 0", async () => {

        const dummyRejectionMessage = {
            "code": 150, 
            "message": "Not enough allowance given to Liquidity Pool Manager contract"
        };
        const request: DepositAndSwapRequest = {
            sender: "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c",
            receiver: "0xF86B30C63E068dBB6bdDEa6fe76bf92F194Dc53c",
            tokenAddress: "0x64ef393b6846114bad71e2cb2ccc3e10736b5716",
            depositContractAddress: "0x8033Bd14c4C114C14C910fe05Ff13DB4C481a85D",
            amount: "100000000",
            fromChainId: "5",
            toChainId: "69",
            useBiconomy: false,
            dAppName: "test",
            swapRequest: [],
        }

        // mock getERC20Allowance method
        jest.spyOn(depositManager.tokenManager, "getERC20Allowance").mockResolvedValue(0);

        expect(depositManager.depositAndSwap(request, wallet)).rejects.toEqual(dummyRejectionMessage);
    });
});
