// filepath: api-service/src/config/endpoints.js

const API_ENDPOINTS = {
  BASE_URL: 'https://api.miami-ai-concierge.com',
  BOOKINGS: {
    CREATE: '/bookings/create',
    RETRIEVE: '/bookings/:id',
    UPDATE: '/bookings/:id/update',
    CANCEL: '/bookings/:id/cancel',
    LIST: '/bookings',
  },
  VEHICLES: {
    LIST: '/vehicles',
    DETAILS: '/vehicles/:id',
  },
  LOCATIONS: {
    VALIDATE: '/locations/validate',
    DETAILS: '/locations/:id',
  },
  ANALYTICS: {
    TRACK_EVENT: '/analytics/track',
  },
};

export default API_ENDPOINTS;