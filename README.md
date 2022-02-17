# Hyphen SDK \(Hyphen\)

## Introduction

Hyphen SDK, is a javascript based SDK written in typescript that helps in integrating <a href="https://docs.biconomy.io/products/hyphen-instant-cross-chain-transfers" target="_blank">Hyphen</a> services easily. It provides some helper methods that makes the Hyphen integration too easy. Even though you can just interact with LiquidityPoolManager smart contract directly and deposit the tokens using depositErc20 method from your DApp and do the deposit transactions but using SDK is recommended as it provides methods like checking available liquidity before doing the transaction, checking exit transaction status, checking approvals etc.

Check out the <a href="https://docs.biconomy.io/products/hyphen-instant-cross-chain-transfers" target="_blank">documentation</a> for more details.

## Let’s Get Started


### Import and Instantiate Hyphen
<code>npm install @biconomy/hyphen</code>

or

<code>yarn add @biconomy/hyphen</code>

```
import { Hyphen } from "@biconomy/hyphen";

let hyphen = new Hyphen(<Provider Object>, {
  debug: true,            // If 'true', it prints debug logs on console window
  environment: "test",    // It can be "test" or "prod"
  onFundsTransfered: (data) => {
    // Callback method which will be called when funds transfer across
    // chains will be completed
  }
});
```
 
### Initialize the SDK

```
await hyphen.init();
```

### Doing a Cross Chain Transfer
```
let depositTx = await hyphen.deposit({
    sender: "User wallet address",
    receiver: "Receiver address on toChain. Can be different than sender",
    tokenAddress: "Address of the token on fromChain to be transferred",
    depositContractAddress: "LiquidityPoolManager address on fromChain",
    amount: "Amount to be transferred. Denoted in smallest unit eg in wei",
    fromChainId: 137, // chainId of fromChain
    toChainId: 1,     // chainId of toChain
});

// Wait for 1 block confirmation
await depositTx.wait(1);
```


