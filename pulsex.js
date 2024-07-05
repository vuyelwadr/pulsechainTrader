const { ethers } = require('ethers');
const fs = require('fs');
const { Token, Fetcher, Route, Trade, TokenAmount, TradeType, Percent } = require("@uniswap/sdk");
require('dotenv').config();

const MIN_PLS_BALANCE = 10000;

// Initialize provider and wallet
const provider = new ethers.getDefaultProvider("wss://pulsechain-rpc.publicnode.com");
const privateKey = process.env.PRIVATE_KEY;
const walletAddress = process.env.WALLET_ADDRESS;
const wallet = new ethers.Wallet(privateKey, provider);

// Contract addresses
const DAI_ADDRESS = "0xefD766cCb38EaF1dfd701853BFCe31359239F305";
const WPLS_ADDRESS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27";
const PULSEX_ROUTER_ADDRESS = "0x165C3410fC91EF562C50559f7d2289fEbed552d9";

// Load ABIs and create contract instances
const PULSEX_ROUTER_ABI = fs.readFileSync("PulseXRouter_v2_abi.json").toString();
const PULSEX_ROUTER_CONTRACT = new ethers.Contract(PULSEX_ROUTER_ADDRESS, PULSEX_ROUTER_ABI, provider);

const WPLS_ABI = fs.readFileSync("wpls_abi.json").toString();
const WPLS_CONTRACT = new ethers.Contract(WPLS_ADDRESS, WPLS_ABI, provider);

const DAI_ABI = fs.readFileSync("dai_Implementation_abi.json").toString();
const DAI_CONTRACT = new ethers.Contract(DAI_ADDRESS, DAI_ABI, provider);

// Create Token instances
const DAI = new Token(369, DAI_ADDRESS, 18, "DAI", "DAI");
const WPLS = new Token(369, WPLS_ADDRESS, 18, 'WPLS', 'Wrapped Pulse');

// Function to get amounts out
async function getAmountsOut(amountIn, path) {
    return await PULSEX_ROUTER_CONTRACT.getAmountsOut(amountIn, path);
}

// Function to perform a token swap
async function swapTokens(token1, token2, amount, type, slippage = "50") {
    try {
        const pair = await Fetcher.fetchPairData(token1, token2, provider);
        const route = new Route([pair], token2);
        let amountIn = ethers.utils.parseUnits(amount.toString(), 18).toString();

        const slippageTolerance = new Percent(slippage, "10000");

        const trade = new Trade(
            route,
            new TokenAmount(token2, amountIn),
            TradeType.EXACT_INPUT
        );

        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
        const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();

        const path = [token2.address, token1.address];
        const to = wallet.address;
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

        let rawTxn;
        if (type === "buy") {
            rawTxn = await PULSEX_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokens(
                amountOutMinHex, path, to, deadline, { value: amountIn }
            );
        } else {
            rawTxn = await PULSEX_ROUTER_CONTRACT.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
                amountIn, amountOutMinHex, path, to, deadline
            );
        }

        const sendTxn = await wallet.sendTransaction(rawTxn);
        const receipt = await sendTxn.wait();

        if (receipt) {
            console.log(`Transaction is mined:\nTransaction Hash: ${sendTxn.hash}\nBlock Number: ${receipt.blockNumber}`);
            console.log(`Navigate to https://otter.pulsechain.com/tx/${sendTxn.hash} to see your transaction`);
        } else {
            console.log("Error submitting transaction");
        }
    } catch (e) {
        console.error(e);
    }
}

// Function to buy DAI using WPLS
async function buy() {
    const daiBalance = await DAI_CONTRACT.balanceOf(walletAddress);
    const daiBalanceFormatted = ethers.utils.formatUnits(daiBalance, 18);
    console.log(`DAI Balance: ${daiBalanceFormatted}`);
    swapTokens(WPLS, DAI, daiBalanceFormatted, "sell");
}

// Function to sell WPLS for DAI
async function sell() {
    const plsBalance = await provider.getBalance(walletAddress);
    const plsBalanceFormatted = ethers.utils.formatUnits(plsBalance, 18);
    const plsBalanceToUse = plsBalanceFormatted - MIN_PLS_BALANCE;
    console.log(`PLS Balance: ${plsBalanceFormatted}`);
    console.log(`PLS Balance minus gas: ${plsBalanceToUse}`);
    swapTokens(DAI, WPLS, plsBalanceToUse.toString(), "buy");
}

// Execute buy function
buy();
