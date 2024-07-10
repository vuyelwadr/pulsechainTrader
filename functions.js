const fetch = require("node-fetch");
const fs = require("fs");
const path = require('path');
const { getPls, getDai, getDaiPlsBalances, MIN_PLS_BALANCE } = require("./pulsex");
const { InsufficientInputAmountError } =  require('@uniswap/sdk')
// const { Writable } = require('stream');


require("dotenv").config();

// functions.js
function calculateSMA(data, length) {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < length - 1) {
      sma.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < length; j++) {
        sum += data[i - j].close;
      }
      sma.push(sum / length);
    }
  }
  return sma;
}

function backtestStrategy(sma, smaLength, jsonData, initialCapital) {
  const prices = jsonData.map((p) => [BigInt(p.time), parseFloat(p.close)]); // Extracting close prices with BigInt for timestamps

  let accountSize = initialCapital; // Current account size based on starting capital and profit/loss
  let position = null;
  let buyPrice = 0;
  let profit = 0;
  let buySellPoints = [];
  let trades = 0;
  const tradeDays = new Set(); // To store unique trade days

  for (let i = smaLength - 1; i < prices.length; i++) {
    const price = prices[i][1];

    if (sma[i] !== null) {
      const currentDate = new Date(Number(prices[i][0]))
        .toISOString()
        .split("T")[0];

      if (position === null && price > sma[i]) {
        // Buy condition
        position = "long";
        buyPrice = price;
        buySellPoints.push({
          type: "buy",
          price: price,
          sma: sma[i],
          timestamp: Number(prices[i][0]),
        });
        tradeDays.add(currentDate); // Add the trade date to the set of trade days
        trades++;
      } else if (position === "long" && price < sma[i]) {
        // Sell condition
        position = null;
        const sellPrice = price;
        const tradeProfit = (accountSize / buyPrice) * sellPrice - accountSize; // Profit calculation
        profit += tradeProfit;
        accountSize += tradeProfit; // Update account size based on profit/loss

        buySellPoints.push({
          type: "sell",
          price: price,
          sma: sma[i],
          timestamp: Number(prices[i][0]),
          profit: tradeProfit,
        });
        tradeDays.add(currentDate); // Add the trade date to the set of trade days
        trades++;
      }
    }
  }
  const tradeDaysArray = Array.from(tradeDays).sort();
  const firstTradeDay = tradeDaysArray[0];
  const lastTradeDay = tradeDaysArray[tradeDaysArray.length - 1];
  const daysTraded =
    (new Date(lastTradeDay) - new Date(firstTradeDay)) / (1000 * 60 * 60 * 24);

  const firstPrice = prices.find(
    (p) => new Date(Number(p[0])).toISOString().split("T")[0] === firstTradeDay
  )[1];
  const lastPrice = prices.find(
    (p) => new Date(Number(p[0])).toISOString().split("T")[0] === lastTradeDay
  )[1];
  const buyAndHoldProfit =
    (initialCapital / firstPrice) * lastPrice - initialCapital;

  console.log(`SMA: ${smaLength}`);
  // console.log(
  //   `buy and hold profit: ${buyAndHoldProfit}  ${
  //     (buyAndHoldProfit / initialCapital) * 100
  //   }%`
  // );
  console.log(`Total profit: ${profit}  ${(profit / initialCapital) * 100}%`);
  // console.log(`Ending account size: ${accountSize}`);
  // console.log(`Number trades: ${trades}`); // Print the number of unique trade days
  // console.log(`Number of days traded: ${daysTraded}`); // Print the number of unique trade days

  return {
    sma,
    buySellPoints,
    buyAndHoldProfit: buyAndHoldProfit,
    totalProfit: profit,
    endingAccountSize: accountSize,
    trades: tradeDays.size,
    daysTraded: daysTraded,
  };
}

function getCoinGeckoData() {
  const url =
    "https://api.coingecko.com/api/v3/coins/pulsechain/market_chart?vs_currency=usd&days=365&precision=full";
    // "https://api.coingecko.com/api/v3/coins/pulsechain/market_chart?vs_currency=usd&days=90&precision=full";
  const COINGECKO_API_KEy = process.env.COINGECKO_API_KEy;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-cg-demo-api-key": COINGECKO_API_KEy,
    },
  };

  fetch(url, options)
    .then((res) => res.json())
    // .then((json) => console.log(json))
    .catch((err) => console.error("error:" + err));

  fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      const jsonData = JSON.stringify(json, null, 2);
      fs.writeFileSync("coingecko.json", jsonData);
      console.log("Data saved to coingecko.json");
    })
    .catch((err) => console.error("Error:", err));
}

