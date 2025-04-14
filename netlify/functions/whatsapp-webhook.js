// netlify/functions/whatsapp-webhook.js

const { Client } = require("@googlemaps/google-maps-services-js");
const Brevo = require("@getbrevo/brevo");
const mapsClient = new Client({});
const JSON_HEADER = { "Content-Type": "application/json" };

console.log("Environment variables configured:", {
  hasMapsKey: !!process.env.BACKEND_MAPS_API_KEY,
  hasBrevoKey: !!process.env.BREVO_API_KEY,
  hasToEmail: !!process.env.TO_EMAIL_ADDRESS,
  hasFromEmail: !!process.env.FROM_EMAIL_ADDRESS,
});

const ONE_WAY_BASE_FARE_USD = 10.0;
const ONE_WAY_RATE_PER_KM_USD = 1.12;
const ONE_WAY_RATE_PER_MINUTE_USD = 0.35;
const MINIMUM_ONE_WAY_FARE_USD = 25.0;
const HOURLY_RATE_USD = 75.0;
const HOURLY_MINIMUM_HOURS = 3;
const PEAK_MULTIPLIER = 1.2;
const PEAK_HOUR_RANGES = [
  { start: 7, end: 9 },
  { start: 17, end: 19 },
  { start: 22, end: 24 },
];
const AIRPORT_PICKUP_FEE_USD = 10.0;

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  const htmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;", // Fixed: Changed from '"""' to '"'
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (match) => htmlEntities[match]);
}

