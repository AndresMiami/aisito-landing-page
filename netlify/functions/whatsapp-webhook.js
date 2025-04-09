// netlify/functions/whatsapp-webhook.js

// Load environment variables from .env file for local development
// Netlify automatically loads environment variables set in the UI during deployment
require('dotenv').config(); 

// Import axios for making HTTP requests
const axios = require('axios'); 

// --- Placeholder function for NLP ---
// Replace with actual implementation later
async function getIntentAndEntities(messageText, conversationState) {
  // TODO: Call your chosen NLP service (Dialogflow, LLM API, etc.)
  console.log(`NLP processing (Placeholder): ${messageText}`);
  // This basic logic is just for illustration and needs proper NLP
  if (messageText.toLowerCase().includes(' to ')) {
     const parts = messageText.split(/ to /i); 
     if (parts.length === 2 && conversationState.pickup) {
       return { intent: 'provide_dropoff', entities: { dropoff_location: parts[1].trim() }, newState: 'ready_for_quote' };
     }
  }
  if (conversationState.state === 'awaiting_pickup' || !conversationState.pickup) {
     return { intent: 'provide_pickup', entities: { pickup_location: messageText.trim() }, newState: 'awaiting_dropoff' };
  }
   return { intent: 'unknown', entities: {}, newState: conversationState.state }; 
}

// --- Google Maps API Functions ---

async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_MAPS_API_KEY environment variable.");
    return null;
  }
  if (!address) {
    console.error("Geocode function called with no address.");
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  console.log(`Geocoding address: "${address}"`);

  try {
    const response = await axios.get(url);
    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location; // { lat: number, lng: number }
      console.log(`Geocoded "${address}" to:`, location);
      return location; 
    } else {
      console.error(`Geocoding API Error for "${address}": ${response.data.status}`, response.data.error_message || '');
      return null;
    }
  } catch (error) {
    console.error(`Network error during geocoding for "${address}":`, error.message);
    return null;
  }
}

