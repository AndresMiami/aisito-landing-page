// config.js - Application configuration settings for Miami Concierge

const config = {
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.miamiconcierge.com',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    backendMapsApiKey: process.env.BACKEND_MAPS_API_KEY || '',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es'],
    debugMode: process.env.DEBUG_MODE === 'true',
    analyticsEnabled: true,
};

export default config;