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

We have demonstrated one use of the SDK by enabling users to perform all GHO-related actions directly within Metamask wallet using Snaps with a natural language interface. Users can now execute transactions effortlessly by typing simple instructions like "borrow 10 GHO." and SDK abstracts away the complexities of navigating lending pool sites, supplying collateral, and borrowing GHO, providing users with a frictionless experience.

## Installation

```console
npm i ghomni-lib
```

## Usage
```console

const payment = new Payment(new ethers.providers.Web3Provider(window.ethereum))
const borrowGHOStatus = await payment.borrowGHO(10)
```