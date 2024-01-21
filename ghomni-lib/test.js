import {ethers } from 'ethers';
import AAVE_ABI from "./contract/aave_abi"


const borrowGHO = async(account,borrowedTokenCount)=>{
    try{
    if(check_collateral_supply(account)){
    const provider =  new ethers.providers.Web3Provider(window.ethereum);
    const gho_pool = "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60";
    const signer = provider.getSigner()
    const gho = new ethers.Contract("0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", AAVE_ABI,signer);
    const tx = await gho.borrow(
      gho_pool,
      ethers.utils.parseUnits(borrowedTokenCount, 18),
      2,
      0,
      await signer.getAddress(),
    );
    const transaction = await tx.wait();
    return true;
    } else{
      //supply collateral

    }
    }
    catch(err){
        //process error
    }
  }

const check_collateral_supply = async(account)=>{
  return false;
}