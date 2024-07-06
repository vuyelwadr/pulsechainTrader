const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const port = 3000;

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Serve the chart data
app.get('/chart-data', (req, res) => {
    const rawData = JSON.parse(fs.readFileSync('PULSEX_WPLSDAI_E56043_USD_60.json', 'utf-8'));

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


    var smaPeriod = 14;
    var smaValues = calculateSMA(priceData, smaPeriod);


    res.json({
      timestamps: priceData.map(item => item.time),
      openPrices: priceData.map(item => item.open),
      highPrices: priceData.map(item => item.high),
      lowPrices: priceData.map(item => item.low),
      closePrices: priceData.map(item => item.close),
      // sma: priceData.map(item => item.SMA)
      sma: smaValues
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
// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
