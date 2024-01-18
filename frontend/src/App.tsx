import React, { useState } from 'react';
import { useEffect } from 'react';
import { Pool, InterestRate, EthereumTransactionTypeExtended } from "@aave/contract-helpers";
import { BigNumber, ethers } from 'ethers';
import tokenABI from './contract/GHOAbi.json'
import AAVE_ABI from "./contract/aave_abi"
import subscriptionABI from './contract/subscriptionABI.json'

function App() {

  const provider =  new ethers.providers.Web3Provider(window.ethereum);
  const ghoContractAddress = "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60"
  const signer = provider.getSigner()
  var tokenContract = new ethers.Contract(ghoContractAddress, tokenABI, signer)
  
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
  
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
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
      await signer.getAddress(),
    );
    const transaction = await tx.wait();
    console.log(transaction)
  }


  const supplyGHOAsCollateral = async () => {
    //to do
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
      </ol>

      <button onClick={executePermit}>Click to Subscribe</button>
      <button onClick={executeAllPayments}>Click to execute All payments</button>


      
    </div>
  );
}

export default App;
