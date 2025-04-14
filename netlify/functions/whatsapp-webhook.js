// netlify/functions/whatsapp-webhook.js
// Reverted Version: Quote functionality only, uses Axios

const axios = require('axios');

// ==================================================
// == PRICING CONFIGURATION ==
// ==================================================
const ONE_WAY_BASE_FARE_USD = 10.00;
const ONE_WAY_RATE_PER_KM_USD = 1.12; // Approx $1.80 per mile
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

// Helper function to get the backend-specific Google Maps API key
function getGoogleMapsApiKey() {
    const apiKey = process.env.BACKEND_MAPS_API_KEY; // Using backend-specific key
    if (!apiKey) {
        console.error("Missing BACKEND_MAPS_API_KEY environment variable.");
        return null;
    }
    return apiKey;
}

// Helper to check if a time falls within peak hours
function isPeakTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string' || !/^\d{2}:\d{2}$/.test(timeStr)) { return false; }
    try {
        const [hourStr] = timeStr.split(':'); const hour = parseInt(hourStr, 10);
        if (isNaN(hour) || hour < 0 || hour > 23) { return false; }
        for (const range of PEAK_HOUR_RANGES) { if (hour >= range.start && hour < range.end) return true; }
    } catch (e) { console.error("Error parsing peak time:", e); return false; }
    return false;
}

// Google Maps API Functions using Axios (using backend key)
async function geocodeAddress(address, requestId) { // Added requestId for logging
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey || !address) return null;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    console.log(`Request ID: ${requestId}, Geocoding address: "${address}"`);
    try {
        const response = await axios.get(url, { timeout: 5000 }); // Added timeout
        if (response.data.status === 'OK' && response.data.results?.length > 0) {
            console.log(`Request ID: ${requestId}, Geocoded "${address}" successfully.`);
            return response.data.results[0].geometry.location;
        } else {
            console.error(`Request ID: ${requestId}, Geocoding API Error for "${address}": ${response.data.status}`, response.data.error_message || '');
            return null;
        }
    } catch (error) {
        console.error(`Request ID: ${requestId}, Network/Axios error during geocoding for "${address}":`, error.message);
        if (error.code === 'ECONNABORTED') { console.error(`Request ID: ${requestId}, Geocoding timed out.`); }
        if (error.response) { console.error('Axios Error Response:', error.response.status, error.response.data); }
        return null;
    }
}

async function getRouteDetails(originCoords, destCoords, requestId) { // Added requestId for logging
    const apiKey = getGoogleMapsApiKey();
     if (!apiKey || !originCoords || !destCoords) return null;
    const origin = `${originCoords.lat},${originCoords.lng}`;
    const destination = `${destCoords.lat},${destCoords.lng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}&units=metric`;
    console.log(`Request ID: ${requestId}, Getting route details from ${origin} to ${destination}`);
    try {
        const response = await axios.get(url, { timeout: 5000 }); // Added timeout
        if (response.data.status === 'OK' && response.data.rows?.[0]?.elements?.[0]?.status === 'OK') {
             const element = response.data.rows[0].elements[0];
             console.log(`Request ID: ${requestId}, Route details found.`);
             return { distanceMeters: element.distance.value, durationSeconds: element.duration.value };
        } else {
            console.error(`Request ID: ${requestId}, Distance Matrix API Error for route: ${response.data.status}`, response.data.error_message || response.data.rows?.[0]?.elements?.[0]?.status);
            return null;
        }
    } catch (error) {
        console.error(`Request ID: ${requestId}, Network/Axios error during route detail fetching:`, error.message);
        if (error.code === 'ECONNABORTED') { console.error(`Request ID: ${requestId}, Distance Matrix timed out.`); }
        if (error.response) { console.error('Axios Error Response:', error.response.status, error.response.data); }
        return null;
    }
}