async function getRouteDetails(originCoords, destCoords) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
   if (!apiKey) {
    console.error("Missing GOOGLE_MAPS_API_KEY environment variable.");
    return null;
  }
  if (!originCoords || !destCoords) {
      console.error("getRouteDetails function called with missing coordinates.");
      return null;
  }

  // Using Distance Matrix API for distance and duration
  const origin = `${originCoords.lat},${originCoords.lng}`;
  const destination = `${destCoords.lat},${destCoords.lng}`;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}&units=metric`; // Using metric units

  console.log(`Getting route details from ${origin} to ${destination}`);

  try {
    const response = await axios.get(url);
    // Check top-level status and row status
    if (response.data.status === 'OK' && response.data.rows && response.data.rows.length > 0 && response.data.rows[0].elements && response.data.rows[0].elements.length > 0) {
       const element = response.data.rows[0].elements[0];
       // Check element status
       if (element.status === 'OK') {
           const details = { 
               distanceMeters: element.distance.value, // Distance in meters
               durationSeconds: element.duration.value // Duration in seconds (usually based on typical traffic)
           };
           console.log(`Route details found:`, details);
           return details;
       } else {
           console.error(`Distance Matrix Element Error for route: ${element.status}`);
           return null;
       }
    } else {
      console.error(`Distance Matrix API Error for route: ${response.data.status}`, response.data.error_message || '');
      return null;
    }
  } catch (error) {
    console.error(`Network error during route detail fetching:`, error.message);
    return null;
  }
}

// --- Placeholder Cost Calculation ---
function calculateCost(routeDetails) {
  // TODO: Implement your specific pricing logic
  const baseFare = 15; // Example base fare ($)
  const pricePerKm = 2.5; // Example price per km ($)
  const pricePerMinute = 0.5; // Example price per minute ($)

  if (!routeDetails || typeof routeDetails.distanceMeters !== 'number' || typeof routeDetails.durationSeconds !== 'number') {
      console.error("Invalid route details for cost calculation:", routeDetails);
      return 'N/A'; // Or throw an error
  }

  const distanceKm = routeDetails.distanceMeters / 1000;
  const durationMinutes = routeDetails.durationSeconds / 60;

  const cost = baseFare + (pricePerKm * distanceKm) + (pricePerMinute * durationMinutes);
  console.log(`Calculated cost: $${cost.toFixed(2)}`);
  return cost.toFixed(2); // Return cost as string rounded to 2 decimal places
}

// --- Placeholder WhatsApp Sending Function ---
async function sendWhatsAppMessage(senderId, messageText) {
  // TODO: Call WhatsApp Business API (via Twilio, Meta Cloud API client, etc.)
  // Use credentials like process.env.WHATSAPP_PROVIDER_AUTH_TOKEN, process.env.YOUR_WA_NUMBER etc.
  console.log(`Sending WA (Placeholder) to ${senderId}: ${messageText}`);
  return true; // Assume success for placeholder
}

// --- Netlify Function Handler ---
exports.handler = async (event) => {
  // Only process POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  console.log("Webhook received:", event.body);

  // TODO: Secure webhook with signature verification if possible (depends on WA provider)

  // 1. Parse incoming message (structure depends on your WA provider - Twilio, Meta, etc.)
  // This is a highly simplified example - ADAPT FOR YOUR PROVIDER
  let incomingData;
  let senderId;
  let messageText;
  try {
    incomingData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body; 
    
    // --- VERY IMPORTANT: Adapt parsing based on YOUR WhatsApp provider's payload ---
    // Example for Meta Cloud API (highly simplified)
    const messageEntry = incomingData?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!messageEntry || messageEntry.type !== 'text') {
        console.log("Ignoring non-text message or status update.");
        return { statusCode: 200, body: 'Ignoring non-text message.' }; 
    }
    senderId = messageEntry.from; 
    messageText = messageEntry.text.body; 
    // --- End Provider Specific Parsing Example ---

    if (!senderId || typeof messageText === 'undefined') {
       throw new Error("Missing senderId or messageText after parsing payload");
    }
  } catch (error) {
     console.error("Failed to parse request body or extract message data:", error);
     return { statusCode: 400, body: 'Bad request - invalid payload format.' };
  }


  // TODO: Implement proper conversation state management (fetch/save from DB based on senderId)
  let conversationState = { state: 'start', pickup: null, dropoff: null }; 
  console.log(`Current state for ${senderId} (before NLP): ${conversationState.state}`);


  // 2. Process with NLP
  const nlpResult = await getIntentAndEntities(messageText, conversationState);
  conversationState.state = nlpResult.newState; 
  if (nlpResult.entities.pickup_location) conversationState.pickup = nlpResult.entities.pickup_location;
  if (nlpResult.entities.dropoff_location) conversationState.dropoff = nlpResult.entities.dropoff_location;
  console.log(`New state for ${senderId} (after NLP): ${conversationState.state}`);


  let replyMessage = "Sorry, I didn't understand that. Can you please rephrase?"; 

  // 3. Handle different intents and states
  try {
      switch (conversationState.state) {
        case 'awaiting_pickup':
          replyMessage = "Sure! Where would you like to be picked up?";
          break;
        case 'awaiting_dropoff':
          replyMessage = "Got it. And where are you heading?";
          break;
        case 'ready_for_quote':
          const pickupAddr = conversationState.pickup; 
          const dropoffAddr = conversationState.dropoff;

          if (pickupAddr && dropoffAddr) {
            await sendWhatsAppMessage(senderId, `Okay, calculating fare & ETA for luxury ride: ${pickupAddr} to ${dropoffAddr}...`); 

            // 4. Geocode addresses
            const originCoords = await geocodeAddress(pickupAddr);
            const destCoords = await geocodeAddress(dropoffAddr);

            if (originCoords && destCoords) {
              // 5. Get Route Details
              const routeDetails = await getRouteDetails(originCoords, destCoords);

              if (routeDetails) {
                // 6. Calculate Cost
                const estimatedCost = calculateCost(routeDetails);
                const etaMinutes = Math.round(routeDetails.durationSeconds / 60);
                const distanceKm = (routeDetails.distanceMeters / 1000).toFixed(1);

                // 7. Format and Send Quote
                replyMessage = `Est. trip: ${distanceKm} km / ${etaMinutes} min. Fare: $${estimatedCost}. Confirm request? (Reply Yes/No)`;
                conversationState.state = 'awaiting_confirmation'; 
              } else {
                replyMessage = "Sorry, I couldn't get route details. Please try again later.";
                conversationState.state = 'start'; // Reset state?
              }
            } else {
              replyMessage = "Sorry, I couldn't understand one or both addresses. Can you provide the pickup location again?";
              conversationState.state = 'awaiting_pickup'; // Reset state
              conversationState.pickup = null;
              conversationState.dropoff = null;
            }
          } else {
             replyMessage = "Sorry, I'm missing location details. Where would you like to be picked up?";
             conversationState.state = 'awaiting_pickup'; // Reset state
          }
          break;
        
        case 'awaiting_confirmation':
           if (messageText.toLowerCase() === 'yes') {
              replyMessage = "Great! Searching for a driver now...";
              // TODO: Trigger driver matching logic
              conversationState.state = 'finding_driver'; 
           } else if (messageText.toLowerCase() === 'no') {
              replyMessage = "Okay, request cancelled. Let me know if there's anything else.";
              conversationState.state = 'start'; // Reset state
           } else {
              replyMessage = "Please reply with 'Yes' to confirm or 'No' to cancel the quote.";
              // Keep state as 'awaiting_confirmation'
           }
           break;
           
        // TODO: Add other states/intents as needed 

        default:
          if (conversationState.state === 'start') {
              replyMessage = "Hi! How can I help you with your luxury transport needs today?";
          } 
          break;
      }

      // 8. Send the reply back to the user
      await sendWhatsAppMessage(senderId, replyMessage);

      // TODO: Update conversation state persistently here based on senderId

      // Return success to the webhook provider
      return {
        statusCode: 200,
        body: 'Message processed.', 
      };

  } catch (error) { // Catch errors in the main logic block
      console.error("Error processing message:", error);
      // Try to send a generic error message back to the user
      try {
          await sendWhatsAppMessage(senderId, "Sorry, something went wrong on my end. Please try again in a moment.");
      } catch (sendError) {
          console.error("Failed to send error message to user:", sendError);
      }
      // Return server error status code
      return { statusCode: 500, body: 'Internal Server Error' };
  }
};
