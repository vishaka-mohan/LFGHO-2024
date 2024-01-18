import {ethers } from 'ethers';
import tokenABI from "./contract/GHOAbi.json"
import subscriptionABI from "./contract/subscriptionABI.json"
import AAVE_ABI from "./contract/aave_abi"

class Payment {

  private provider:any;
  private signer:any;
  private tokenContract:any;
  private subscriptionContract:any;
  private contractAddress:any;
  private domainName:any;
  private domainVersion:any;
  private chainId:any;
  private subscriptionContractAddress:any;
  private domain:any;
  private types:any;


  constructor(provider:any) {
    this.contractAddress = "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60"  
    this.domainName = "Gho Token" 
    this.domainVersion = "1" 
    this.chainId = 11155111 
    this.subscriptionContractAddress = "0xCba5c99d60A914f6E4579EBB6D44d0f192f6DC71"
    this.domain = {
      name: this.domainName,
      version: this.domainVersion,
      verifyingContract: this.contractAddress,
      chainId: this.chainId
    }
    this.types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    }
    this.provider = provider;
    this.signer = provider.getSigner()
    this.tokenContract = new ethers.Contract(this.contractAddress, tokenABI, this.signer)
    this.subscriptionContract = new ethers.Contract(this.subscriptionContractAddress, subscriptionABI, this.signer )
  }

  public async splitSig(sig: any){
    // splits the signature to r, s, and v values.
    const signature = ethers.utils.splitSignature(sig)
    return signature
  }

  public async signTyped (dataToSign: any){
    // call this method to sign EIP 712 data
    const rawSig = await this.signer._signTypedData(this.domain, this.types, dataToSign)
    console.log(rawSig)
    return rawSig
  }


  public async createPermit(spender: any, value: any, nonce: any, deadline: any){
    const accounts = await this.provider.send("eth_requestAccounts", [])
    const dataToSign = {
      owner: accounts[0],
      spender: spender,
      value: value,
      nonce: nonce,
      deadline: deadline
    }

    const signature = await this.signTyped(dataToSign)
    const split = await this.splitSig(signature)

    const recovered = ethers.utils.verifyTypedData(
      this.domain,
      this.types,
      dataToSign,
      split
    );
    console.log(recovered)
    return {
       split, signature
    }
  }

  public async allowPermit(spender: any, value: any, deadline: any, sig: any){
    const accounts = await this.provider.send("eth_requestAccounts", [])
    const gasPrice = await this.provider.getGasPrice()
    console.log(accounts[0])
    let tx = await this.tokenContract.connect(this.signer).permit(
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
    console.log(`Check allowance of tokenReceiver: ${await this.tokenContract.allowance(accounts[0], spender)}`);
  }



  

  public async sendGHO(receiver:any,sendToken:any){
    const howMuchTokens = ethers.utils.parseUnits(sendToken, 18)
    const tx = await this.tokenContract.transfer(receiver, howMuchTokens)
    console.log(tx)

  }

  public async borrowGHO(borrowedTokenCount:any){
    // await this.provider.send('eth_requestAccounts', [])
    try{
    const aave = new ethers.Contract("0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", AAVE_ABI, this.signer);
    console.log("aave is ",aave)
    const tx = await aave.borrow(
      "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
      ethers.utils.parseUnits(borrowedTokenCount, 18),
      2,
      0,
      await this.signer.getAddress(),
    );
    console.log("tx is ",tx)
    const transaction = await tx.wait();
    console.log("transaction is ",transaction)
    return true;
    }
    catch(err:any){
      console.log(err);
      if(err.message.includes("execution reverted: 34")){
        return false;
      }
      return true;
    }
  }


  public async supplyGHOAsCollateral(){
    //to do
  }

  public async executePermit(){
    const accounts = await this.provider.send("eth_requestAccounts", [])
    const nonces = await this.tokenContract.nonces(accounts[0])
    console.log(nonces)
    //2nd argument is amount of gho contract is permitted to use on behalf of signer -> make it input
    const permit = await this.createPermit(this.subscriptionContractAddress, ethers.utils.parseUnits('100000', 18), parseInt(nonces._hex, 16), 2661766724)
    console.log(permit)
    


    await this.allowPermit(this.subscriptionContractAddress, ethers.utils.parseUnits('10', 18), 2661766724, permit.split)
    //1st argument is receiver -> make it input
    await this.subscribe("0x03DDEBb6470320d6fA0C95763D7f74bB3DA6718F", ethers.utils.parseUnits('2', 18), 30, 6400)
  }

  public async subscribe(receiverAddress: any, amount: any, frequency: any, endTime: any) {
    const accounts = await this.provider.send("eth_requestAccounts", [])
    console.log(`Check allowance of tokenReceiver: ${await this.tokenContract.allowance(accounts[0], this.subscriptionContractAddress)}`)
    const tx = await this.subscriptionContract.subscribe(receiverAddress, amount,frequency,endTime)
    console.log(tx)
  
  }

  public async executeAllPayments(){
    const tx = await this.subscriptionContract.executeAllPayments()
    console.log(tx)
  }
}

export default Payment;