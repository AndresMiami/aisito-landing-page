// netlify/functions/whatsapp-webhook.js

// Import necessary libraries
const { Client } = require("@googlemaps/google-maps-services-js");
const Brevo = require('@getbrevo/brevo'); // Use Brevo library

// Initialize Google Maps client (key passed per request)
const mapsClient = new Client({});

// Log environment variable presence (not values) for debugging on load
console.log("Environment variables configured:", {
  hasMapsKey: !!process.env.BACKEND_MAPS_API_KEY,
  hasBrevoKey: !!process.env.BREVO_API_KEY, // Check for Brevo key
  hasToEmail: !!process.env.TO_EMAIL_ADDRESS,
  hasFromEmail: !!process.env.FROM_EMAIL_ADDRESS,
});

// ==================================================
// == PRICING CONFIGURATION ==
// ==================================================
const ONE_WAY_BASE_FARE_USD = 10.00;
const ONE_WAY_RATE_PER_KM_USD = 1.12;
const ONE_WAY_RATE_PER_MINUTE_USD = 0.35;
const MINIMUM_ONE_WAY_FARE_USD = 25.00;
const HOURLY_RATE_USD = 75.00;
const HOURLY_MINIMUM_HOURS = 3;
const PEAK_MULTIPLIER = 1.2;
const PEAK_HOUR_RANGES = [{ start: 7, end: 9 }, { start: 17, end: 19 }, { start: 22, end: 24 }];
const AIRPORT_PICKUP_FEE_USD = 10.00;

// ==================================================
// == HELPER FUNCTIONS ==
// ==================================================

// Escape HTML characters for email safety
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  const htmlEntities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"']/g, (match) => htmlEntities[match]);
}

// Check if a time falls within peak hours
function isPeakTime(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || !/^\d{2}:\d{2}$/.test(timeStr)) { return false; }
  try {
    const [hourStr] = timeStr.split(":"); const hour = parseInt(hourStr, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) { return false; }
    for (const range of PEAK_HOUR_RANGES) { if (hour >= range.start && hour < range.end) return true; }
  } catch (e) { console.error("Error parsing peak time:", e); return false; }
  return false;
}

// Calculate cost for one-way trips
function calculateOneWayCost(distanceMeters, durationSeconds, isPickupAirport, isDropoffAirport, pickupTimeStr) {
  if (typeof distanceMeters !== "number" || typeof durationSeconds !== "number") { console.error("Invalid route details for one-way cost calculation:", { distanceMeters, durationSeconds }); return "N/A"; }
  const distanceKm = distanceMeters / 1000; const durationMinutes = durationSeconds / 60;
  let cost = ONE_WAY_BASE_FARE_USD + ONE_WAY_RATE_PER_KM_USD * distanceKm + ONE_WAY_RATE_PER_MINUTE_USD * durationMinutes;
  if (isPeakTime(pickupTimeStr)) { cost *= PEAK_MULTIPLIER; }
  if (isPickupAirport) { cost += AIRPORT_PICKUP_FEE_USD; }
  if (isDropoffAirport) { cost += AIRPORT_PICKUP_FEE_USD; }
  cost = Math.max(cost, MINIMUM_ONE_WAY_FARE_USD);
  console.log(`Final one-way cost: $${cost.toFixed(2)}`);
  return cost.toFixed(2);
}

