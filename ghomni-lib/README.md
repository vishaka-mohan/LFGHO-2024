# ghomni-lib

# Description

ghomni-lib is an abstracted toolkit to build using GHO including recurring payments, credit delegation, borrowing tokens etc.

GHOmni introduces a comprehensive SDK (Software Development Kit) aimed at simplifying and streamlining GHO payments. This innovative SDK is designed to offer a range of ready-to-use method like:

Send GHO: Facilitate quick and hassle-free GHO transactions with a simple function call, ensuring efficient peer-to-peer transfers.

Borrow GHO: Enable users to effortlessly borrow GHO directly through the SDK, eliminating the need for complex lending pool interactions.

Supply Token as Collateral: Simplify the process of supplying tokens as collateral in the pool, making it accessible and user-friendly.

Permit with Signature: Streamline transaction authorization with a signature-based permitting system to empower auto recurring payments without the user having to sign the transaction every month

Make Auto-Recurring Payments: Out-of-the-box method to automate recurring payments through the SDK, providing users with a convenient and time-saving solution.

Transfer GHO Cross-Chain: Expand the scope of GHO transactions by facilitating cross-chain transfers using CCIP

Credit Delegation: Empower users with the ability to delegate credit seamlessly



## Installation

```console
npm i ghomni-lib
```

## Usage

### Import Payment Module
```console
import Payment from 'ghomni-lib'
```

### Instantiate Payment Object
```console
const payment = new Payment(new ethers.providers.Web3Provider(window.ethereum))
```

### Send GHO token to a given address
```console
 payment.sendGHO(receiverAddress,numberOfGHOToken)
```

### Supply collateral to the pool (Supports USDC as collateral as of now)
```console
 payment.supplyUSDC(collateralAmount)
```


### Borrow GHO from liquidity pool
```console
const borrowGHOStatus = await payment.borrowGHO(tokensToBeBorrowed)
```

### Setup recurring payment to a given address at specified intervals
```console
 await payment.setupRecurringPayment(receiver,subscriptionAmount,frequency,endTime)
```

### Allow credit delegation to a given address
```console
  await payment.allowDelegation(delegateeAddress,amountToBeDelegated,deadline)
```

### Cross Chain Transfer (supports transfer from Ethereum Sepolia to Arbitrum Sepolia as of now)
```console
  await payment.transferGHOCrossChain(amountToTransfer,receiverAddress)
```

### 
```console
  await createPermit(spender: any, value: any, nonce: any, deadline: any) nonce sab dena hai na isme
```

