import {ethers } from 'ethers';
import tokenABI from "./contract/GHOAbi.json"
import subscriptionABI from "./contract/subscriptionABI.json"
import AAVE_ABI from "./contract/aave_abi"
import usdcABI from './contract/usdcABI.json'
import usdcVariableDebtABI from './contract/usdcVariableDebtABI.json'
import ccipTokenTransferABI from './contract/ccipTokenTransferABI.json'

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
  private usdcDebtTokenAddress:any
  private domainDelegation:any
  private typesDelegation:any
  constructor(provider:any) {
    this.contractAddress = "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60"  
    this.domainName = "Gho Token" 
    this.domainVersion = "1" 
    this.chainId = 11155111 
    this.subscriptionContractAddress = "0xCba5c99d60A914f6E4579EBB6D44d0f192f6DC71"
    this.usdcDebtTokenAddress = "0x54bdE009156053108E73E2401aEA755e38f92098";

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
    this.domainDelegation = {
      name: "Aave Ethereum Variable Debt USDC",
      version: this.domainVersion,
      verifyingContract: this.usdcDebtTokenAddress,
      chainId: this.chainId
    }

    this.typesDelegation = {
      Delegation: [
        { name: "delegator", type: "address" },
        { name: "delegatee", type: "address" },
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
    console.log("going to trigger permit contract connect")
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
    console.log("after permit contract connect")

    await tx.wait(2) 
    console.log(tx)
    // check that the tokenReceiver address can now spend tokens on behalf of the tokenOwner
    console.log(`Check allowance of tokenReceiver: ${await this.tokenContract.allowance(accounts[0], spender)}`);
  }


  public async sendGHO(receiver:any,sendToken:any){
    const howMuchTokens = ethers.utils.parseUnits(sendToken, 18)
    const tx = await this.tokenContract.transfer(receiver, howMuchTokens)
  }

  public async borrowGHO(borrowedTokenCount:any){
    try{
    const aave = new ethers.Contract("0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", AAVE_ABI, this.signer);
    const tx = await aave.borrow(
      "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60",
      ethers.utils.parseUnits(borrowedTokenCount, 18),
      2,
      0,
      await this.signer.getAddress(),
    );
    const transaction = await tx.wait();
    return true;
    }
    catch(err:any){
      console.log(err);
      if(err.message.includes("execution reverted")){
        return false;
      }
      return true;
    }
  }

  public async permitTokenSpend(maxSpend) {
    const usdc = new ethers.Contract("0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", usdcABI, this.signer)
    const accounts = await this.provider.send("eth_requestAccounts", [])
    const tx = await usdc.approve("0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", ethers.utils.parseUnits(maxSpend.toString(), 6))
    await tx.wait()
  }

  public async  supplyUSDC(supplyCount:any){
    const aave = new ethers.Contract("0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", AAVE_ABI, this.signer);
    const accounts = await this.provider.send("eth_requestAccounts", [])
      //supply USDC to aave contract
      const tx = await aave.supply(
        "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
        ethers.utils.parseUnits(supplyCount, 6),
        accounts[0],
        0,
      );
      await tx.wait();
  }


  public async setupRecurringPayment(receiver_address:any,subscriptionAmount:any,frequency:any,endTime:any){
    const accounts = await this.provider.send("eth_requestAccounts", [])
    const nonces = await this.tokenContract.nonces(accounts[0])
    console.log(nonces)
    //2nd argument is amount of gho contract is permitted to use on behalf of signer -> make it input
    // const permit = await this.createPermit(this.subscriptionContractAddress, ethers.utils.parseUnits('100000', 18), parseInt(nonces._hex, 16), 2661766724)
    // await this.allowPermit(this.subscriptionContractAddress, ethers.utils.parseUnits('10', 18), 2661766724, permit.split)
    // console.log("allowed permit")
    //1st argument is receiver -> make it input
    await this.subscribe(receiver_address, ethers.utils.parseUnits(subscriptionAmount, 18), frequency, endTime)
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

  public async signTypedDelegation(dataToSign: any) {
    // call this method to sign EIP 712 data
    const rawSig = await this.signer._signTypedData(this.domainDelegation, this.typesDelegation, dataToSign)
    console.log(rawSig)
    return rawSig
  }


  public async createPermitForDelegation(delegatee: any, nonce: any, value: any, deadline: any) {

    
    const accounts = await this.provider.send("eth_requestAccounts", [])
  
    const dataToSign = {
      delegator: accounts[0],
      delegatee: delegatee,
      value: value,
      nonce: nonce,
      deadline: deadline
    }

    const signature = await this.signTypedDelegation(dataToSign)
    const split = await this.splitSig(signature)

    const recovered = ethers.utils.verifyTypedData(
      this.domainDelegation,
      this.typesDelegation,
      dataToSign,
      split
    );
      console.log(recovered)
    return {
       split, signature
    }
  }


  public async allowDelegation(delegatee: any, value: any, deadline: any){
    const accounts = await this.provider.send("eth_requestAccounts", [])
    const gasPrice = await this.provider.getGasPrice()


    const usdcDebtToken = new ethers.Contract("0x54bdE009156053108E73E2401aEA755e38f92098", usdcVariableDebtABI, this.signer);
    console.log(usdcDebtToken)

    let tx = await usdcDebtToken.approveDelegation(
     
      delegatee,
      value,
  
    );
  
    await tx.wait(2) 
    console.log(tx)

  
  }

  public async executeDelegation () {
    
    const usdcDebtToken = new ethers.Contract("0x54bdE009156053108E73E2401aEA755e38f92098", usdcVariableDebtABI, this.signer)
    const accounts = await this.provider.send("eth_requestAccounts", [])
    const nonces = await usdcDebtToken.nonces(accounts[0])
    
    console.log(parseInt(nonces._hex, 16))
    // const permit = await createPermitForDelegation("0x050d6fE32A00e60CD9B2ccDA94D6A549d9a30838", ethers.utils.parseUnits('100', 6), parseInt(nonces._hex, 16), 2661766724)
    // console.log(permit)
    


    await this.allowDelegation("0x050d6fE32A00e60CD9B2ccDA94D6A549d9a30838", ethers.utils.parseUnits("100", 6), 2661766724)

    
  }

  public async sendEthToContract(){
    const tx = await this.signer.sendTransaction({
      to: '0xA38318aF1B3c6E29C293b0aaDf23b23984D0d318',
      value: ethers.utils.parseUnits('0.01', 'ether'),
    });
    console.log(tx)
  }

  public async transferGHOCrossChain(transferAmount:string,address:any){
    console.log("getting account")

    const accounts = await this.provider.send("eth_requestAccounts", [])
    console.log("setting contract before")
    const chainLinkTokenTransferContract = new ethers.Contract("0xA38318aF1B3c6E29C293b0aaDf23b23984D0d318", ccipTokenTransferABI, this.signer)
    console.log("setting contract after")

    await this.sendGHO("0xA38318aF1B3c6E29C293b0aaDf23b23984D0d318",transferAmount)
    console.log("send gho finished");

    await this.sendEthToContract()
    console.log("send eth finished");

    //call transferTokenPayNative of chainlink contract
    let tx = await chainLinkTokenTransferContract.transferTokensPayNative(
      "3478487238524512106",
      address,
      this.contractAddress,
      ethers.utils.parseUnits(transferAmount, 18)
    )
    await tx.wait(2) 
    console.log(tx)
    console.log("finished");
  }
}

export default Payment;