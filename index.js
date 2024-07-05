

async function main() {
    const { ethers, JsonRpcProvider, formatUnits, parseUnits } = require('ethers');
    const fs = require('fs');
    const axios = require('axios');
    require('dotenv').config();


    // Connect to a PulseChain node
    const provider = new JsonRpcProvider('https://rpc.pulsechain.com');
    // const signer = provider.getSigner(process.env.WALLET_ADDRESS);

    // Load the contract ABIs
    const daiAbi = JSON.parse(fs.readFileSync('dai_abi.json', 'utf8'));
    const daiImplementationAbi = JSON.parse(fs.readFileSync('dai_Implementation_abi.json', 'utf8'));
    const wplsAbi = JSON.parse(fs.readFileSync('wpls_abi.json', 'utf8'));
    const piteasRouterAbi = JSON.parse(fs.readFileSync('piteasRouter_abi.json', 'utf8'));

    // Create contract instances
    const daiContract = new ethers.Contract('0xefD766cCb38EaF1dfd701853BFCe31359239F305', daiImplementationAbi, provider);
    const wplsContract = new ethers.Contract('0xA1077a294dDE1B09bB078844df40758a5D0f9a27', wplsAbi, provider);
    const piteasRouterContract = new ethers.Contract('0x6BF228eb7F8ad948d37deD07E595EfddfaAF88A6', piteasRouterAbi, provider);

    function printPiteasQuote(quote) {
        console.log(`Source Token: ${quote.srcToken.symbol}`);
        console.log(`Destination Token: ${quote.destToken.symbol}`);
        console.log(`Source Amount: ${formatUnits(quote.srcAmount, 18)}`);
        console.log(`Destination Amount: ${formatUnits(quote.destAmount, 18)}`);
        console.log(`Gas Use Estimate: ${quote.gasUseEstimate}`);
        console.log(`Gas Use Estimate USD: ${quote.gasUseEstimateUSD}`);
        console.log(`Calldata: ${quote.methodParameters.calldata}`);
        console.log(`Value: ${formatUnits(quote.methodParameters.value, 18)}`);
    }
    
    function printTxReceipt(txReceipt) {
        console.log('Transaction Receipt:');
        console.log(`  Block Hash: ${txReceipt.blockHash}`);
        console.log(`  Block Number: ${txReceipt.blockNumber}`);
        console.log(`  Contract Address: ${txReceipt.contractAddress}`);
        console.log(`  Cumulative Gas Used: ${txReceipt.cumulativeGasUsed}`);
        console.log(`  Effective Gas Price: ${txReceipt.effectiveGasPrice}`);
        console.log(`  Gas Used: ${txReceipt.gasUsed}`);
        console.log(`  Logs: ${txReceipt.logs}`);
        console.log(`  Logs Bloom: ${txReceipt.logsBloom}`);
        console.log(`  Status: ${txReceipt.status}`);
        console.log(`  To: ${txReceipt.to}`);
        console.log(`  Transaction Hash: ${txReceipt.transactionHash}`);
        console.log(`  Transaction Index: ${txReceipt.transactionIndex}`);
        console.log(`  Type: ${txReceipt.type}`);
    }


    // Get the wallet address and private key from environment variables
    const walletAddress = process.env.WALLET_ADDRESS;
    const privateKey = process.env.PRIVATE_KEY;

    // Get the token balances
    const wplsBalance = await wplsContract.balanceOf(walletAddress);
    const daiBalance = await daiContract.balanceOf(walletAddress);

    console.log(`WPLS Balance: ${formatUnits(wplsBalance, 18)}`);
    console.log(`DAI Balance: ${formatUnits(daiBalance, 18)}`);

    await provider.getTransactionCount(walletAddress)

    // Fetch the Piteas quote
    const response = await axios.get('https://sdk.piteas.io/quote', {
        params: {
        tokenInAddress: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27', // wPLS token address
        tokenOutAddress: '0xefD766cCb38EaF1dfd701853BFCe31359239F305', // DAI token address
        amount: wplsBalance.toString(),
        allowedSlippage: 0.8
        }
    });
  
  const quote = response.data;
  printPiteasQuote(quote);

   // Prepare the transaction parameters
   const gas = (await provider.getFeeData()).gasPrice
    console.log(gas)
    console.log(quote.methodParameters.value,)

   const signer = new ethers.Wallet(privateKey, provider);
   const tx = await signer.sendTransaction({
    to: '0x6BF228eb7F8ad948d37deD07E595EfddfaAF88A6', // PiteasRouter contract address
    value: quote.methodParameters.value,
    value: "0xd3c21bcecceda10",
    data: quote.methodParameters.calldata,
    // maxFeePerGas: parseUnits('2000000000', 'gwei'),
    // maxPriorityFeePerGas: parseUnits('1000000000', 'gwei'),
    // gasPrice: null,
    // gasLimit: quote.gasUseEstimate,
    // gasLimit: Math.round(quote.gasUseEstimate * 5),
    // gasPrice: gas
    // gasPrice: '0x2c68af0bb1400'
  });
  console.log(tx.hash);
  console.log(tx.receipt);
  console.log(tx)

  

// const txParams = {
//     to: '0x6BF228eb7F8ad948d37deD07E595EfddfaAF88A6', // PiteasRouter contract address
//     value: quote.methodParameters.value,
//     data: quote.methodParameters.calldata,
//     gasLimit: quote.gasUseEstimate,
//     gasPrice: (await provider.getFeeData()).gasPrice,
//     nonce: await provider.getTransactionCount(walletAddress),
//     chainId: 369
//   };

//   // Sign the transaction
//   const wallet = new ethers.Wallet(privateKey, provider);
//   const signedTx = await wallet.signTransaction(txParams);

//   // Send the transaction
//   const txHash = await provider.sendTransaction(signedTx);
//   const txReceipt = await provider.waitForTransaction(txHash);

//   printTxReceipt(txReceipt);
  // Print the transaction receipt
//   printTxReceipt(tx.receipt);

//   if (tx.receipt.status === 1) {
//     console.log('Transaction successful');
//   } else {
//     console.log('Transaction failed');
//   }

  
}

    
main().catch((error) => {
    console.error(error);
    process.exit(1);
  });


//   try https://www.quicknode.com/guides/defi/dexs/how-to-swap-tokens-on-uniswap-with-ethersjs