function isPeakTime(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || !/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [hourStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  if (isNaN(hour) || hour < 0 || hour > 23) return false;
  return PEAK_HOUR_RANGES.some((range) => hour >= range.start && hour < range.end);
}

function calculateOneWayCost(distanceMeters, durationSeconds, isPickupAirport, isDropoffAirport, pickupTimeStr) {
  if (typeof distanceMeters !== "number" || typeof durationSeconds !== "number") {
    console.error("Invalid route details for one-way cost calculation:", {
      distanceMeters,
      durationSeconds,
    });
    return "N/A";
  }
  const distanceKm = distanceMeters / 1000;
  const durationMinutes = durationSeconds / 60;
  let cost =
    ONE_WAY_BASE_FARE_USD +
    ONE_WAY_RATE_PER_KM_USD * distanceKm +
    ONE_WAY_RATE_PER_MINUTE_USD * durationMinutes;
  if (isPeakTime(pickupTimeStr)) cost *= PEAK_MULTIPLIER;
  if (isPickupAirport) cost += AIRPORT_PICKUP_FEE_USD;
  if (isDropoffAirport) cost += AIRPORT_PICKUP_FEE_USD;
  return Math.max(cost, MINIMUM_ONE_WAY_FARE_USD).toFixed(2);
}

exports.handler = async (event, context) => {
  console.log("Incoming event.body:", event.body);

  const requestId = context.awsRequestId;
  if (event.httpMethod !== "POST") {
    console.error(`Invalid HTTP method: ${event.httpMethod}, Request ID: ${requestId}`);
    return {
      statusCode: 405,
      headers: JSON_HEADER,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  let requestData;
  try {
    requestData = JSON.parse(event.body || '{}');
    console.log("Parsed body:", requestData);
    console.log("Action received:", requestData.action);
    if (!requestData.action) throw new Error("Missing 'action' field");
  } catch (error) {
    console.error(`Request ID: ${requestId}, Invalid JSON or missing action:`, error);
    return {
      statusCode: 400,
      headers: JSON_HEADER,
      body: JSON.stringify({ message: "Bad request: Invalid JSON or missing 'action'" }),
    };
  }

  // ------------------------------
  // BOOKING (Brevo Email Sending)
  // ------------------------------
  if (requestData.action === "book") {
    console.log(`Processing 'book' action, Request ID: ${requestId}`);

    const {
      type: rideType,
      pickupAddress,
      dropoffAddress,
      pickupDate,
      pickupTime,
      durationHours,
      quotePrice,
      quoteDistance,
      quoteDuration,
      passengerName = "N/A",
      passengerPhone = "N/A",
      passengerEmail = "N/A",
      pickupType,
      pickupNotes,
      dropoffType,
      dropoffNotes,
      isPickupAirport,
      isDropoffAirport,
    } = requestData;

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const TO_EMAIL = process.env.TO_EMAIL_ADDRESS;
    const FROM_EMAIL = process.env.FROM_EMAIL_ADDRESS;
    const SENDER_NAME = process.env.FROM_NAME || "I ❤️ Miami Booking";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!BREVO_API_KEY || !TO_EMAIL || !FROM_EMAIL) {
      console.error("Missing email service environment variables");
      return {
        statusCode: 500,
        headers: JSON_HEADER,
        body: JSON.stringify({ message: "Email configuration error" }),
      };
    }
    if (!emailRegex.test(TO_EMAIL) || !emailRegex.test(FROM_EMAIL)) {
      console.error("Invalid email addresses configured:", { TO_EMAIL, FROM_EMAIL });
      return {
        statusCode: 500,
        headers: JSON_HEADER,
        body: JSON.stringify({ message: "Invalid email address format in config" }),
      };
    }

    const requiredFields = [
      !rideType && "type",
      !pickupAddress && "pickupAddress",
      !pickupDate && "pickupDate",
      !pickupTime && "pickupTime",
      !quotePrice && "quotePrice",
      rideType === "one-way" && !dropoffAddress && "dropoffAddress",
      rideType === "hourly" && !durationHours && "durationHours",
    ].filter(Boolean);
    if (requiredFields.length > 0) {
      console.error(`Missing booking fields: ${requiredFields.join(", ")}`);
      return {
        statusCode: 400,
        headers: JSON_HEADER,
        body: JSON.stringify({ message: `Missing required fields: ${requiredFields.join(", ")}` }),
      };
    }

    let apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(BREVO_API_KEY);

    const rideTypeText =
      rideType === "one-way" ? "One Way" : `Hourly (${durationHours} hour${durationHours > 1 ? "s" : ""})`;
    const subject = `🚗 New Booking Request - ${rideTypeText} on ${pickupDate}`;

    let html = `<h2>New Ride Booking</h2><p><strong>Request ID:</strong> ${requestId}</p><hr>`;
    html += `<h3>Passenger Info</h3><p>Name: ${escapeHtml(passengerName)}</p><p>Phone: ${escapeHtml(
      passengerPhone
    )}</p><p>Email: ${escapeHtml(passengerEmail)}</p><hr>`;
    html += `<h3>Ride Info</h3><p>Type: ${rideTypeText}</p><p>Date: ${pickupDate}</p><p>Time: ${pickupTime}</p><p>Pickup: ${pickupAddress}</p>`;
    if (isPickupAirport) {
      html += `<p><em>Pickup is at an airport</em></p><p>Type: ${pickupType || "N/A"}</p><p>Notes: ${
        pickupNotes || "None"
      }</p>`;
    }
    if (rideType === "one-way") {
      html += `<p>Dropoff: ${dropoffAddress}</p>`;
      if (isDropoffAirport) {
        html += `<p><em>Dropoff is at an airport</em></p><p>Type: ${dropoffType || "N/A"}</p><p>Notes: ${
          dropoffNotes || "None"
        }</p>`;
      }
    }
    html += `<hr><h3>Quote Info</h3><p>Price: ${quotePrice}</p>`;
    if (quoteDistance) html += `<p>Est. Distance: ${quoteDistance}</p>`;
    if (quoteDuration) html += `<p>Est. Duration: ${quoteDuration}</p>`;
    html += `<hr><p>Please follow up with the passenger ASAP.</p>`;

    const email = new Brevo.SendSmtpEmail();
    email.sender = { email: FROM_EMAIL, name: SENDER_NAME };
    email.to = [{ email: TO_EMAIL }];
    email.subject = subject;
    email.htmlContent = html;

    if (passengerEmail && passengerEmail !== "N/A" && emailRegex.test(passengerEmail)) {
      email.replyTo = { email: passengerEmail, name: passengerName !== "N/A" ? passengerName : undefined };
    }

    try {
      const result = await apiInstance.sendTransacEmail(email);
      console.log(`Request ID: ${requestId}, Booking email sent successfully:`, result.messageId || result);
      return {
        statusCode: 200,
        headers: JSON_HEADER,
        body: JSON.stringify({ message: "Booking request sent via email successfully" }),
      };
    } catch (error) {
      console.error(`Request ID: ${requestId}, Error sending booking email:`, error);
      return {
        statusCode: 500,
        headers: JSON_HEADER,
        body: JSON.stringify({ message: "Failed to send booking email" }),
      };
    }
  }

  return {
    statusCode: 400,
    headers: JSON_HEADER,
    body: JSON.stringify({ message: "Unknown action requested" }),
  };
};