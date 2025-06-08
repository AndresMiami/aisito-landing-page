/**
 * LocationService Initialization for Miami AI Concierge
 * This file initializes and configures the LocationService for use throughout the application
 */

import LocationService from '../core/LocationService.js';

// Global configuration object for Miami AI Concierge
const CONFIG = {
    GOOGLE_MAPS: {
        API_KEY: 'AIzaSyAd_O4s_73E_A8rq7TGCHKVEBFHzNecAHM', // Fallback/default API key
        BIAS_LOCATION: {
            lat: 25.7617,  // Miami coordinates
            lng: -80.1918
        }
    }
};

// Initialize the LocationService with Miami-specific configuration
const locationService = new LocationService({
    apiKey: CONFIG.GOOGLE_MAPS.API_KEY,
    biasLocation: CONFIG.GOOGLE_MAPS.BIAS_LOCATION,
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    language: 'en',
    region: 'us'
});

// Make the service available globally with initialization flag
window.miamiLocationService = locationService;
window.miamiLocationService.isInitialized = false;

/**
 * Initialize the service when DOM is ready with improved error handling and retries
 * This ensures LocationService is available before other components try to use it
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🔄 Initializing Miami Location Service...');
        
        // Check if Google Maps API is available
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.warn('⚠️ Google Maps API not yet loaded, waiting...');
            
            // Wait for Google Maps to load (max 10 seconds)
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (++attempts >= 50) { // ~5 seconds (100ms * 50)
                        clearInterval(checkInterval);
                        reject(new Error('Google Maps API failed to load after timeout'));
                    }
                }, 100);
            });
        }
        
        await locationService.initialize();
        window.miamiLocationService.isInitialized = true;
        
        // Dispatch event to notify components that LocationService is ready
        window.dispatchEvent(new CustomEvent('locationServiceReady', {
            detail: { service: locationService }
        }));
        
        console.log('✅ Miami Location Service initialized successfully');
        
        // Emit initialization event if event bus is available
        if (window.eventBus) {
            window.eventBus.emit('LOCATION_SERVICE_READY', {
                timestamp: Date.now(),
                metrics: locationService.getMetrics()
            });
        }
          } catch (error) {
        console.error('❌ Failed to initialize Miami Location Service:', error);
        
        // Dispatch error event so components can handle it gracefully
        window.dispatchEvent(new CustomEvent('locationServiceError', {
            detail: { error: error }
        }));
        
        // Set initialization status to handle errors
        window.miamiLocationService.initializationError = error;
    }
});

/**
 * Helper function to wait for LocationService initialization
 * @param {number} timeoutMs - Maximum time to wait in milliseconds
 * @returns {Promise<LocationService>} - Resolved with the service instance
 */
window.waitForLocationService = async function(timeoutMs = 10000) {
    // If already initialized, return immediately
    if (window.miamiLocationService && window.miamiLocationService.isInitialized) {
        return window.miamiLocationService;
    }
    
    // Otherwise wait for initialization with timeout
    return new Promise((resolve, reject) => {
        // Set timeout
        const timeout = setTimeout(() => {
            reject(new Error('LocationService not available after timeout'));
        }, timeoutMs);
        
        // Listen for ready event
        window.addEventListener('locationServiceReady', function handler(event) {
            clearTimeout(timeout);
            window.removeEventListener('locationServiceReady', handler);
            resolve(event.detail.service);
        }, { once: true });
        
        // Listen for error event
        window.addEventListener('locationServiceError', function handler(event) {
            clearTimeout(timeout);
            window.removeEventListener('locationServiceError', handler);
            reject(event.detail.error);
        }, { once: true });
    });
};

// Export for module usage
export default locationService;