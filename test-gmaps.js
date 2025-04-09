// test-gmaps.js
// Load environment variables from .env file
require('dotenv').config(); 
// Import axios for making HTTP requests
const axios = require('axios');

// Get the API key from environment variables
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

// Check if the API key is loaded
if (!apiKey) {
  console.error('Error: GOOGLE_MAPS_API_KEY not found.');
  console.log('Make sure you have created a .env file in the project root');
  console.log('and added your key like this: GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE');
  process.exit(1); // Exit the script
}

// Address to geocode (example)
const addressToGeocode = 'Miami, FL';

// Construct the Geocoding API URL
const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeocode)}&key=${apiKey}`;

console.log(`Attempting to geocode: "${addressToGeocode}"`);
console.log(`Using URL (key omitted for safety): https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeocode)}&key=YOUR_KEY`);

// Make the API request using axios
axios.get(geocodingUrl)
  .then(response => {
    // Check if the API returned a successful status
    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const formattedAddress = response.data.results[0].formatted_address;
      console.log('\n--- SUCCESS! ---');
      console.log(`Formatted Address: ${formattedAddress}`);
      console.log(`Coordinates: Lat=${location.lat}, Lng=${location.lng}`);
      console.log('----------------');
      console.log('Your Google Maps API Key seems to be working for Geocoding!');
    } else {
      // Handle API errors reported in the response data
      console.error('\n--- API Error ---');
      console.error(`Status: ${response.data.status}`);
      if (response.data.error_message) {
        console.error(`Error Message: ${response.data.error_message}`);
      }
      console.error('-----------------');
      console.error('There might be an issue with your API key, billing, or API enablement in Google Cloud Platform.');
    }
  })
  .catch(error => {
    // Handle network errors or other issues with the request itself
    console.error('\n--- Request Failed ---');
    console.error('Error making request to Google Maps API:');
    // Log details if available (e.g., error response from server)
    if (error.response) {
         console.error(`Status: ${error.response.status}`);
         console.error('Data:', error.response.data);
    } else {
         console.error(error.message);
    }
    console.error('--------------------');
    console.error('Check your network connection and the API key.');
  });