// Cost Calculation (for one-way)
function calculateOneWayCost(distanceMeters, durationSeconds, isPickupAirport, isDropoffAirport, pickupTimeStr) {
     if (typeof distanceMeters !== 'number' || typeof durationSeconds !== 'number') { return 'N/A'; }
     const distanceKm = distanceMeters / 1000; const durationMinutes = durationSeconds / 60;
     let cost = ONE_WAY_BASE_FARE_USD + (ONE_WAY_RATE_PER_KM_USD * distanceKm) + (ONE_WAY_RATE_PER_MINUTE_USD * durationMinutes);
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
    const requestId = context.awsRequestId; // Use Netlify's request ID
    try {
        if (event.httpMethod !== 'POST') {
            return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Method Not Allowed' }) };
        }
        console.log(`Request ID: ${requestId}, Body length: ${event.body?.length || 0}`);

        let requestData;
        try {
            if (!event.body) throw new Error("Request body is empty.");
            requestData = JSON.parse(event.body);
            console.log(`Request ID: ${requestId}, Parsed action: ${requestData.action}, Parsed type: ${requestData.type}`);
        } catch (error) {
            console.error(`Request ID: ${requestId}, Error parsing request body:`, error);
            return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: "Bad request: Invalid JSON format." }) };
        }

        // --- ROUTE BASED ON ACTION ---
        // Only handle getQuote action now
        if (requestData.action === 'getQuote') {
            console.log(`Processing 'getQuote' action, Request ID: ${requestId}...`);

            const missingQuoteFields = [
                !requestData.type && "type", !requestData.pickupAddress && "pickupAddress", !requestData.pickupDate && "pickupDate", !requestData.pickupTime && "pickupTime",
                requestData.type === "one-way" && !requestData.dropoffAddress && "dropoffAddress", requestData.type === "hourly" && !requestData.durationHours && "durationHours",
            ].filter(Boolean);
            if (missingQuoteFields.length > 0) {
                console.error(`Request ID: ${requestId}, Quote request missing required fields: ${missingQuoteFields.join(", ")}`);
                return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Bad request: Missing required fields (${missingQuoteFields.join(", ")})` }) };
            }

            // Check for Maps API Key
             if (!process.env.BACKEND_MAPS_API_KEY) {
                 console.error(`BACKEND_MAPS_API_KEY not set, Request ID: ${requestId}`);
                 return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Server error: Maps API key not configured" }) };
             }

            // --- One-Way Quote ---
            if (requestData.type === 'one-way') {
                let distanceText, durationText, priceValue, routeDetails; // Declare routeDetails here
                 try {
                    const originCoords = await geocodeAddress(requestData.pickupAddress, requestId);
                    if (!originCoords) throw new Error("Invalid or unrecognized pickup address.");
                    const destCoords = await geocodeAddress(requestData.dropoffAddress, requestId);
                    if (!destCoords) throw new Error("Invalid or unrecognized drop-off address.");

                    routeDetails = await getRouteDetails(originCoords, destCoords, requestId); // Assign here
                    if (!routeDetails) throw new Error("Could not calculate route details.");

                    const isPickupAirport = requestData.isPickupAirport === 'true';
                    const isDropoffAirport = requestData.isDropoffAirport === 'true';
                    priceValue = calculateOneWayCost(routeDetails.distanceMeters, routeDetails.durationSeconds, isPickupAirport, isDropoffAirport, requestData.pickupTime);

                    // Format distance/duration text (use values from routeDetails if available)
                    distanceText = routeDetails.distanceMeters > 0 ? `${(routeDetails.distanceMeters / 1000).toFixed(1)} km` : 'N/A';
                    durationText = routeDetails.durationSeconds > 0 ? `${Math.round(routeDetails.durationSeconds / 60)} min` : 'N/A';

                 } catch (error) {
                     console.error(`Request ID: ${requestId}, Error during quote processing:`, error.message);
                     const errorMessage = error.message || "Failed to calculate quote.";
                     // Return 400 if it's an address issue, 500 otherwise
                     const statusCode = error.message.includes("address") ? 400 : 500;
                     return { statusCode: statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: errorMessage }) };
                 }

                const responsePayload = {
                    message: "Quote calculated successfully.", price: priceValue !== 'N/A' ? `$${priceValue}` : 'N/A', distance: distanceText, duration: durationText,
                    isPickupAirport: requestData.isPickupAirport === 'true', isDropoffAirport: requestData.isDropoffAirport === 'true',
                    pickupType: requestData.pickupType || null, pickupNotes: requestData.pickupNotes || null,
                    dropoffType: requestData.dropoffType || null, dropoffNotes: requestData.dropoffNotes || null,
                };
                console.log(`Request ID: ${requestId}, Sending one-way quote response.`);
                return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(responsePayload) };
            }
            // --- Hourly Quote ---
            else if (requestData.type === 'hourly') {
                 const duration = parseInt(requestData.durationHours, 10);
                 const isPickupAirport = requestData.isPickupAirport === 'true';
                 if (isNaN(duration) || duration < HOURLY_MINIMUM_HOURS) {
                     console.error(`Invalid durationHours: ${requestData.durationHours}, Request ID: ${requestId}`);
                     return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Bad request: durationHours must be a number >= ${HOURLY_MINIMUM_HOURS}` }) };
                 }
                 let cost = HOURLY_RATE_USD * duration;
                 if (isPeakTime(requestData.pickupTime)) { cost *= PEAK_MULTIPLIER; }
                 if (isPickupAirport) { cost += AIRPORT_PICKUP_FEE_USD; }
                 const estimatedCostValue = cost.toFixed(2);
                 const responsePayload = {
                    message: "Quote calculated successfully", price: `$${estimatedCostValue}`, distance: "N/A", duration: `${duration} hour${duration > 1 ? "s" : ""}`,
                    isPickupAirport: isPickupAirport, isDropoffAirport: false, pickupType: requestData.pickupType || null, pickupNotes: requestData.pickupNotes || null, dropoffType: null, dropoffNotes: null,
                 };
                 console.log(`Request ID: ${requestId}, Sending hourly quote response.`);
                 return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(responsePayload) };
            } else {
                console.error(`Invalid ride type for quote: ${requestData.type}, Request ID: ${requestId}`);
                return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: "Bad request: Invalid ride type. Must be 'one-way' or 'hourly'" }) };
            }
        }
        // --- Handle Unknown or Other Actions ---
        // Removed the 'book' action block entirely
        else {
            console.warn(`Unknown action received: ${requestData.action}, Request ID: ${requestId}`);
            return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Bad request: Invalid action '${requestData.action}'` }) };
        }
    } catch (error) {
        // Catch unexpected top-level errors
        console.error(`Unexpected top-level error in whatsapp-webhook, Request ID: ${requestId}:`, error);
        return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Server error: ${error.message}` }) };
    }
}; // End of exports.handler