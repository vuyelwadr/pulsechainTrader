const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const port = 3000;

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Serve the chart data
app.get('/chart-data', (req, res) => {
    const rawData = JSON.parse(fs.readFileSync('PULSEX_WPLSDAI_E56043_USD_15.json', 'utf-8'));

    var priceData = rawData.map(item => {
        return {
            time: parseInt(item.time, 10) * 1000,  // Convert to milliseconds
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            SMA: parseFloat(item.SMA)
        };
    });


    var smaPeriod = 14; //14
    var smaValues = calculateSMA(priceData, smaPeriod);

    // for (let i = 1; i < 30; i++) {
    //   backtestStrategy(smaValues, i, rawData);
    // }
    var buySellPoints =  backtestStrategy(smaValues, smaPeriod, rawData);

    res.json({
      timestamps: priceData.map(item => item.time),
      openPrices: priceData.map(item => item.open),
      highPrices: priceData.map(item => item.high),
      lowPrices: priceData.map(item => item.low),
      closePrices: priceData.map(item => item.close),
      // sma: priceData.map(item => item.SMA)
      sma: smaValues,
      buySellPoints:buySellPoints.buySellPoints,
      buyAndHoldProfit:buySellPoints.buyAndHoldProfit,
      totalProfit: buySellPoints.totalProfit,
      endingAccountSize: buySellPoints.endingAccountSize, 
      trades: buySellPoints.trades,
      daysTraded: buySellPoints.daysTraded
    });


    // const timestamps = priceData.map(item => item.time);
    // const closePrices = priceData.map(item => item.close);
    // const sma = priceData.map(item => item.SMA);

    // res.json({ timestamps, closePrices, sma });
});
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


function backtestStrategy(sma, smaLength, jsonData) {
  const prices = jsonData.map((p) => [BigInt(p.time), parseFloat(p.close)]);  // Extracting close prices with BigInt for timestamps

  let initialCapital = 1000; // Starting capital
  let accountSize = initialCapital; // Current account size based on starting capital and profit/loss
  let position = null;
  let buyPrice = 0;
  let profit = 0;
  let buySellPoints = [];
  const tradeDays = new Set(); // To store unique trade days
  
  for (let i = smaLength - 1; i < prices.length; i++) {
    const price = prices[i][1];

    if (sma[i] !== null) {
      const currentDate = new Date(Number(prices[i][0]) * 1000).toISOString().split('T')[0];
      
      if (position === null && price > sma[i]) {
        // Buy condition
        position = "long";
        buyPrice = price;
        buySellPoints.push({ type: "buy", price: price, sma: sma[i], timestamp: Number(prices[i][0]) * 1000 });
        tradeDays.add(currentDate); // Add the trade date to the set of trade days

        // console.log(`Buy at ${price} on ${new Date(Number(prices[i][0]) * 1000).toISOString()}`);

      } else if (position === "long" && price < sma[i]) {
        // Sell condition
        position = null;
        const sellPrice = price;
        const tradeProfit = (accountSize / buyPrice) * sellPrice - accountSize;  // Profit calculation
        profit += tradeProfit;
        accountSize += tradeProfit; // Update account size based on profit/loss

        buySellPoints.push({ type: "sell", price: price, sma: sma[i], timestamp: Number(prices[i][0]) * 1000, profit: tradeProfit });
        tradeDays.add(currentDate); // Add the trade date to the set of trade days

        // console.log(`Sell at ${price} on ${new Date(Number(prices[i][0]) * 1000).toISOString()}`);
      }
    }
  }
  const tradeDaysArray = Array.from(tradeDays).sort();
  const firstTradeDay = tradeDaysArray[0];
  const lastTradeDay = tradeDaysArray[tradeDaysArray.length - 1];
  const daysTraded = (new Date(lastTradeDay) - new Date(firstTradeDay)) / (1000 * 60 * 60 * 24);

  const firstPrice = prices.find(p => new Date(Number(p[0]) * 1000).toISOString().split('T')[0] === firstTradeDay)[1];
  const lastPrice = prices.find(p => new Date(Number(p[0]) * 1000).toISOString().split('T')[0] === lastTradeDay)[1];
  const buyAndHoldProfit = ((initialCapital / firstPrice) * lastPrice) - initialCapital;

  // const firstPrice = jsonData.find(p => p.time === firstTradeDay)?.close;
  // const lastPrice = jsonData.find(p => p.time === lastTradeDay)?.close;
  // const buyAndHoldProfit = (accountSize / firstPrice) * lastPrice - accountSize;


  console.log(firstPrice)
  console.log(lastPrice)
  
  console.log(`SMA: ${smaLength}`);
  console.log(`buy and hold profit: ${buyAndHoldProfit}`)
  console.log(`Total profit: ${profit}`);
  console.log(`Ending account size: ${accountSize}`);
  console.log(`Number trades: ${tradeDays.size}`); // Print the number of unique trade days
  console.log(`Number of days traded: ${daysTraded}`); // Print the number of unique trade days
  


  return { sma, buySellPoints,buyAndHoldProfit: buyAndHoldProfit, totalProfit: profit, endingAccountSize: accountSize, trades: tradeDays.size, daysTraded:daysTraded };
}




// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
