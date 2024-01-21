import { useContext, useState } from 'react';
import styled from 'styled-components';
import { BigNumber, ethers } from 'ethers';
import Payment from './../../../../../ghomni-lib';
import { RotatingLines } from 'react-loader-spinner'
import { ConnectKitButton } from 'connectkit';

import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  SendHelloButton,
  Card,
  BorrowGHOButton,
  SendGHOButton,
  SupplyGHOButton,
  InstructButton
} from '../components';
import { defaultSnapOrigin } from '../config';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  connectSnap,
  getSnap,
  isLocalSnap,
  sendHello,
  handleButtonClick,
  shouldDisplayReconnectButton,
} from '../utils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary?.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const Notice = styled.div`
  background-color: ${({ theme }) => theme.colors.background?.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  color: ${({ theme }) => theme.colors.text?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;

  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error?.muted};
  border: 1px solid ${({ theme }) => theme.colors.error?.default};
  color: ${({ theme }) => theme.colors.error?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading,setLoading] = useState(false)
  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? state.isFlask
    : state.snapsDetected;

  const handleConnectClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
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

   const handleInstruction = async () => {
    const payment = new Payment(new ethers.providers.Web3Provider(window.ethereum))
    const userPrompt = await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: { snapId: defaultSnapOrigin, request: { method: 'process_instruction' } },
    });
    const serverResponse = await getServerResponse(userPrompt);
    console.log("server response is ",serverResponse)
    const operation = serverResponse.function_name;
    console.log("server is ",serverResponse)
    console.log("operation is",operation)
    if(operation==='borrow_gho'){
      setLoading(true);
      var res :any= await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: { snapId: defaultSnapOrigin, request: { method: 'borrowGHO',params:{
          "borrowedTokenCount":serverResponse.amount
        } } },
      });
      setLoading(false)
      if(res!==null){
          setLoading(true);
          const borrowGHOStatus = await payment.borrowGHO(res.borrowedTokenCount);
          setLoading(false);
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
              setLoading(true);
              await payment.permitTokenSpend(collateralAmount)
              await payment.supplyUSDC(res.supplyTokenCount) 
              setLoading(false); 
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
  
   
  }
  else if(operation==='send_funds_to_address'){
    var res :any= await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: { snapId: defaultSnapOrigin, request: { method: 'sendGHO',params:{
        "sendTokenCount":serverResponse.amount,
        "receiver":serverResponse.receiver_address
      } } },
    });
    if(res!==null){
      //  var receiverAddress = await resolveENSAddress(serverResponse.receiver_address)
  
        await payment.sendGHO(res.receiver,res.sendTokenCount)
    }
  }
  else if(operation==='setup_recurring_payments'){
    var res :any= await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: { snapId: defaultSnapOrigin, request: { method: 'sendGHORecurring',params:{
        "amount":serverResponse.amount,
        "receiver_address":serverResponse.receiver_address,
        "frequency":serverResponse.frequency,
        "end_time":serverResponse.end_time,
      } } },
      
  
      
    });
    if(res!==null){
  
        await payment.setupRecurringPayment(serverResponse.receiver_address,serverResponse.amount,Number(serverResponse.frequency),Number(serverResponse.end_time));
    }
  }
  else if(operation==='transfer_crosschain'){
    var res :any= await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: { snapId: defaultSnapOrigin, request: { method: 'transfer_crosschain',params:{
        "amount":serverResponse.amount,
        "address":serverResponse.address,
        "chain":serverResponse.chain,
      } } },
    });
    console.log("res is ",res)
    if(res!==null){
      await payment.transferGHOCrossChain(serverResponse.amount,serverResponse.address);
    }

  }

  }

  
  
  const handleInstructClick = async () => {
    try {
      await handleInstruction();
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
  };
  
  const handleSendHelloClick = async () => {
    try {
      await sendHello();
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
  };
  const handleBorrowGHOClick = async () => {
    try {
      await handleButtonClick("borrow");
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
  };

  const handleSendGHOClick = async () => {
    try {
      await handleButtonClick("send");
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
  };

  const handleSupplyGHOClick = async () => {
    try {
      await handleButtonClick("supply");
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
  };

  


  return (
    
    <Container>
    {loading ? (
        <div>
  <RotatingLines
  visible={true}
  height="96"
  width="96"
  color="grey"
  strokeWidth="5"
  animationDuration="0.75"
  ariaLabel="rotating-lines-loading"
  wrapperStyle={{}}
  wrapperClass=""
  />
        {/* <Heading>
      <Span>Please wait while we process your request</Span>
      </Heading> */}
        </div>
      ) : null}


      <CardContainer>
        {state.error && (
          <ErrorMessage>
            <b>An error happened:</b> {state.error.message}
          </ErrorMessage>
        )}
        {!isMetaMaskReady && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        {!state.installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description:
                'Get started by connecting to and installing the example snap.',
              button: (
                <ConnectButton
                  onClick={handleConnectClick}
                  disabled={!isMetaMaskReady}
                />
              ),
            }}
            disabled={!isMetaMaskReady}
          />
        )}
        <div style={{paddingLeft:'170px',paddingTop:'100px'}}>
          <Card 
          content={{
            title: 'How can I assist you',
            description:'',
            button: (
              <InstructButton
                onClick={handleInstructClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            isMetaMaskReady &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        </div>
      
      </CardContainer>
        {/* <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <ConnectKitButton />
    </div> */}
    </Container>
    
  );
};

export default Index;
