import React from 'react';
import { useEffect } from 'react';
import { Pool, InterestRate, EthereumTransactionTypeExtended } from "@aave/contract-helpers";
import { BigNumber, ethers } from 'ethers';
import tokenABI from './contract/GHOAbi.json'

function App() {

  const provider =  new ethers.providers.Web3Provider(window.ethereum);
  const ghoContractAddress = "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60"
  const signer = provider.getSigner()
  var tokenContract = new ethers.Contract(ghoContractAddress, tokenABI, signer)
  console.log(tokenContract)

  

  // const pool = new Pool(provider, {
  //   POOL: "0x3De59b6901e7Ad0A19621D49C5b52cC9a4977e52", // sepolia GHO market
  //   WETH_GATEWAY: "0x9c402E3b0D123323F0FCed781b8184Ec7E02Dd31", // sepolia GHO market
  // });
  

  // async function submitTransaction(tx: EthereumTransactionTypeExtended){
  //   const extendedTxData = await tx.tx();
  //   // const { from, ...txData } = extendedTxData;
  //   // const signer = provider.getSigner(from);
  //   // const txResponse = await signer.sendTransaction({
  //   //   ...txData,
  //   //   value: txData.value ? BigNumber.from(txData.value) : undefined,
  //   // });
  //   // console.log(txResponse)
  // }



  const sendGHO = async () => {
    const howMuchTokens = ethers.utils.parseUnits('1', 18)
    const tx = await tokenContract.transfer("0x03DDEBb6470320d6fA0C95763D7f74bB3DA6718F", howMuchTokens)
    console.log(tx)

  }

  useEffect(() => {

    const executeMint = async () => {
      //write this line on first page load
      //await provider.send("eth_requestAccounts", []);
    
      
      // const signer = provider.getSigner(accounts[0])
      // const contractSigner = tokenContract.connect(signer)
      

      

      // const txs: EthereumTransactionTypeExtended[] = await pool.borrow({
      //   user: "0xB0138E967807ccdA91a7aA9abd1d2183cC3D2260",
      //   reserve: "0xcbE9771eD31e761b744D3cB9eF78A1f32DD99211", // Goerli GHO market
      //   amount: "1",
      //   interestRateMode: InterestRate.Stable,
      //   debtTokenAddress: "0x80aa933EfF12213022Fd3d17c2c59C066cBb91c7"
      // })

     
      // console.log(txs)
      // submitTransaction(txs[0])




    }

    executeMint()


    
  }, [])


  return (
    <div className="App">
      hello
    </div>
  );
}

export default App;
