// filepath: api-service/src/config/environment.js
export const ENVIRONMENT = {
  API_BASE_URL: process.env.API_BASE_URL || 'https://api.example.com',
  TIMEOUT: process.env.REQUEST_TIMEOUT || 5000,
  FEATURE_FLAGS: {
    ENABLE_BOOKING: true,
    ENABLE_VEHICLE_TRACKING: true,
    ENABLE_ANALYTICS: false,
  },
};