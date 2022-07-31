import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";
import { Hyphen, RESPONSE_CODES } from "../../src/hyphen";
import { GetTransferFeeRequest, GasTokenDistributionRequest } from "../../src/types";

dotenv.config({ path: path.resolve(__dirname, './.env') });


describe('deposit manager e2e tests', () => {
    let testConfig: any = {};
    let hyphenSDKMumbai: Hyphen;
    let hyphenSDKGoerli: Hyphen;

    beforeAll(async () => {
        testConfig.providerURLGoerli = process.env.PROVIDER_URL_GOERLI;
        testConfig.providerURLMumbai = process.env.PROVIDER_URL_MUMBAI;
        testConfig.providerGoerli = new ethers.providers.JsonRpcProvider(testConfig.providerURLGoerli);
        testConfig.providerMumbai = new ethers.providers.JsonRpcProvider(testConfig.providerURLMumbai);
        testConfig.optimismWethAddress = process.env.OP_WETH_ADDRESS;

        testConfig.privateKey = process.env.PRIVATE_KEY!;
        testConfig.wallet = new ethers.Wallet(testConfig.privateKey);
        testConfig.signerGoerli = testConfig.wallet.connect(testConfig.providerGoerli);
        testConfig.signerMumbai = testConfig.wallet.connect(testConfig.providerMumbai);

        testConfig.mumbaiID = process.env.MUMBAI_CHAIN_ID!;
        testConfig.goerliID = process.env.GOERLI_CHAIN_ID!;
        testConfig.kovanOptimismID = process.env.KOVAN_OP_CHAIN_ID!;
        testConfig.tokenAddressMumbai = process.env.TOKEN_ADDRESS_MUMBAI!;
        testConfig.tokenAddressGoerli = process.env.TOKEN_ADDRESS_GOERLI!;
        testConfig.lpContractAddressGoerli = process.env.LIQUIDITY_POOL_CONTRACT_ADDRESS_GOERLI!;
        testConfig.lpContractAddressMumbai = process.env.LIQUIDITY_POOL_CONTRACT_ADDRESS_MUMBAI!;

        testConfig.lpAllowanceAmountWei = process.env.LP_ALLOWANCE_AMOUNT_WEI!;
        testConfig.depositAmountWei = process.env.DEPOSIT_AMOUNT_WEI!;

        testConfig.defaultAccount = await testConfig.signerGoerli.getAddress();

        hyphenSDKGoerli = new Hyphen(testConfig.signerGoerli.provider, {
            debug: true, // If 'true', it prints debug logs on console window
            environment: "staging", // It can be "test" or "prod"
            onFundsTransfered: (data) => {
                // console.log("funds transferred: \n", data);
            },
            defaultAccount: testConfig.defaultAccount,
            // signatureType: SIGNATURE_TYPES.PERSONAL,
            infiniteApproval: false,
            transferCheckInterval: -1, // Interval in milli seconds to check for transfer status
            biconomy: {
                enable: false,
                apiKey: "",
                debug: true
            }
        });

        hyphenSDKMumbai = new Hyphen(testConfig.signerMumbai.provider, {
            debug: true, // If 'true', it prints debug logs on console window
            environment: "staging", // It can be "test" or "prod"
            onFundsTransfered: (data) => {
                // console.log("funds transferred: \n", data);
            },
            defaultAccount: testConfig.defaultAccount,
            // signatureType: SIGNATURE_TYPES.PERSONAL,
            infiniteApproval: false,
            transferCheckInterval: -1, // Interval in milli seconds to check for transfer status
            biconomy: {
                enable: false,
                apiKey: "",
                debug: true
            }
        });

        await hyphenSDKGoerli.init();

        expect(hyphenSDKGoerli.options.defaultAccount).toEqual(testConfig.defaultAccount);

        await hyphenSDKMumbai.init();

        expect(hyphenSDKMumbai.options.defaultAccount).toEqual(testConfig.defaultAccount);
    });

    describe('deposit transaction cross-chain', () => {
        it('should transfer USDT from Mumbai to Goerli', async () => {
            // check and approve USDT tokens
            let preTransferStatus = await hyphenSDKMumbai.depositManager.preDepositStatus({
                tokenAddress: testConfig.tokenAddressMumbai, // Token address on fromChain which needs to be transferred
                amount: testConfig.lpAllowanceAmountWei, // Amount of tokens to be transferred in smallest unit eg wei
                fromChainId: Number(testConfig.mumbaiID), // Chain id from where tokens needs to be transferred
                toChainId: Number(testConfig.goerliID), // Chain id where tokens are supposed to be sent
                userAddress: testConfig.defaultAccount // User wallet address who want's to do the transfer
            });
            
            expect(preTransferStatus.userAddress).toBe(testConfig.defaultAccount);

            if (preTransferStatus.code === RESPONSE_CODES.ALLOWANCE_NOT_GIVEN) {
                // ❌ Not enough apporval from user address on LiquidityPoolManager contract on fromChain
                let approveTx = await hyphenSDKMumbai.tokens.approveERC20(
                    testConfig.tokenAddressMumbai,
                    testConfig.lpContractAddressMumbai,
                    testConfig.lpAllowanceAmountWei, // 1000 USDT
                    testConfig.defaultAccount,
                    false,
                    false,
                    testConfig.wallet
                );

                expect(approveTx?.hash).toHaveLength(66);

                // ⏱Wait for the transaction to confirm, pass a number of blocks to wait as param
                await approveTx?.wait(5);

                // NOTE: Whenever there is a transaction done via SDK, all responses
                // will be ethers.js compatible with an async wait() function that
                // can be called with 'await' to wait for transaction confirmation.
            }

            let depositTx = await hyphenSDKMumbai.depositManager.deposit({
                sender: testConfig.defaultAccount,
                receiver: testConfig.defaultAccount,
                tokenAddress: testConfig.tokenAddressMumbai,
                depositContractAddress: testConfig.lpContractAddressMumbai,
                amount: testConfig.depositAmountWei,
                fromChainId: testConfig.mumbaiID,
                toChainId: testConfig.goerliID,
                useBiconomy: true,
                dAppName: "test"
            }, testConfig.wallet);

            expect(depositTx?.hash).toHaveLength(66);

            // Wait for 1 block confirmation
            await depositTx?.wait(5);
        });
    });

    describe('get transfer fees for cross-chain deposit transaction', () => {
        it('should successfully get the transfer fees', async () => {
            const request: GetTransferFeeRequest = {
                fromChainId: testConfig.mumbaiID,
                toChainId: testConfig.goerliID,
                tokenAddress: testConfig.tokenAddressMumbai,
                amount: testConfig.depositAmountWei,
            };

            const response = await hyphenSDKMumbai.depositManager.getTransferFee(request);

            expect(response.code).toBe(RESPONSE_CODES.SUCCESS);

            console.log(Number(response.netTransferFee))
            console.log(Number(response.transferFee))
            console.log(Number(response.reward))

            expect(Number(response.netTransferFee))
                .toBe(
                    Number(response.transferFee) - Number(response.reward)
                );
        });

        it('should fail get the fees due to insufficient liquidity', async () => {
            const request: GetTransferFeeRequest = {
                fromChainId: testConfig.mumbaiID,
                toChainId: testConfig.goerliID,
                tokenAddress: testConfig.tokenAddressMumbai,
                amount: "99999999999999999999999999999999999999999999999999",
            };

            const response = await hyphenSDKMumbai.depositManager.getTransferFee(request);

            expect(response.code).toBe(RESPONSE_CODES.NO_LIQUIDITY);
            expect(response.responseCode).toBe(RESPONSE_CODES.EXPECTATION_FAILED);
        });
    });

    describe('Get GasToken Distribution', () => {
        it('should successfully get GasToken Distribution', async () => {
            const request: GasTokenDistributionRequest = {
                fromChainId: 5,
                fromChainTokenAddress: testConfig.tokenAddressGoerli,
                amount: "1000000000000000000000"
            };

            const response = await hyphenSDKGoerli.depositManager.getGasTokenDistribution(request);

            expect(response.code).toBe(RESPONSE_CODES.SUCCESS);
            expect(response.message).toBe("GasTokenDistribution calculated successfully");

        });

        it('should fail for wrong chainId', async () => {
            const request: GasTokenDistributionRequest = {
                fromChainId: 999,
                fromChainTokenAddress: testConfig.tokenAddressGoerli,
                amount: "1000000000000000000000"
            }

            const response = await hyphenSDKGoerli.depositManager.getGasTokenDistribution(request);

            expect(response.code).toBe(RESPONSE_CODES.ERROR_RESPONSE);
            expect(response.message).toBe("No network configuration found for chainId: 999");
            expect(response.responseCode).toBe(RESPONSE_CODES.ERROR_RESPONSE);
        });
    });

    describe('deposit and swap transaction cross-chain', () => {
        it('should transfer USDC and swapData from Goerli to kovanOptimism', async () => {
            // check and approve USDT tokens

            let preTransferStatus = await hyphenSDKGoerli.depositManager.preDepositStatus({
                tokenAddress: testConfig.tokenAddressGoerli, // Token address on fromChain which needs to be transferred
                amount: testConfig.lpAllowanceAmountWei, // Amount of tokens to be transferred in smallest unit eg wei
                fromChainId: Number(testConfig.goerliID), // Chain id from where tokens needs to be transferred
                toChainId: Number(testConfig.kovanOptimismID), // Chain id where tokens are supposed to be sent
                userAddress: testConfig.defaultAccount // User wallet address who want's to do the transfer
            });

            if (preTransferStatus.code === RESPONSE_CODES.ALLOWANCE_NOT_GIVEN) {
                // ❌ Not enough apporval from user address on LiquidityPoolManager contract on fromChain
                let approveTx = await hyphenSDKGoerli.tokens.approveERC20(
                    testConfig.tokenAddressGoerli,
                    testConfig.lpContractAddressGoerli,
                    testConfig.lpAllowanceAmountWei, // 1000 USDT
                    testConfig.defaultAccount,
                    false,
                    false,
                    testConfig.wallet
                );
                console.log(approveTx?.hash);
                expect(approveTx?.hash).toHaveLength(66);

                // ⏱Wait for the transaction to confirm, pass a number of blocks to wait as param
                await approveTx?.wait(5);

                // NOTE: Whenever there is a transaction done via SDK, all responses
                // will be ethers.js compatible with an async wait() function that
                // can be called with 'await' to wait for transaction confirmation.
            }

            let depositTx = await hyphenSDKGoerli.depositManager.depositAndSwap({
                sender: testConfig.defaultAccount,
                receiver: testConfig.defaultAccount,
                tokenAddress: testConfig.tokenAddressGoerli,
                depositContractAddress: testConfig.lpContractAddressGoerli,
                amount: testConfig.depositAmountWei,
                fromChainId: testConfig.goerliID,
                toChainId: testConfig.kovanOptimismID,
                useBiconomy: false,
                dAppName: "test",
                swapRequest: [{
                    tokenAddress: testConfig.optimismWethAddress,
                    amount: "0",
                    percentage:200000000,
                    operation: 0,
                    path: "0x0000000000000000000000000000000000000000",
                }],
            }, testConfig.wallet);

            console.log(depositTx?.hash);
            expect(depositTx?.hash).toHaveLength(66);

            // Wait for 1 block confirmation
            let confirmation = await depositTx?.wait(1);
            expect(confirmation?.status).toBe("0x1"); 
        });
    });
});
