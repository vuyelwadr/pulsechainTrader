const csv = require('csvtojson');
const fs = require('fs');
const path = require('path');

// Path to your CSV file
const csvFilePath = path.join(__dirname, 'PULSEX_WPLSDAI_E56043_USD_15.csv'); // replace 'data.csv' with your actual CSV file name

// Function to convert date string to timestamp in seconds
function dateStringToTimestamp(dateString) {
  const dateObject = new Date(dateString); // Create Date object from string
  return Math.floor(dateObject.getTime() / 1000); // Convert to seconds and floor it
}

// Convert CSV to JSON
csv()
  .fromFile(csvFilePath)
  .then((jsonObj) => {
    // Iterate through each object in jsonObj and convert the "time" property
    try{
      Number(jsonObj[0])
    }
    catch{
      jsonObj.forEach(obj => {
        // Check if "time" is a string before converting
        if (typeof obj.time === 'string') {
          obj.time = dateStringToTimestamp(obj.time); // Update "time" property to timestamp
        }
      });
    }
    

    // Path to save the JSON file
    const jsonFilePath = path.join(__dirname, 'PULSEX_WPLSDAI_E56043_USD_15.json'); // replace 'data.json' with your desired JSON file name

    // Write the JSON object to a file
    fs.writeFile(jsonFilePath, JSON.stringify(jsonObj, null, 2), (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
      } else {
        console.log('JSON file has been saved.');
      }
    });
  })
  .catch((error) => {
    console.error('Error converting CSV to JSON:', error);
  });
