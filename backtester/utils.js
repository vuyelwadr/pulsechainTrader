const fetch = require("node-fetch");
const fs = require("fs");
require("dotenv").config();


// utils.js
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
  console.log(
    `buy and hold profit: ${buyAndHoldProfit}  ${
      (buyAndHoldProfit / initialCapital) * 100
    }%`
  );
  console.log(`Total profit: ${profit}  ${(profit / initialCapital) * 100}%`);
  console.log(`Ending account size: ${accountSize}`);
  console.log(`Number trades: ${trades}`); // Print the number of unique trade days
  console.log(`Number of days traded: ${daysTraded}`); // Print the number of unique trade days

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
    "https://api.coingecko.com/api/v3/coins/pulsechain/market_chart?vs_currency=usd&days=90&precision=full";
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

async function executeLiveTrade(priceData, smaValues, position) {
  const currentPrice = priceData[priceData.length - 1].close;
  const currentTime = Number(priceData[priceData.length - 1].time);
  const currentSMA = smaValues[smaValues.length - 1];

  let trade
    let buySellPoint
  if (position === null && currentPrice > currentSMA) {
    // Buy condition
    // trade = await buy(currentPrice, currentSMA, currentTime);
    buySellPoint = {
        type: "buy",
        price: currentPrice,
        sma: currentSMA,
        timestamp:currentTime,
        // hash: trade.transactionHash,
      }
    console.log("Buy condition");
  } else if (position === "long" && currentPrice < currentSMA) {
    // Sell condition
    // trade = await sell(currentPrice, currentSMA, currentTime);
    // trade = await sell(currentPrice, currentSMA, currentTime);
    buySellPoint = {
        type: "sell",
        price: currentPrice,
        sma: currentSMA,
        timestamp: currentTime,
        // hash: trade.transactionHash,
      }
    console.log("Sell condition");
  }

  await appendToJsonFile('trades.json', buySellPoint);

  return { trade, buySellPoint }; // Return the trade details along with buy/sell points
}

async function appendToJsonFile(filePath, data) {
    try {
      // Read the existing JSON file
      let existingData = await loadJsonFile(filePath)
    //   console.log(existingData)

        // console.log(data)
      // Append the new data to the existing data
      existingData.push(data);
  
      // Write the updated data back to the JSON file
      await fs.promises.writeFile(filePath, JSON.stringify(existingData, null, 2));
    } catch (err) {
      console.error('Error writing to JSON file:', err);
    }
  }

  async function loadJsonFile(filePath) {
    try {
      const fileContents = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(fileContents);
    } catch (err) {
      console.error('Error reading JSON file:', err);
      return [];
    }
  }


async function getPosition() {
    position = "long"
    return position; // Return the trade details along with buy/sell points
  }

// Correctly export the functions
module.exports = {
  calculateSMA,
  backtestStrategy,
  getCoinGeckoData,
  executeLiveTrade,
  getPosition,
  loadJsonFile
};
