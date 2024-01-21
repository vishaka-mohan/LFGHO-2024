import Payment from 'ghomni-lib'
const provider = new ethers.providers.Web3Provider(window.ethereum);
const paymentExecutor = new Payment(provider);
const borrowStatus = paymentExecutor.borrowGHO(10);