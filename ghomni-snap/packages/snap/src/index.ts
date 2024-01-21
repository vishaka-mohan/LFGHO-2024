import Payment from '../../../../ghomni-lib';
import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import {divider, heading,panel, text } from '@metamask/snaps-sdk';
import type { OnHomePageHandler } from '@metamask/snaps-sdk';
import { BigNumber, ethers } from 'ethers';
import { Keyring, KeyringAccount } from '@metamask/keyring-api';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'hello':
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text('This custom confirmation is just for display purposes.'),
            text(
              'But you can edit the snap source code to make it do something, if you want to!',
            ),
          ]),
        },
      });

      case 'process_instruction':
        var prompt= await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'prompt',
            content: panel([
              heading(`How can I help you`),
            ]),
          },
        });

        return prompt;

      case 'borrowGHO':
        var borrowPayload :any = request.params;
        console.log("payload is ",borrowPayload)
        var status= await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: panel([
              heading(`Please confirm Borrow details`),
              divider(),
              text('Amount : ' + borrowPayload.borrowedTokenCount),
            ]),
          },
        });
        if(status===true){
          return {
            "operation":"borrow",
            "borrowedTokenCount":borrowPayload.borrowedTokenCount
          }
        }
        else{
          return null;
        }

        case 'sendGHO':
          var sendPayload :any = request.params;
          var status= await snap.request({
            method: 'snap_dialog',
            params: {
              type: 'confirmation',
              content: panel([
                heading(`Please confirm Transfer details`),
                divider(),
                text('Amount : ' + sendPayload.sendTokenCount),
                text('Receiver : ' + sendPayload.receiver),
              ]),
            },
          });
          if(status===true){
            return {
              "operation":"send",
              "sendTokenCount":sendPayload.sendTokenCount,
              "receiver":sendPayload.receiver
            }
          }
          else{
            return null;
          }

          case 'supplyGHO':
            var supplyPayload :any = request.params;
            var status= await snap.request({
              method: 'snap_dialog',
              params: {
                type: 'confirmation',
                content: panel([
                  heading(`Looks like you do not have enough collateral in the pool to borrow GHO, please confirm to deposit USDC collateral`),
                  divider(),
                  text('Deposit : ' + supplyPayload.supplyTokenCount),
                ]),
              },
            });
            if(status===true){
              return {
                "operation":"supply",
                "supplyTokenCount":supplyPayload.supplyTokenCount,
              }
            }
            else{
              return null;
            }
         case 'sendGHORecurring':
          var payload :any = request.params;
          var status= await snap.request({
            method: 'snap_dialog',
            params: {
              type: 'confirmation',
              content: panel([
                heading(`Please review the payment setup`),
                divider(),
                text('Receiver :  ' + payload.receiver_address),
                divider(),
                text('Amount :  ' + payload.amount + "GHO tokens"),
                divider(),
                text('Pay every :  ' + payload.frequency + " seconds"),
                divider(),
                text('Pay for :  ' + payload.end_time + " seconds")
              ]),
            },
          });
          if(status===true){
            return {
              "operation":"sendGHORecurring",
            }
          }
          else{
            return null;
          }
          case 'transfer_crosschain':
            var payload :any = request.params;
            var status= await snap.request({
              method: 'snap_dialog',
              params: {
                type: 'confirmation',
                content: panel([
                  heading(`Please review the cross chain payment setup`),
                  divider(),
                  text('Receiver :  ' + payload.address),
                  divider(),
                  text('Amount :  ' + payload.amount + "GHO tokens"),
                  divider(),
                  text('Chain ID:  ' + "421614"),
                  divider(),
                ]),
              },
            });
            if(status===true){
              return {
                "operation":"transfer_crosschain",
              }
            }
            else{
              return null;
            }
    default:
      throw new Error('Method not found.');
  }
};

// export const onHomePage: OnHomePageHandler = async () => {
//   // const listedAccounts: any = await snap.request({
//   //   method: 'snap_manageAccounts',
//   //   params: {
//   //     method: 'listAccounts'
//   //   },
//   // });

//   // console.log("listed acc : ",listedAccounts)
//   const provider =  new ethers.providers.Web3Provider(ethereum);
//   const ghoPayment = new Payment(provider)
//   // const res = await ghoPayment.borrowGHO();
//   console.log("res is ",res)

//   // const res = await signer.getAddress();
//   // console.log("res is",res)

//   return {
//     content: panel([
//       heading('Hello world!'),
//       text('Welcome to my Snap home page!'),
//     ]),
//   };

