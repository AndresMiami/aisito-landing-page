// filepath: c:\I love miami Project\AI concierge\config\environment.js
/**
 * environment.js - Configuration settings for the Miami AI Concierge application
 * 
 * This module manages environment-specific configurations and settings,
 * allowing for easy adjustments based on the deployment context (development, production, etc.).
 */

const ENVIRONMENT = {
    API_URL: process.env.API_URL || 'http://localhost:3000/api',
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
    BACKEND_MAPS_API_KEY: process.env.BACKEND_MAPS_API_KEY || '',
    DEBUG_MODE: process.env.DEBUG_MODE === 'true',
};

export default ENVIRONMENT;