const axios = require('axios');

// ==================================================
// == PRICING CONFIGURATION ==
// ==================================================
// Easily modify your rates and rules here!

// --- One-Way Rates ---
const ONE_WAY_BASE_FARE_USD = 10.00; // UPDATED base fare
const ONE_WAY_RATE_PER_KM_USD = 1.12; // Approx $1.80 per mile
const ONE_WAY_RATE_PER_MINUTE_USD = 0.35;
const MINIMUM_ONE_WAY_FARE_USD = 25.00; // Example minimum fare

// --- Hourly Rates ---
const HOURLY_RATE_USD = 75.00; // UPDATED hourly rate
const HOURLY_MINIMUM_HOURS = 3;

// --- Peak Time Surcharges ---
const PEAK_MULTIPLIER = 1.2; // 1.2x = 20% surcharge
// Define peak ranges using 24-hour format (hour starts, hour ends - exclusive)
const PEAK_HOUR_RANGES = [
    { start: 7, end: 9 },   // 7:00 AM - 8:59 AM
    { start: 17, end: 19 }, // 5:00 PM - 6:59 PM
    { start: 22, end: 24 }  // 10:00 PM - 11:59 PM
];

// --- Airport Fees ---
const AIRPORT_PICKUP_FEE_USD = 10.00;

// ==================================================
// == HELPER FUNCTIONS ==
// ==================================================

// Helper function to get Google Maps API key
function getGoogleMapsApiKey() {
    const apiKey = process.env.Maps_API_KEY;
    if (!apiKey) {
        console.error("Missing Maps_API_KEY environment variable.");
        return null;
    }
    return apiKey;
}

// --- UPDATED: Helper to check if a time falls within peak hours ---
function isPeakTime(timeStr) { // expects "HH:MM" format
    // 1. Basic check and Regex validation for HH:MM format
    if (!timeStr || typeof timeStr !== 'string' || !/^\d{2}:\d{2}$/.test(timeStr)) {
        console.log(`Peak check: Invalid time format received: ${timeStr}. Expected HH:MM.`);
        return false;
    }

    try {
        // 2. Parse hours and minutes
        const [hourStr, minuteStr] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        // 3. Validate numeric ranges
        if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            console.log(`Peak check: Invalid time values parsed: ${timeStr}`);
            return false;
        }

        // 4. Check against defined peak ranges
        for (const range of PEAK_HOUR_RANGES) {
            if (hour >= range.start && hour < range.end) {
                console.log(`Peak check: Time ${timeStr} (hour ${hour}) IS within peak range ${range.start}-${range.end}`);
                return true; // It's a peak hour
            }
        }
    } catch (e) {
        // Catch any unexpected parsing errors
        console.error(`Error parsing time string "${timeStr}" in isPeakTime:`, e);
        return false;
    }

    // 5. If no peak range matched
    console.log(`Peak check: Time ${timeStr} is NOT within any peak range.`);
    return false;
}

// --- Placeholder function for NLP (Keep original - not used by form handler) ---
async function getIntentAndEntities(messageText, conversationState) {
    console.log(`NLP processing (Placeholder): ${messageText}`);
    return { intent: 'unknown', entities: {}, newState: conversationState.state };
}

