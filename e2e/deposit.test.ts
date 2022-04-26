import { Hyphen, RESPONSE_CODES } from "../src/hyphen";
import { ethers } from "ethers";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, './.env') });


describe('deposit transaction cross-chain', () => {
    let testConfig: any = {};

    beforeAll(async () => {
        testConfig.providerURL = process.env.PROVIDER_URL;
        testConfig.provider = new ethers.providers.JsonRpcProvider(testConfig.providerURL);

        testConfig.privateKey = process.env.PRIVATE_KEY!;
        testConfig.wallet = new ethers.Wallet(testConfig.privateKey);
        testConfig.signer = testConfig.wallet.connect(testConfig.provider);

        testConfig.mumbaiID = process.env.MUMBAI_CHAIN_ID!;
        testConfig.goerliID = process.env.GOERLI_CHAIN_ID!;
        testConfig.tokenAddress = process.env.TOKEN_ADDRESS!;
        testConfig.lpContractAddress = process.env.LIQUIDITY_POOL_CONTRACT_ADDRESS!;

        testConfig.lpAllowanceAmountWei = process.env.LP_ALLOWANCE_AMOUNT_WEI!;
        testConfig.depositAmountWei = process.env.DEPOSIT_AMOUNT_WEI!;

        testConfig.defaultAccount = await testConfig.signer.getAddress();
    })

    it('should transfer USDT from Mumbai to Goerli', async () => {
        try {
            let hyphen = new Hyphen(testConfig.signer.provider, {
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

            await hyphen.init();

            expect(hyphen.options.defaultAccount).toEqual(testConfig.defaultAccount);

            // check and approve USDT tokens
            let preTransferStatus = await hyphen.depositManager.preDepositStatus({
                tokenAddress: testConfig.tokenAddress, // Token address on fromChain which needs to be transferred
                amount: testConfig.lpAllowanceAmountWei, // Amount of tokens to be transferred in smallest unit eg wei
                fromChainId: Number(testConfig.mumbaiID), // Chain id from where tokens needs to be transferred
                toChainId: Number(testConfig.goerliID), // Chain id where tokens are supposed to be sent
                userAddress: testConfig.defaultAccount // User wallet address who want's to do the transfer
            });

            expect(preTransferStatus.userAddress).toBe(testConfig.defaultAccount);

            if (preTransferStatus.code === RESPONSE_CODES.ALLOWANCE_NOT_GIVEN) {
                // ❌ Not enough apporval from user address on LiquidityPoolManager contract on fromChain
                let approveTx = await hyphen.tokens.approveERC20(
                    testConfig.tokenAddress,
                    testConfig.lpContractAddress,
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

            let depositTx = await hyphen.depositManager.deposit({
                sender: testConfig.defaultAccount,
                receiver: testConfig.defaultAccount,
                tokenAddress: testConfig.tokenAddress,
                depositContractAddress: testConfig.lpContractAddress,
                amount: testConfig.depositAmountWei,
                fromChainId: testConfig.mumbaiID,
                toChainId: testConfig.goerliID,
                useBiconomy: true,
                tag: "test"
            }, testConfig.wallet);

            expect(depositTx?.hash).toHaveLength(66);

            // Wait for 1 block confirmation
            await depositTx?.wait(1);
        }
        catch (error) {
            console.error(error);
        }
    });

});

