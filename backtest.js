const fs = require("fs");

// Function to read JSON data
const readJsonData = async (filePath) => {
  const data = await fs.promises.readFile(filePath, "utf8");
  return JSON.parse(data);
};

const calculateSMA = (prices, length) => {
  let sma = [];

  for (let i = 0; i < prices.length; i++) {
    if (i >= length - 1) {
      let sum = 0;
      for (let j = 0; j < length; j++) {
        sum += prices[i - j][1];
      }
      sma.push(sum / length);
    } else {
      sma.push(null);
    }
  }

  return sma;
};

const backtestStrategy = async (filePath, smaLength) => {
  const jsonData = await readJsonData(filePath);
  const prices = jsonData.prices.map((p) => [p[0], parseFloat(p[1])]);

  const sma = calculateSMA(prices, smaLength);

  let position = null;
  let buyPrice = 0;
  let sellPrice = 0;
  let profit = 0;

  for (let i = smaLength - 1; i < prices.length; i++) {
    const price = prices[i][1];

    if (sma[i] !== null) {
      if (position === null && price > sma[i]) {
        // Buy condition
        position = "long";
        buyPrice = price;
        console.log(
          `Buy at ${price} on ${new Date(prices[i][0]).toISOString()}`
        );
      } else if (position === "long" && price < sma[i]) {
        // Sell condition
        position = null;
        sellPrice = price;
        profit += sellPrice - buyPrice;
        console.log(
          `Sell at ${price} on ${new Date(prices[i][0]).toISOString()}`
        );
      }
    }
  }

  console.log(`Total profit: ${profit}`);
};

// File path to your historical data const filePath = './data_1h_90d.json'; const smaLength = 14; // Adjust the SMA length if needed
const filePath = "./data_1h_90d.json";
const smaLength = 14;
backtestStrategy(filePath, smaLength);