// --- Google Maps API Functions ---
async function geocodeAddress(address) {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
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
        if (response.data.status === 'OK' && response.data.results?.length > 0) {
            const location = response.data.results[0].geometry.location;
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
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
        return null;
    }
    if (!originCoords || !destCoords) {
        console.error("getRouteDetails function called with missing coordinates.");
        return null;
    }

    const origin = `${originCoords.lat},${originCoords.lng}`;
    const destination = `${destCoords.lat},${destCoords.lng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}&units=metric`;
    console.log(`Getting route details from ${origin} to ${destination}`);
    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK' && response.data.rows?.[0]?.elements?.[0]) {
            const element = response.data.rows[0].elements[0];
            if (element.status === 'OK') {
                const details = {
                    distanceMeters: element.distance.value,
                    durationSeconds: element.duration.value,
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

// --- UPDATED Cost Calculation (for one-way) ---
function calculateOneWayCost(routeDetails, isPickupAirport, isDropoffAirport, pickupTimeStr) {
    if (!routeDetails || typeof routeDetails.distanceMeters !== 'number' || typeof routeDetails.durationSeconds !== 'number') {
        console.error("Invalid route details for cost calculation:", routeDetails);
        return 'N/A';
    }

    const distanceKm = routeDetails.distanceMeters / 1000;
    const durationMinutes = routeDetails.durationSeconds / 60;

    // Calculate base cost using constants
    let cost = ONE_WAY_BASE_FARE_USD + ONE_WAY_RATE_PER_KM_USD * distanceKm + ONE_WAY_RATE_PER_MINUTE_USD * durationMinutes;
    console.log(`Base calculated cost (before adjustments): $${cost.toFixed(2)}`);

    // Apply peak hour surcharge if applicable
    if (isPeakTime(pickupTimeStr)) {
        cost = cost * PEAK_MULTIPLIER;
        console.log(`Applied peak hour multiplier (${PEAK_MULTIPLIER}x). Cost now: $${cost.toFixed(2)}`);
    }

    // Apply airport pickup fee if applicable
    if (isPickupAirport) {
        cost = cost + AIRPORT_PICKUP_FEE_USD;
        console.log(`Added airport pickup fee ($${AIRPORT_PICKUP_FEE_USD}) based on flag. Cost now: $${cost.toFixed(2)}`);
    }

    // Apply airport drop-off fee if applicable
    if (isDropoffAirport) {
        cost = cost + AIRPORT_PICKUP_FEE_USD;
        console.log(`Added airport drop-off fee ($${AIRPORT_PICKUP_FEE_USD}) based on flag. Cost now: $${cost.toFixed(2)}`);
    }

    // Apply minimum fare
    if (cost < MINIMUM_ONE_WAY_FARE_USD) {
        console.log(`Calculated cost $${cost.toFixed(2)} is below minimum $${MINIMUM_ONE_WAY_FARE_USD}. Using minimum.`);
        cost = MINIMUM_ONE_WAY_FARE_USD;
    }

    console.log(`Final calculated one-way cost: $${cost.toFixed(2)}`);
    return cost.toFixed(2); // Return final cost as string
}

// --- Placeholder WhatsApp Sending Function ---
async function sendWhatsAppMessage(senderId, messageText) {
    console.log(`Sending WA (Placeholder) to ${senderId}: ${messageText}`);
    return true;
}

// ==========================================================
// == HANDLER FUNCTION FOR WEB FORM DATA (Includes new pricing logic) ==
// ==========================================================
exports.handler = async (event) => {
    // 1. Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    console.log("Backend function received request body:", event.body);
    let formData;
    try {
        // 2. Parse JSON Body
        if (!event.body) {
            throw new Error("Request body is empty.");
        }
        formData = JSON.parse(event.body);
        console.log("Parsed form data:", formData);
    } catch (error) {
        console.error("Error parsing request body:", error);
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Bad request: Invalid JSON format." }),
        };
    }

    // 3. Basic validation
    if (!formData || !formData.type || !formData.pickupAddress || !formData.pickupDate || !formData.pickupTime) {
        console.error("Missing required form data fields.");
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Bad request: Missing required fields." }),
        };
    }

    // --- Main Logic ---
    try {
        // 4. Handle based on type
        if (formData.type === 'one-way') {
            console.log("Processing one-way request...");
            if (!formData.dropoffAddress) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "Bad request: Missing dropoff address for one-way." }),
                };
            }

            // Extract new airport-specific fields
            const pickupType = formData.pickupType || null;
            const pickupNotes = formData.pickupNotes || null;
            const dropoffType = formData.dropoffType || null;
            const dropoffNotes = formData.dropoffNotes || null;

            // Read airport flags directly from formData (converting string 'true'/'false' to boolean)
            const isPickupAirport = formData.isPickupAirport === 'true';
            const isDropoffAirport = formData.isDropoffAirport === 'true';

            // Call existing helper functions
            const originCoords = await geocodeAddress(formData.pickupAddress);
            if (!originCoords) {
                console.error(`Geocoding failed for pickup address: "${formData.pickupAddress}"`);
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "Invalid or unrecognized pickup address." }),
                };
            }

            const destCoords = await geocodeAddress(formData.dropoffAddress);
            if (!destCoords) {
                console.error(`Geocoding failed for drop-off address: "${formData.dropoffAddress}"`);
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "Invalid or unrecognized drop-off address." }),
                };
            }

            // Continue if both are okay...
            const routeDetails = await getRouteDetails(originCoords, destCoords);
            if (!routeDetails) {
                return {
                    statusCode: 500,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "Server error: Could not calculate route details." }),
                };
            }

            // Call UPDATED one-way cost function with boolean flags
            const estimatedCostValue = calculateOneWayCost(
                routeDetails,
                isPickupAirport,
                isDropoffAirport,
                formData.pickupTime
            );

            const distanceKm = routeDetails.distanceMeters > 0 ? (routeDetails.distanceMeters / 1000).toFixed(1) : 'N/A';
            const durationMinutes = routeDetails.durationSeconds > 0 ? Math.round(routeDetails.durationSeconds / 60) : 'N/A';

            // Return success response with new fields included
            const responsePayload = {
                message: "Quote calculated successfully.",
                price: estimatedCostValue !== 'N/A' ? `$${estimatedCostValue}` : 'N/A',
                distance: distanceKm !== 'N/A' ? `${distanceKm} km` : 'N/A',
                duration: durationMinutes !== 'N/A' ? `${durationMinutes} min` : 'N/A',
                isPickupAirport: isPickupAirport,
                isDropoffAirport: isDropoffAirport,
                pickupType: pickupType,
                pickupNotes: pickupNotes,
                dropoffType: dropoffType,
                dropoffNotes: dropoffNotes,
            };
            console.log("Sending response:", responsePayload);
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(responsePayload),
            };
        } else if (formData.type === 'hourly') {
            console.log("Processing hourly request...");
            if (!formData.durationHours) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "Bad request: Missing duration for hourly." }),
                };
            }

            const duration = parseInt(formData.durationHours, 10);
            // Read airport flag for hourly pickup
            const isPickupAirport = formData.isPickupAirport === 'true';

            // Enforce minimum hours
            if (isNaN(duration) || duration < HOURLY_MINIMUM_HOURS) {
                console.log(`Hourly duration ${duration} is less than minimum ${HOURLY_MINIMUM_HOURS}.`);
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Bad request: Minimum booking is ${HOURLY_MINIMUM_HOURS} hours.` }),
                };
            }

            // Calculate base hourly cost using constant
            let cost = HOURLY_RATE_USD * duration;
            console.log(`Base hourly cost (${duration} hrs @ $${HOURLY_RATE_USD}/hr): $${cost.toFixed(2)}`);

            // Apply peak hour surcharge
            if (isPeakTime(formData.pickupTime)) {
                cost = cost * PEAK_MULTIPLIER;
                console.log(`Applied peak hour multiplier (${PEAK_MULTIPLIER}x). Cost now: $${cost.toFixed(2)}`);
            }

            // Apply airport pickup fee based on flag
            if (isPickupAirport) {
                cost = cost + AIRPORT_PICKUP_FEE_USD;
                console.log(`Added airport pickup fee ($${AIRPORT_PICKUP_FEE_USD}) to hourly rate based on flag. Cost now: $${cost.toFixed(2)}`);
            }

            const estimatedCostValue = cost.toFixed(2);

            // Return success response for hourly
            const responsePayload = {
                message: "Quote calculated successfully.",
                price: `$${estimatedCostValue}`,
                duration: `${duration} hours`,
            };
            console.log("Sending response:", responsePayload);
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(responsePayload),
            };
        } else {
            console.error("Invalid booking type received:", formData.type);
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Bad request: Invalid booking type." }),
            };
        }
    } catch (error) {
        console.error("Internal server error during quote processing:", error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Internal Server Error processing your request." }),
        };
    }
}; // End of exports.handler