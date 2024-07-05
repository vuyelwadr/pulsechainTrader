const { ethers, formatUnits, parseUnits } = require('ethers');

const fs = require('fs');
// const { Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType, Percent} = require("@uniswap/sdk");
const { Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType, Percent } = require("@uniswap/sdk");
// const { getAddress } = require("ethers/lib/utils");
require('dotenv').config();

MIN_PLS_BALANCE = 10000

let provider = new ethers.getDefaultProvider("wss://pulsechain-rpc.publicnode.com")

const privateKey = process.env.PRIVATE_KEY
const walletAddress = process.env.WALLET_ADDRESS
const wallet = new ethers.Wallet(privateKey, provider)

DAI_ADDRESS = "0xefD766cCb38EaF1dfd701853BFCe31359239F305"
WPLS_ADDRESS =  "0xA1077a294dDE1B09bB078844df40758a5D0f9a27"
PULSEX_ROUTER_ADDRESS = "0x165C3410fC91EF562C50559f7d2289fEbed552d9"

PULSEX_ROUTER_ABI = fs.readFileSync("PulseXRouter_v2_abi.json").toString()
PULSEX_ROUTER_CONTRACT = new ethers.Contract(PULSEX_ROUTER_ADDRESS, PULSEX_ROUTER_ABI, provider)

WPLS_ABI = fs.readFileSync("wpls_abi.json").toString()
WPLS_CONTRACT = new ethers.Contract(WPLS_ADDRESS, WPLS_ABI, provider)

DAI_ABI = fs.readFileSync("dai_Implementation_abi.json").toString()
DAI_CONTRACT = new ethers.Contract(DAI_ADDRESS, DAI_ABI, provider)

const DAI = new Token(
    // PULSEX.ChainId.MAINNET,
    369,
    DAI_ADDRESS,
    // "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    18,
    "DAI",
    "DAI"
);

const WPLS = new Token(
    369,
    WPLS_ADDRESS,
    18,
    'WPLS',
    'Wrapped Pulse'
);



async function getAmountsOut(amountIn,path) { 
    let result = await PULSEX_ROUTER_CONTRACT.getAmountsOut(amountIn, path); 
    return result; 
}

async function swapTokens(token1, token2, amount, type, slippage = "50") {

    try {

        const pair = await Fetcher.fetchPairData(token1, token2, provider); //creating instances of a pair

        const route = await new Route([pair], token2); // a fully specified path from input token to output token
        let amountIn = ethers.utils.parseEther(amount.toString()); //helper function to convert ETH to Wei
        amountIn = amountIn.toString()

        const slippageTolerance = new Percent(slippage, "10000"); // 50 bips, or 0.50% - Slippage tolerance

        const trade = new Trade( //information necessary to create a swap transaction.
            route,
            new TokenAmount(token2, amountIn),
            TradeType.EXACT_INPUT
        );

        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
        const amountInMax = trade.maximumAmountIn(slippageTolerance).raw;
        
        // const amountInMax = getAmountsOut(amountIn,path)
        const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
        const amountInMaxHex = ethers.BigNumber.from(amountInMax.toString()).toHexString();
        const path = [token2.address, token1.address]; //An array of token addresses
        const to = wallet.address; // should be a checksummed recipient address
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from the current Unix time
        const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex
        const valueHex = await ethers.BigNumber.from(value.toString()).toHexString(); //convert to hex string


        // Logging transaction details
        console.log("Transaction Details:");
        console.log(`Amount Out Min Hex: ${amountOutMinHex}`);
        console.log(`Amount Out Min: ${amountOutMin}`);
        console.log(`Amount in Max Hex: ${amountInMaxHex}`);
        console.log(`Amount In Max: ${amountInMax}`);
        console.log(`Path: ${path}`);
        console.log(`To: ${to}`);
        console.log(`Deadline: ${deadline}`);
        console.log(`Value Hex: ${valueHex}`);

        //Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
        let rawTxn;
        if (type == "buy") {
            rawTxn = await PULSEX_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokens(amountOutMinHex, path, to, deadline, {
                value: valueHex
            })
        }
        else {
            // swapExactTokensForETHSupportingFeeOnTransferTokens
            rawTxn = await PULSEX_ROUTER_CONTRACT.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(valueHex, amountOutMinHex, path, to, deadline, {
            })
            // rawTxn.gasLimit = 0x027b6c
            // const gasLimit = await wallet.estimateGas(rawTxn);
            // console.log(`gasLimit : ${gasLimit}`);
            // rawTxn.gasLimit = gasLimit;
        }


        // rawTxn.gasLimit = ethers.utils.hexlify(300000);
        // rawTxn.gasLimit = 0x027b6c


        //Returns a Promise which resolves to the transaction.
        let sendTxn = (await wallet).sendTransaction(rawTxn)


        //Resolves to the TransactionReceipt once the transaction has been included in the chain for x confirms blocks.
        let reciept = (await sendTxn).wait()

        //Logs the information about the transaction it has been mined.
        if (reciept) {
            console.log(" - Transaction is mined - " + '\n' +
                "Transaction Hash:", (await sendTxn).hash +
                '\n' + "Block Number: " +
                (await reciept).blockNumber + '\n' +
                "Navigate to https://otter.pulsechain.com/tx/" +
            (await sendTxn).hash, "to see your transaction")
        } else {
            console.log("Error submitting transaction")
        }

    } catch (e) {
        console.log(e)
    }
}

// (async () => {
// daiBalance = await DAI_CONTRACT.balanceOf(walletAddress)
// wplsBalance = await WPLS_CONTRACT.balanceOf(walletAddress)
// console.log(daiBalance)
// console.log(wplsBalance)

// const daiBalanceFormatted = ethers.utils.formatUnits(daiBalance, 18);
// const wplsBalanceFormatted = ethers.utils.formatUnits(wplsBalance, 18);

// console.log("Formatted Balances:");
// console.log(`DAI Balance: ${daiBalanceFormatted}`);
// console.log(`WPLS Balance: ${wplsBalanceFormatted}`);
// })();


// swapTokens(DAI, WPLS, 1000, "buy") //first argument = token we want, second = token we have, the amount we want
// swapTokens(DAI, WPLS, 0.1, "buy") //first argument = token we want, second = token we have, the amount we want
// swapTokens(WPLS, DAI, 0.1, "sell") //first argument = token we want, second = token we have, the amount we want

async function buy(){
    daiBalance = await DAI_CONTRACT.balanceOf(walletAddress)
    const daiBalanceFormatted = ethers.utils.formatUnits(daiBalance, 18);
    console.log(`DAI Balance: ${daiBalanceFormatted}`);
    swapTokens(WPLS, DAI, daiBalanceFormatted, "sell")

}

async function sell(){
    plsBalance = await provider.getBalance(walletAddress)
    const plsBalanceFormatted = ethers.utils.formatUnits(plsBalance, 18);
    const plsBalanceToUse =plsBalanceFormatted - MIN_PLS_BALANCE
    console.log(`PLS Balance: ${plsBalanceFormatted}`);
    console.log(`PLS Balance minus gas: ${plsBalanceToUse}`);
    swapTokens(DAI, WPLS, plsBalanceToUse, "buy")
}

buy()