async function executeLiveTrade(priceData, smaValues) {
  let position // short long
  console.log("executeLiveTrade start");
  let { daiBalance, plsBalance } = await getDaiPlsBalances();
  if (daiBalance > 0 && plsBalance <= MIN_PLS_BALANCE) {
    position = "dai";
  } else {
    position = "pls";
  }

  console.log("Got balance", daiBalance, plsBalance, position);


  const currentPrice = priceData[priceData.length - 1].close;
  const currentTime = Number(priceData[priceData.length - 1].time);
  const currentSMA = smaValues[smaValues.length - 1];

  console.log("Current conditions", currentPrice, currentSMA, currentTime, position);

  let trade;
  let buySellPoint;
  if (position === "pls" && currentPrice < currentSMA) {
  // if (true) {
    // Buy condition
    // trade = await buy(currentPrice, currentSMA, currentTime);
    trade = await getDai();
    // if (trade instanceof InsufficientInputAmountError || trade instanceof Error && trade.message.includes("Invariant failed") ) {
    //   console.log("Insufficient Funds");
    //   return;
    // }
     if (trade instanceof Error) {
      console.log("Error submitting transaction trying again");
      trade = await getDai();
      if (trade instanceof Error) {
        console.log("2nd error aborting transction");
        logErrorToFile(trade)
        return;
      }
    }

    buySellPoint = {
      type: "sell",
      price: currentPrice,
      sma: currentSMA,
      timestamp: currentTime,
      hash: trade.transactionHash,
    };
    console.log("sell condition");
  } else if (position === "dai" && currentPrice > currentSMA) {
  // } else if (true) {
    // Sell condition
    // trade = await sell(currentPrice, currentSMA, currentTime);

    trade = await getPls();
    // if (trade instanceof InsufficientInputAmountError || trade instanceof Error && trade.message.includes("Invariant failed")) {
    //   console.log("Insufficient Funds");
    //   return;
    // }
     if (trade instanceof Error) {
      console.log("Error submitting transaction trying again");
      trade = await getPls();
      if (trade instanceof Error) {
        console.log("2nd error aborting transction");
        logErrorToFile(trade)
        return;
      }
    }



    buySellPoint = {
      type: "buy",
      price: currentPrice,
      sma: currentSMA,
      timestamp: currentTime,
      hash: trade.transactionHash,
    };
    console.log("buy condition");
  }
  else {
    console.log("No trade condition");
    return;
  }
  await appendToJsonFile("trades.json", buySellPoint);
  return;

  // return { trade, buySellPoint }; // Return the trade details along with buy/sell points
}

async function appendToJsonFile(filePath, data) {
  try {
    // Read the existing JSON file
    let existingData = await loadJsonFile(filePath);
    //   console.log(existingData)

    // console.log(data)
    // Append the new data to the existing data
    existingData.push(data);

    // Write the updated data back to the JSON file
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(existingData, null, 2)
    );
  } catch (err) {
    console.error("Error writing to JSON file:", err);
  }
}

async function loadJsonFile(filePath) {
  try {
    const fileContents = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(fileContents);
  } catch (err) {
    console.error("Error reading JSON file:", err);
    return [];
  }
}

async function getPosition() {
  position = "long";
  return position; // Return the trade details along with buy/sell points
}


function logErrorToFile(error) {
  let errorMessage
  const logFilePath = path.join(__dirname, 'error.log'); // Specify your log file path
  if (error instanceof InsufficientInputAmountError || error instanceof Error && error.message.includes("Invariant failed")) {
    errorMessage = `${new Date().toISOString()} - Insufficient Funds \n\n`;
  }
  else {
    errorMessage = `${new Date().toISOString()} - ${error.stack || error}\n\n`;
  }
  fs.appendFile(logFilePath, errorMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
}


// Create a writable stream to capture console.log output
// const logStream = new Writable({
//   write(chunk, encoding, callback) {
//     console.log(chunk.toString()); // Output each log message
//     callback();
//   },
// });

// // Redirect console.log to logStream
// console.log = function(message) {
//   logStream.write(message + '\n');
// };



// Correctly export the functions
module.exports = {
  calculateSMA,
  backtestStrategy,
  getCoinGeckoData,
  executeLiveTrade,
  getPosition,
  loadJsonFile,
};