// ==========================================================
// == MAIN HANDLER FUNCTION ==
// ==========================================================
exports.handler = async (event, context) => {
  const requestId = context.awsRequestId;
  try {
    // Validate HTTP method
    if (event.httpMethod !== "POST") { /* ... return 405 ... */
         console.error(`Invalid HTTP method: ${event.httpMethod}, Request ID: ${requestId}`);
         return { statusCode: 405, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Method Not Allowed" }) };
    }
    console.log(`Request ID: ${requestId}, Body length: ${event.body?.length || 0}`);

    // Parse request body
    let requestData;
    try { /* ... parse body ... */
        if (!event.body) throw new Error("Request body is empty");
        requestData = JSON.parse(event.body);
        console.log(`Request ID: ${requestId}, Parsed action: ${requestData.action}, Parsed type: ${requestData.type}`);
    } catch (error) { /* ... return 400 ... */
        console.error(`Error parsing request body, Request ID: ${requestId}:`, error);
        return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Bad request: Invalid JSON format" }) };
    }

    // Validate action
    if (!requestData.action) { /* ... return 400 ... */
        console.error(`Missing action in request data, Request ID: ${requestId}`);
        return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Bad request: Missing 'action' field" }) };
    }

    // --- ROUTE BASED ON ACTION ---

    // --- Action: getQuote ---
    if (requestData.action === "getQuote") {
      console.log(`Processing 'getQuote' action, Request ID: ${requestId}...`);
       // (Quote validation and logic remains the same as previous correct version)
      const missingQuoteFields = [ /* ... check fields ... */
          !requestData.type && "type", !requestData.pickupAddress && "pickupAddress", !requestData.pickupDate && "pickupDate", !requestData.pickupTime && "pickupTime",
          requestData.type === "one-way" && !requestData.dropoffAddress && "dropoffAddress", requestData.type === "hourly" && !requestData.durationHours && "durationHours",
      ].filter(Boolean);
      if (missingQuoteFields.length > 0) { /* ... return 400 ... */
          console.error(`Quote request missing required fields: ${missingQuoteFields.join(", ")}, Request ID: ${requestId}`);
          return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `Bad request: Missing required fields (${missingQuoteFields.join(", ")})` }) };
      }

      if (requestData.type === "one-way") { /* ... one-way quote logic using mapsClient.distancematrix ... */
           if (!process.env.BACKEND_MAPS_API_KEY) { /* ... return 500 ... */
                console.error(`BACKEND_MAPS_API_KEY not set, Request ID: ${requestId}`);
                return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Server error: Google Maps API key not configured" }) };
           }
           let distanceText, durationText, priceValue;
           try { /* ... call distancematrix, calculate price using calculateOneWayCost ... */
                console.log(`Request ID: ${requestId}, Calling Google Maps Distance Matrix API...`);
                const response = await mapsClient.distancematrix({ params: { origins: [requestData.pickupAddress], destinations: [requestData.dropoffAddress], key: process.env.BACKEND_MAPS_API_KEY, units: "metric", mode: "driving" }, timeout: 5000 });
                console.log(`Request ID: ${requestId}, Distance Matrix Status: ${response.data.status}`);
                if (response.data.status === "OVER_QUERY_LIMIT") { console.warn(`Request ID: ${requestId}, Maps API quota exceeded.`); }
                if (response.data.status !== "OK" || response.data.rows[0].elements[0].status !== "OK") { const elementStatus = response.data.rows[0].elements[0].status; console.error(`Request ID: ${requestId}, Distance Matrix API error: ${elementStatus}`, response.data.error_message || ''); throw new Error(`Unable to calculate route: ${elementStatus}`); }
                const element = response.data.rows[0].elements[0]; distanceText = element.distance.text; durationText = element.duration.text; const distanceMeters = element.distance.value; const durationSeconds = element.duration.value;
                const isPickupAirport = requestData.isPickupAirport === "true"; const isDropoffAirport = requestData.isDropoffAirport === "true";
                priceValue = calculateOneWayCost( distanceMeters, durationSeconds, isPickupAirport, isDropoffAirport, requestData.pickupTime );
           } catch (error) { /* ... handle errors, return 500 ... */
                console.error(`Request ID: ${requestId}, Error during Maps API call/price calc:`, error);
                const errorMessage = error.code === "ETIMEDOUT" ? "Google Maps API timed out" : error.message;
                return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `Failed to calculate quote: ${errorMessage}` }) };
           }
           const responsePayload = { /* ... create payload ... */
                message: "Quote calculated successfully", price: priceValue !== "N/A" ? `$${priceValue}` : "N/A", distance: distanceText, duration: durationText, isPickupAirport: requestData.isPickupAirport === "true", isDropoffAirport: requestData.isDropoffAirport === "true", pickupType: requestData.pickupType || null, pickupNotes: requestData.pickupNotes || null, dropoffType: requestData.dropoffType || null, dropoffNotes: requestData.dropoffNotes || null, };
           console.log(`Request ID: ${requestId}, Sending one-way quote response.`);
           return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(responsePayload) };
      }
      else if (requestData.type === "hourly") { /* ... hourly quote logic using constants ... */
            const duration = parseInt(requestData.durationHours, 10); const isPickupAirport = requestData.isPickupAirport === "true";
            if (isNaN(duration) || duration < HOURLY_MINIMUM_HOURS) { /* ... return 400 ... */
                 console.error(`Invalid durationHours: ${requestData.durationHours}, Request ID: ${requestId}`);
                 return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `Bad request: durationHours must be a number >= ${HOURLY_MINIMUM_HOURS}` }) };
            }
            let cost = HOURLY_RATE_USD * duration; if (isPeakTime(requestData.pickupTime)) { cost *= PEAK_MULTIPLIER; } if (isPickupAirport) { cost += AIRPORT_PICKUP_FEE_USD; }
            const estimatedCostValue = cost.toFixed(2);
            const responsePayload = { /* ... create payload ... */
                 message: "Quote calculated successfully", price: `$${estimatedCostValue}`, distance: "N/A", duration: `${duration} hour${duration > 1 ? "s" : ""}`, isPickupAirport: isPickupAirport, isDropoffAirport: false, pickupType: requestData.pickupType || null, pickupNotes: requestData.pickupNotes || null, dropoffType: null, dropoffNotes: null, };
            console.log(`Request ID: ${requestId}, Sending hourly quote response.`);
            return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(responsePayload) };
      } else { /* ... return 400 invalid type ... */
           console.error(`Invalid ride type for quote: ${requestData.type}, Request ID: ${requestId}`);
           return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Bad request: Invalid ride type. Must be 'one-way' or 'hourly'" }) };
      }
    }

    // ---> Action: book (Using Brevo) <---
    else if (requestData.action === "book") {
      console.log(`Processing 'book' action with Brevo, Request ID: ${requestId}...`);

      // --- Get Brevo Environment Variables ---
      const BREVO_API_KEY = process.env.BREVO_API_KEY;
      const TO_EMAIL = process.env.TO_EMAIL_ADDRESS;
      // Use FROM_EMAIL_ADDRESS, ensure it's verified in Brevo
      const FROM_EMAIL = process.env.FROM_EMAIL_ADDRESS;
      const SENDER_NAME = "I ❤️ Miami Booking"; // Or pull from env var if needed

      // --- Validate Environment Variables ---
      if (!BREVO_API_KEY || !TO_EMAIL || !FROM_EMAIL) {
        console.error(`Request ID: ${requestId}, Missing Brevo environment variables:`, { hasApiKey: !!BREVO_API_KEY, hasToEmail: !!TO_EMAIL, hasFromEmail: !!FROM_EMAIL });
        return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Booking failed: Email service configuration error" }) };
      }

      // --- Initialize Brevo Client ---
      try {
        let defaultClient = Brevo.ApiClient.instance;
        let apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = BREVO_API_KEY; // Set the API key
      } catch (error) {
        console.error(`Request ID: ${requestId}, Failed to configure Brevo API key:`, error);
        return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: "Booking failed: Email service initialization error." }) };
      }

      // --- Extract Booking Details ---
      const { /* ... Extract data same as before ... */
          type: rideType, pickupAddress, dropoffAddress, pickupDate, pickupTime, durationHours, quotePrice, quoteDistance, quoteDuration,
          passengerName = "N/A", passengerPhone = "N/A", passengerEmail = "N/A", pickupType = null, pickupNotes = null, dropoffType = null, dropoffNotes = null,
          isPickupAirport = requestData.isPickupAirport === "true", isDropoffAirport = requestData.isDropoffAirport === "true"
      } = requestData;

      // --- Validate essential booking data ---
       const missingBookingFields = [ /* ... check fields ... */
            !rideType && "rideType", !pickupAddress && "pickupAddress", !pickupDate && "pickupDate", !pickupTime && "pickupTime", !quotePrice && "quotePrice",
            rideType === "one-way" && !dropoffAddress && "dropoffAddress", rideType === "hourly" && !durationHours && "durationHours",
       ].filter(Boolean);
      if (missingBookingFields.length > 0) { /* ... return 400 ... */
           console.error(`Request ID: ${requestId}, Missing essential booking fields: ${missingBookingFields.join(", ")}`);
           return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `Bad request: Missing essential fields (${missingBookingFields.join(", ")})` }) };
      }

      // --- Format Email Content (same as before) ---
      const rideTypeText = rideType === "one-way" ? "One Way" : `By the Hour (${durationHours} hours)`;
      const subject = `New Ride Booking Request - ${rideTypeText} - ${pickupDate}`;
      let emailBodyHtml = `<h2>New I ❤️ Miami Ride Booking Request</h2><p>Request ID: ${requestId}</p><p>A new booking request was submitted:</p><hr>`;
      emailBodyHtml += `<h3>Passenger Details:</h3><p><strong>Name:</strong> ${escapeHtml(passengerName)}</p><p><strong>Phone:</strong> ${escapeHtml(passengerPhone)}</p><p><strong>Email:</strong> ${escapeHtml(passengerEmail)}</p><hr>`;
      emailBodyHtml += `<h3>Ride Details:</h3><p><strong>Type:</strong> ${escapeHtml(rideTypeText)}</p><p><strong>Pickup Date:</strong> ${escapeHtml(pickupDate)}</p><p><strong>Pickup Time:</strong> ${escapeHtml(pickupTime)}</p><p><strong>From:</strong> ${escapeHtml(pickupAddress)}</p>`;
      if (isPickupAirport) { emailBodyHtml += `<p><em>Pickup is at an Airport</em></p><p><strong>Pickup Type:</strong> ${escapeHtml(pickupType || "N/A")}</p><p><strong>Pickup Notes:</strong> ${escapeHtml(pickupNotes || "None")}</p>`; }
      if (rideType === "one-way") { emailBodyHtml += `<p><strong>To:</strong> ${escapeHtml(dropoffAddress)}</p>`;
        if (isDropoffAirport) { emailBodyHtml += `<p><em>Dropoff is at an Airport</em></p><p><strong>Dropoff Type:</strong> ${escapeHtml(dropoffType || "N/A")}</p><p><strong>Dropoff Notes:</strong> ${escapeHtml(dropoffNotes || "None")}</p>`; }
      }
      emailBodyHtml += `<hr><h3>Quote Details (at time of quote):</h3><p><strong>Quoted Price:</strong> ${escapeHtml(quotePrice)}</p>`;
      if (rideType === "one-way") { emailBodyHtml += `<p><strong>Est. Distance:</strong> ${escapeHtml(quoteDistance || "N/A")}</p><p><strong>Est. Duration:</strong> ${escapeHtml(quoteDuration || "N/A")}</p>`; }
      emailBodyHtml += `<hr><p>Please contact the passenger ASAP to confirm.</p>`;

      // --- Construct Brevo Message Object ---
      let apiInstance = new Brevo.TransactionalEmailsApi();
      let sendSmtpEmail = new Brevo.SendSmtpEmail();

      sendSmtpEmail.sender = { email: FROM_EMAIL, name: SENDER_NAME }; // Use verified FROM_EMAIL
      sendSmtpEmail.to = [{ email: TO_EMAIL }]; // Recipient email address
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = emailBodyHtml;
      // Set Reply-To if passenger email is valid
      if (passengerEmail && passengerEmail !== 'N/A') {
          sendSmtpEmail.replyTo = { email: passengerEmail, name: passengerName !== 'N/A' ? passengerName : undefined };
      }

      // --- Send Email ---
      try {
        console.log(`Attempting Brevo email to ${TO_EMAIL} from ${FROM_EMAIL}, Request ID: ${requestId}...`);
        // console.log("Email payload:", JSON.stringify(sendSmtpEmail, null, 2)); // Keep commented unless debugging
        const brevoResponse = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`Request ID: ${requestId}, Brevo send response:`, JSON.stringify(brevoResponse, null, 2)); // Log Brevo response body
        console.log("Booking email sent successfully via Brevo!");
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Booking request sent successfully! You will be contacted shortly." }),
        };
      } catch (emailError) {
        console.error(`Error sending email via Brevo, Request ID: ${requestId}:`, emailError);
        // Brevo errors might be structured differently, log the whole thing
        console.error("Brevo Error Details:", JSON.stringify(emailError.response?.body || emailError.response?.data || emailError.message || emailError, null, 2));
        console.error("Error stack:", emailError.stack);
        return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Booking failed: Could not send notification email via Brevo" }), // Updated error message source
        };
      }
    }

    // --- Handle Unknown Action ---
    else {
      console.warn(`Unknown action received: ${requestData.action}, Request ID: ${requestId}`);
      return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `Bad request: Invalid action '${requestData.action}'` }) };
    }
  } catch (error) {
    // Catch unexpected top-level errors
    const requestId = context.awsRequestId || "N/A";
    console.error(`Unexpected top-level error in whatsapp-webhook, Request ID: ${requestId}:`, error);
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `Server error: ${error.message}` }) };
  }
}; // End of exports.handler