// netlify/functions/calculate-quote.js
// Version for: Usage-Based, Tiered Miles, Surcharges, Backend Distance Matrix Call

const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // 1. Parse Inputs (sent from frontend)
    const { originPlaceId, destinationPlaceId, selectedVehicleType, isAirportPickup, pickupTimestamp, isAsap } = JSON.parse(event.body);
    const apiKey = process.env.BACKEND_MAPS_API_KEY; // Your secure backend key

    // 2. Validate Inputs
    if (!originPlaceId || !destinationPlaceId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing origin or destination place ID' }) };
    }
    if (!selectedVehicleType) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing selected vehicle type' }) };
    }
    // Ensure some time info is present (needed for surcharge checks)
    if (isAsap === undefined && !pickupTimestamp) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing booking time information' }) };
    }
    if (!apiKey) {
      console.error("FATAL: BACKEND_MAPS_API_KEY environment variable not configured in Netlify.");
      return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' }) };
    }

    // 3. Call Google Distance Matrix API
    const units = 'imperial'; // Request miles/feet
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=place_id:${originPlaceId}&destinations=place_id:${destinationPlaceId}&units=${units}&key=${apiKey}`;
    console.log("Requesting Distance Matrix API...");
    const mapsResponse = await fetch(url);
    const data = await mapsResponse.json();
    console.log("Distance Matrix Response Status:", data.status);
    if (data.status !== 'OK') {
      console.error("Distance Matrix API Error Response:", JSON.stringify(data));
    }

    // Validate Distance Matrix Response more robustly
    if (data.status !== 'OK' || data.rows?.[0]?.elements?.[0]?.status !== 'OK' || !data.rows[0].elements[0].distance?.value || !data.rows[0].elements[0].duration?.value) {
        // Check for value explicitly, status OK doesn't guarantee distance/duration object exists
      const specificError = data.rows?.[0]?.elements?.[0]?.status || data.status || 'Incomplete route data';
      console.error(`Failed to get valid distance/duration values from Distance Matrix: ${specificError}`);
      if (specificError === 'ZERO_RESULTS') {
        return { statusCode: 400, body: JSON.stringify({ error: 'Could not calculate route between locations.' }) };
      }
      return { statusCode: 500, body: JSON.stringify({ error: `Failed to get valid route details: ${specificError}` }) };
    }

    // 4. Extract Distance and Duration
    const element = data.rows[0].elements[0];
    const distanceMeters = element.distance.value;
    const durationSeconds = element.duration.value;
    const distanceMiles = distanceMeters / 1609.34; // Convert meters to miles
    const durationMinutes = durationSeconds / 60; // Convert seconds to minutes
    console.log(`Route Calculated - Distance: ${distanceMiles.toFixed(2)} miles, Duration: ${durationMinutes.toFixed(2)} minutes`);

    // 5. Define Rate Structure & Threshold
    //    VVVVVV CALIBRATE THESE RATES BASED ON YOUR RESEARCH VVVVVV
    const vehicleRates = {
        'Luxury Sedan':     { base: 5.00, perMileShort: 2.08, perMileLong: 1.60, perMinute: 0.35, p2pMin: 15.00 },
        'Premium SUV':      { base: 8.00, perMileShort: 2.86, perMileLong: 2.20, perMinute: 0.45, p2pMin: 25.00 },
        'VIP Group Sprinter':{ base: 15.00, perMileShort: 3.64, perMileLong: 2.80, perMinute: 0.60, p2pMin: 40.00 }
    };
    const distanceThreshold = 75; // Miles for tiered rate
    //    ^^^^^^ ADJUST RATES AND THRESHOLD ABOVE ^^^^^^

    // 6. Select Rates for Chosen Vehicle
    const rateInfo = vehicleRates[selectedVehicleType];
    if (!rateInfo) {
      return { statusCode: 400, body: JSON.stringify({ error: `Invalid vehicle type specified: ${selectedVehicleType}` }) };
    }

    // 7. Calculate Base Fare (Tiered Miles & Vehicle Min)
    const applicablePerMileRate = distanceMiles > distanceThreshold ? rateInfo.perMileLong : rateInfo.perMileShort;
    let calculatedPrice = rateInfo.base + (distanceMiles * applicablePerMileRate) + (durationMinutes * rateInfo.perMinute);
    calculatedPrice = Math.max(calculatedPrice, rateInfo.p2pMin); // Apply vehicle minimum fare

    // 8. Apply Airport Pickup Surcharge
    const airportPickupFee = 10.00; // Flat fee from report
    if (isAirportPickup === true) { // Check flag sent from frontend
      calculatedPrice += airportPickupFee;
      console.log(`Applied +$${airportPickupFee.toFixed(2)} airport pickup fee.`);
      // Optional: Re-apply vehicle minimum *after* adding fee if policy requires it
      // calculatedPrice = Math.max(calculatedPrice, rateInfo.p2pMin + airportPickupFee);
    }

    // 9. Apply Time/Event Minimum ($25 Floor)
    const timeEventMinimum = 25.00;
    let applyTimeEventMinimum = false;
    // Use scheduled time if provided (as ISO string or timestamp), otherwise use current server time
    // IMPORTANT: Consider server timezone vs. desired local timezone (e.g., EDT/EST) for accurate checks
    // Using simple getHours()/getDay() assumes server runs in the target timezone or difference is acceptable.
    // For production, use a library like date-fns-tz to handle timezones robustly.
    const checkDate = pickupTimestamp ? new Date(pickupTimestamp) : new Date();
    const currentHour = checkDate.getHours();
    const currentDay = checkDate.getDay(); // 0=Sun

    // Define surcharge periods from report
    const isLateNight = currentHour >= 0 && currentHour < 5; // 12:00 AM - 4:59 AM
    const isRushHour = (currentDay >= 1 && currentDay <= 5) && ((currentHour >= 7 && currentHour < 10) || (currentHour >= 16 && currentHour < 19)); // M-F 7-9:59 AM or 4-6:59 PM
    const isWeekend = (currentDay === 5 && currentHour >= 19) || currentDay === 6 || currentDay === 0; // Fri 7pm+, Sat, Sun

    // TODO: Implement actual event checking logic here if needed (e.g., check checkDate against event list)
    const isEventTime = false; // Placeholder

    if (isLateNight || isRushHour || isWeekend || isEventTime) {
      applyTimeEventMinimum = true;
      console.log(`Surcharge condition met: LateNight=${isLateNight}, RushHour=${isRushHour}, Weekend=${isWeekend}, Event=${isEventTime}`);
    }

    if (applyTimeEventMinimum) {
      calculatedPrice = Math.max(calculatedPrice, timeEventMinimum);
      console.log(`Price after applying $${timeEventMinimum.toFixed(2)} minimum trip charge: $${calculatedPrice.toFixed(2)}`);
    }

    // 10. Round and Return Final Quote
    const finalQuote = Math.round(calculatedPrice * 100) / 100;
    console.log(`Final Calculated Quote for ${selectedVehicleType}: $${finalQuote.toFixed(2)}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quote: finalQuote // Key is 'quote', value is the final number
      }),
    };

  } catch (error) {
    console.error('Netlify Function Error:', error);
    if (error instanceof SyntaxError) { // Catch potential JSON parse errors
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body format.' }) };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An internal server error occurred while calculating the quote.' }),
    };
  }
};