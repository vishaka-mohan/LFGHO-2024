import React, { useState } from 'react';
import { useEffect } from 'react';
import { Pool, InterestRate, EthereumTransactionTypeExtended } from "@aave/contract-helpers";
import { BigNumber, ethers } from 'ethers';
import tokenABI from './contract/GHOAbi.json'
import AAVE_ABI from "./contract/aave_abi"
import subscriptionABI from './contract/subscriptionABI.json'
import usdcABI from './contract/usdcABI.json'
import usdcVariableDebtABI from './contract/usdcVariableDebtABI.json'

function App() {

  const provider =  new ethers.providers.Web3Provider(window.ethereum);
  const ghoContractAddress = "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60"
  const signer = provider.getSigner()
  var tokenContract = new ethers.Contract(ghoContractAddress, tokenABI, signer)

  const usdcDebtTokenAddress = "0x54bdE009156053108E73E2401aEA755e38f92098"
  
  //variables for subscription signature
  const domainName = "Gho Token" // put your token name 
  const domainVersion = "1" // leave this to "1"
  const chainId = 11155111 // this is for the chain's ID. value is 1 for remix
  const contractAddress = ghoContractAddress // Put the address here from remix

  const subscriptionContractAddress = "0xCba5c99d60A914f6E4579EBB6D44d0f192f6DC71"

  const subscriptionContract :any= new ethers.Contract(subscriptionContractAddress, subscriptionABI, signer )
  

  const [account, setAccount] = useState("")

  const domain = {
    name: domainName,
    version: domainVersion,
    verifyingContract: contractAddress,
    chainId: chainId
  }


  const domainDelegation = {
    name: "Aave Ethereum Variable Debt USDC",
    version: domainVersion,
    verifyingContract: usdcDebtTokenAddress,
    chainId: chainId
  }
  
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  }
  const typesDelegation = {
    Delegation: [
      { name: "delegator", type: "address" },
      { name: "delegatee", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  }

  


  const splitSig = async (sig: any) => {
    // splits the signature to r, s, and v values.
    const signature = ethers.utils.splitSignature(sig)

    return signature
  }

  const signTyped = async (dataToSign: any) => {
    // call this method to sign EIP 712 data
    const rawSig = await signer._signTypedData(domain, types, dataToSign)
    console.log(rawSig)
    return rawSig
  }

  const signTypedDelegation = async (dataToSign: any) => {
    // call this method to sign EIP 712 data
    const rawSig = await signer._signTypedData(domainDelegation, typesDelegation, dataToSign)
    console.log(rawSig)
    return rawSig
  }


  async function createPermit(spender: any, value: any, nonce: any, deadline: any) {
    const accounts = await provider.send("eth_requestAccounts", [])
    const dataToSign = {
      owner: accounts[0],
      spender: spender,
      value: value,
      nonce: nonce,
      deadline: deadline
    }

    const signature = await signTyped(dataToSign)
    const split = await splitSig(signature)

    const recovered = ethers.utils.verifyTypedData(
      domain,
      types,
      dataToSign,
      split
    );
      console.log(recovered)
    return {
       split, signature
    }
  }

  const allowPermit = async (spender: any, value: any, deadline: any, sig: any) => {
    const accounts = await provider.send("eth_requestAccounts", [])
    const gasPrice = await provider.getGasPrice()
    console.log(accounts[0])
    let tx = await tokenContract.connect(signer).permit(
      accounts[0],
      spender,
      value,
      deadline,
      sig.v,
      sig.r,
      sig.s, {
        gasPrice: gasPrice,
        gasLimit: 80000 //hardcoded gas limit; change if needed
      }
    );
  
    await tx.wait(2) //wait 2 blocks after tx is confirmed
    console.log(tx)
  
    // check that the tokenReceiver address can now spend tokens on behalf of the tokenOwner
    console.log(`Check allowance of tokenReceiver: ${await tokenContract.allowance(accounts[0], spender)}`);
  
  }


  
    
  


  const connectWallet = async () => {
   
    // if (window.ethereum) {
       
    //     window.ethereum
    //         .request({ method: "eth_requestAccounts" })
    //         .then((res: any) =>
    //           {
    //             console.log("res", res)
    //             setAccounts(res[0])
    //           }
    //         );
    // } else {
    //     alert("install metamask extension!!");
    // }
     //write this line on first page load
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0])
    console.log(accounts)

    const nonces = await tokenContract.nonces(accounts[0])
    console.log(parseInt(nonces._hex, 16))
    // await borrowGHO();

  }

  

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
      "0xB0138E967807ccdA91a7aA9abd1d2183cC3D2260",
    );
    const transaction = await tx.wait();
    console.log(transaction)
  }


  const allowTokenSpending = async () => {
    const usdc = new ethers.Contract("0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", usdcABI, signer)
    const accounts = await provider.send("eth_requestAccounts", [])
    const tx = await usdc.approve("0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", ethers.utils.parseUnits("1000000", 6))
    await tx.wait()
  }

  const supplyUSDC = async () => {
    const aave = new ethers.Contract("0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", AAVE_ABI, signer);
    const accounts = await provider.send("eth_requestAccounts", [])

      const tx = await aave.supply(
        "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
        ethers.utils.parseUnits("10000", 6),
        accounts[0],
        0,
      );
      await tx.wait();
  }



  const executePermit = async () => {
    const accounts = await provider.send("eth_requestAccounts", [])
    const nonces = await tokenContract.nonces(accounts[0])
    console.log(nonces)
    //2nd argument is amount of gho contract is permitted to use on behalf of signer -> make it input
    const permit = await createPermit(subscriptionContractAddress, ethers.utils.parseUnits('100000', 18), parseInt(nonces._hex, 16), 2661766724)
    console.log(permit)
    


    await allowPermit(subscriptionContractAddress, ethers.utils.parseUnits('10', 18), 2661766724, permit.split)
    //1st argument is receiver -> make it input
    await subscribe("0x03DDEBb6470320d6fA0C95763D7f74bB3DA6718F", ethers.utils.parseUnits('2', 18), 30, 6400)
  }

  const subscribe = async (receiverAddress: any, amount: any, frequency: any, endTime: any) => {
    const accounts = await provider.send("eth_requestAccounts", [])
    console.log(`Check allowance of tokenReceiver: ${await tokenContract.allowance(accounts[0], subscriptionContractAddress)}`)
    const tx = await subscriptionContract.subscribe(receiverAddress, amount,frequency,endTime)
    console.log(tx)
  
  }

  const executeAllPayments = async () => {
    const tx = await subscriptionContract.executeAllPayments()
    console.log(tx)
  }


  async function createPermitForDelegation(delegatee: any, nonce: any, value: any, deadline: any) {

    
    const accounts = await provider.send("eth_requestAccounts", [])
  
    const dataToSign = {
      delegator: accounts[0],
      delegatee: delegatee,
      value: value,
      nonce: nonce,
      deadline: deadline
    }

    const signature = await signTypedDelegation(dataToSign)
    const split = await splitSig(signature)

    const recovered = ethers.utils.verifyTypedData(
      domainDelegation,
      typesDelegation,
      dataToSign,
      split
    );
      console.log(recovered)
    return {
       split, signature
    }
  }


  const allowDelegation = async (delegatee: any, value: any, deadline: any) => {
    const accounts = await provider.send("eth_requestAccounts", [])
    const gasPrice = await provider.getGasPrice()


    const usdcDebtToken = new ethers.Contract("0x54bdE009156053108E73E2401aEA755e38f92098", usdcVariableDebtABI, signer);
    console.log(usdcDebtToken)

    let tx = await usdcDebtToken.approveDelegation(
     
      delegatee,
      value,
  
    );
  
    await tx.wait(2) //wait 2 blocks after tx is confirmed
    console.log(tx)

  
  }

  const executeDelegation = async () => {
    
    const usdcDebtToken = new ethers.Contract("0x54bdE009156053108E73E2401aEA755e38f92098", usdcVariableDebtABI, signer)
    const accounts = await provider.send("eth_requestAccounts", [])
    const nonces = await usdcDebtToken.nonces(accounts[0])
    
    console.log(parseInt(nonces._hex, 16))
    // const permit = await createPermitForDelegation("0x050d6fE32A00e60CD9B2ccDA94D6A549d9a30838", ethers.utils.parseUnits('100', 6), parseInt(nonces._hex, 16), 2661766724)
    // console.log(permit)
    


    await allowDelegation("0x050d6fE32A00e60CD9B2ccDA94D6A549d9a30838", ethers.utils.parseUnits("100", 6), 2661766724)

    
  }

  useEffect(() => {

   

    connectWallet()
    

    
    
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
        <li>Note that a new user has to first approve the aave pool contract to use their usdc tokens. so click approve usdc first. then they need to supply usdc into the pool. after that they can borrow GHO.</li>
      </ol>

      <button onClick={executePermit}>Click to Subscribe</button>
      <button onClick={executeAllPayments}>Click to execute All payments</button>
      <button onClick={supplyUSDC}>Click to supply USDC</button>
      <button onClick={borrowGHO}>Click to borrow GHO</button>
      <button onClick={allowTokenSpending}>Click to approve USDC</button>
      <button onClick={executeDelegation}>Click to delegate</button>

      
    </div>
  );
}

export default App;
