import type { MetaMaskInpageProvider } from '@metamask/providers';
import Payment from './../../../../../ghomni-lib';
import { BigNumber, ethers } from 'ethers';

import { defaultSnapOrigin } from '../config';
import type { GetSnapsResponse, Snap } from '../types';

/**
 * Get the installed snaps in MetaMask.
 *
 * @param provider - The MetaMask inpage provider.
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (
  provider?: MetaMaskInpageProvider,
): Promise<GetSnapsResponse> =>
  (await (provider ?? window.ethereum).request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse;
/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<'version' | string, unknown> = {},
) => {
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  });
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version),
    );
  } catch (error) {
    console.log('Failed to obtain installed snap', error);
    return undefined;
  }
};


async function getServerResponse(userPrompt: any) {
  
  const payload = {
    user_prompt: userPrompt,
  };
  const response = await fetch(`http://127.0.0.1:8000/processPrompt`, {
    method: 'POST',
    headers: new Headers({
      'content-type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });
  return response.json();
}

/**
 * Invoke the "hello" method from the example snap.
 */

export const sendHello = async () => {
  await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: { snapId: defaultSnapOrigin, request: { method: 'hello' } },
  });
};
export const handleInstruction = async () => {
  const payment = new Payment(new ethers.providers.Web3Provider(window.ethereum))

  const userPrompt = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: { snapId: defaultSnapOrigin, request: { method: 'process_instruction' } },
  });
  const serverResponse = await getServerResponse(userPrompt);
  const operation = serverResponse.function_name;
  if(operation==='borrow_gho'){
    var res :any= await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: { snapId: defaultSnapOrigin, request: { method: 'borrowGHO',params:{
        "borrowedTokenCount":serverResponse.amount
      } } },
    });
    if(res!==null){
        const borrowGHOStatus = await payment.borrowGHO(res.borrowedTokenCount);
        if(borrowGHOStatus===false){
          var collateralAmount = (2*parseInt(res.borrowedTokenCount, 10)).toString(); // You want to use radix 10

          //trigger supply flow
          var res :any= await window.ethereum.request({
            method: 'wallet_invokeSnap',
            params: { snapId: defaultSnapOrigin, request: { method: 'supplyGHO',params:{
              "supplyTokenCount":collateralAmount,
            } } },
          });
          if(res!==null){
            await payment.permitTokenSpend(collateralAmount)
            await payment.supplyUSDC(res.supplyTokenCount)  
            //trigger borrow again
            var res :any= await window.ethereum.request({
              method: 'wallet_invokeSnap',
              params: { snapId: defaultSnapOrigin, request: { method: 'borrowGHO',params:{
                "borrowedTokenCount":serverResponse.amount
              } } },
            });

            if(res!=null){
              const borrowGHOStatus = await payment.borrowGHO(res.borrowedTokenCount);
              return;
            }
        }
    }
  }
  else if(operation==='send_funds_to_address'){

  }
  else if(operation==='setup_recurring_payments'){

  }
};
}
//to be replaced by generic processing funcitonality
export const handleButtonClick = async (userOperation:any) => {
  console.log("payment object before");

  const payment = new Payment(new ethers.providers.Web3Provider(window.ethereum))
  console.log("payment object");
  console.log(payment)
  switch(userOperation){
    case "borrow":
      var res :any= await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: { snapId: defaultSnapOrigin, request: { method: 'borrowGHO',params:{
          "borrowedTokenCount":"2"
        } } },
      });
      if(res!==null){
        const operation = res.operation;
        if(operation==="borrow"){
          const borrowGHOStatus = await payment.borrowGHO(res.borrowedTokenCount);
          if(borrowGHOStatus===false){
            alert("need funds")
          }
          
    
        }
        return;
      }
    case "send":
      var res :any= await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: { snapId: defaultSnapOrigin, request: { method: 'sendGHO',params:{
          "sendTokenCount":"5",
          "receiver":"0xBC671f3d97C466c2E82d7558bfE94171B5101D29"
        } } },
      });
      if(res!==null){
        const operation = res.operation;
        if(operation==="send"){
          await payment.sendGHO(res.receiver,res.sendTokenCount)
      }
      return;
    }
    case "supply":
      //will make it a x% incrememnet of borrow amount
      var res :any= await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: { snapId: defaultSnapOrigin, request: { method: 'supplyGHO',params:{
          "supplyTokenCount":"100",
        } } },
      });
      if(res!==null){
        const operation = res.operation;
        if(operation==="supply"){
          await payment.permitTokenSpend(100)
          await payment.supplyUSDC(res.supplyTokenCount)
      }
      return;
    }
    default:
      return null
  

}
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');
