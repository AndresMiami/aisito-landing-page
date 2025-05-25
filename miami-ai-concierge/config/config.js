// config.js - Configuration settings for the Miami AI Concierge application

const config = {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    backendMapsApiKey: process.env.BACKEND_MAPS_API_KEY || '',
    apiBaseUrl: 'https://api.miamiconcierge.com',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es'],
    debugMode: process.env.DEBUG_MODE === 'true',
};

export default config;