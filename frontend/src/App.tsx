import React from 'react';
import { useEffect } from 'react';
import { Pool, InterestRate, EthereumTransactionTypeExtended } from "@aave/contract-helpers";
import { BigNumber, ethers } from 'ethers';
import tokenABI from './contract/GHOAbi.json'
import AAVE_ABI from "./contract/aave_abi"

function App() {

  const provider =  new ethers.providers.Web3Provider(window.ethereum);
  const ghoContractAddress = "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60"
  const signer = provider.getSigner()
  var tokenContract = new ethers.Contract(ghoContractAddress, tokenABI, signer)
  console.log(tokenContract)

  

  

  const sendGHO = async () => {
    const howMuchTokens = ethers.utils.parseUnits('1', 18)
    const tx = await tokenContract.transfer("0x03DDEBb6470320d6fA0C95763D7f74bB3DA6718F", howMuchTokens)
    console.log(tx)

  }

  const borrowGHO = async () => {
    const aave = new ethers.Contract("0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", AAVE_ABI, signer);

    const tx = await aave.borrow(
      "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
      ethers.utils.parseUnits("2", 18),
      2,
      0,
      await signer.getAddress(),
    );
    const transaction = await tx.wait();
    console.log(transaction)
  }


  const supplyGHOAsCollateral = async () => {
    //to do
  }

  useEffect(() => {

    //write this line on first page load
    //await provider.send("eth_requestAccounts", []);
    
  }, [])


  return (
    <div className="App">
      hello. Next steps.
      <ol>
        <li>Implement sendGHO, borrowGHO, supplyGHO, repayGHO, credit delegation as methods to be used by others right out of the box</li>
        <li>Implement snap - set up GPT API</li>
        <li>Implement subscription contractwith frontend + make SDK method for easy usage</li>
        <li>Integrate subscription with snaps</li>
        <li>Look for other operations like swaps andcross chain stuff with chainlink ccip</li>
        <li>Try to use Family</li>
      </ol>
    </div>
  );
}

export default App;
