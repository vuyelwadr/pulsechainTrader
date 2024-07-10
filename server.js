require('dotenv').config();
const cron = require('node-cron');
const fs = require("fs");
const path = require("path");
const express = require("express");

const { calculateSMA, backtestStrategy, getCoinGeckoData, executeLiveTrade, getPosition, loadJsonFile } = require("./functions");
const app = express();
const port = process.env.PORT || 3000;
const cronSchedule = process.env.CRON_SCHEDULE || '*/15 * * * *';

let initialCapital = 1000; // Starting capital

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, "build")));

// New endpoint to fetch the base URL
app.get("/base-url", (req, res) => {
  const fullUrl = `${req.protocol}://${req.get('host')}`;
  res.json({ baseUrl: fullUrl });
});

// Serve the chart data
app.get("/backtest-candlestick-data", (req, res) => {
  const rawData = JSON.parse(
    fs.readFileSync("PULSEX_WPLSDAI_E56043_USD_15.json", "utf-8")
  );

  var priceData = rawData.map((item) => {
    return {
      time: parseInt(item.time, 10) * 1000, // Convert to milliseconds
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      SMA: parseFloat(item.SMA),
    };
  });

  var smaPeriod = 14; //14
  var smaValues = calculateSMA(priceData, smaPeriod);

  var buySellPoints = backtestStrategy(
    smaValues,
    smaPeriod,
    priceData,
    initialCapital
  );

  res.json({
    timestamps: priceData.map((item) => item.time),
    openPrices: priceData.map((item) => item.open),
    highPrices: priceData.map((item) => item.high),
    lowPrices: priceData.map((item) => item.low),
    closePrices: priceData.map((item) => item.close),
    sma: smaValues,
    buySellPoints: buySellPoints.buySellPoints,
    initialCapital: initialCapital,
    buyAndHoldProfit: buySellPoints.buyAndHoldProfit,
    totalProfit: buySellPoints.totalProfit,
    endingAccountSize: buySellPoints.endingAccountSize,
    trades: buySellPoints.trades,
    daysTraded: buySellPoints.daysTraded,
  });
});

app.get("/backtest-data", (req, res) => {
  const rawData = JSON.parse(fs.readFileSync("coingecko.json", "utf-8"));

  var priceData = rawData.prices.map((item) => {
    return {
      time: parseInt(item[0], 10), // Convert to milliseconds
      close: parseFloat(item[1]),
    };
  });

  for (let i = 2; i < 50; i++) {
      var smaValues = calculateSMA(priceData, i);
      backtestStrategy(smaValues, i, priceData, initialCapital)
  }

  var smaPeriod = 4; //14
  var smaValues = calculateSMA(priceData, smaPeriod);

  buySellPoints = backtestStrategy(
    smaValues,
    smaPeriod,
    priceData,
    initialCapital
  );

  res.json({
    timestamps: priceData.map((item) => item.time),
    price: priceData.map((item) => item.close),
    sma: smaValues,

    buySellPoints: buySellPoints.buySellPoints,
    initialCapital: initialCapital,
    buyAndHoldProfit: buySellPoints.buyAndHoldProfit,
    totalProfit: buySellPoints.totalProfit,
    endingAccountSize: buySellPoints.endingAccountSize,
    trades: buySellPoints.trades,
    daysTraded: buySellPoints.daysTraded,
  });
});


app.get("/live-data", async (req, res)  => {
    const data = await getLiveData()
    res.json(data);
  });

  app.get("/chart-data", async (req, res)  => {
    const rawData = JSON.parse(fs.readFileSync("coingecko.json", "utf-8"));

    var priceData = rawData.prices.map((item) => {
      return {
        time: parseInt(item[0], 10), // Convert to milliseconds
        close: parseFloat(item[1]),
      };
    });

    var smaPeriod = 4;
    var smaValues = calculateSMA(priceData, smaPeriod);

    const buySellPoints = await loadJsonFile('trades.json');

  
    res.json({
      timestamps: priceData.map((item) => item.time),
      price: priceData.map((item) => item.close),
      sma: smaValues,
  
      buySellPoints: buySellPoints,
    });
  });

  async function getLiveData() {
      await getCoinGeckoData();
      const rawData = JSON.parse(fs.readFileSync("coingecko.json", "utf-8"));
  
      var priceData = rawData.prices.map((item) => {
        return {
          time: parseInt(item[0], 10), // Convert to milliseconds
          close: parseFloat(item[1]),
        };
      });
    
      // for (let i = 2; i < 50; i++) {
      //     var smaValues = calculateSMA(priceData, i);
      //     backtestStrategy(smaValues, i, priceData, initialCapital)
      // }
    
      var smaPeriod = 4; //14
      var smaValues = calculateSMA(priceData, smaPeriod);
      // var position = await getPosition()
      await executeLiveTrade(priceData, smaValues) 
     
  
      // buySellPoints = backtestStrategy(
      //   smaValues,
      //   smaPeriod,
      //   priceData,
      //   initialCapital
      // );
  
      const buySellPoints = await loadJsonFile('trades.json');
  
  
    
      return {
        timestamps: priceData.map((item) => item.time),
        price: priceData.map((item) => item.close),
        sma: smaValues,
    
        buySellPoints: buySellPoints,
      };
  }


// All other GET requests not handled before will return the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


cron.schedule(cronSchedule, async () => {
  try {
    await getLiveData();
    // console.log('Data fetched and processed successfully:', result);
  } catch (error) {
    console.error('Error fetching or processing data:', error);
  }
});

// getLiveData();

module.exports = { getLiveData };

// https://stackoverflow.com/questions/46265983/setting-up-subdomains-with-nginx-and-namecheap

// ps aux | grep 'server.js --scripts-prepend-node-path' | grep 'vuyeezti' | grep -v grep | awk '{print $2}' | xargs kill >/dev/null 2>&1
// source /home/vuyeezti/nodevenv/trade.vuyelwa.com/10/bin/activate && cd /home/vuyeezti/trade.vuyelwa.com && npm run production


// ps aux | grep 'server.js --scripts-prepend-node-path' | grep 'vuyeezti' | grep -v grep | awk '{print $2}' | xargs kill >/dev/null 2>&1 && source /home/vuyeezti/nodevenv/trade.vuyelwa.com/10/bin/activate && cd /home/vuyeezti/trade.vuyelwa.com && npm run production
// curl http://localhost:3000/live-data
