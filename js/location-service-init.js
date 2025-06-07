/**
 * LocationService Initialization for Miami AI Concierge
 * This file initializes and configures the LocationService for use throughout the application
 */

import LocationService from '../core/LocationService.js';

// Initialize the LocationService with Miami-specific configuration
const locationService = new LocationService({
    apiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAd_O4s_73E_A8rq7TGCHKVEBFHzNecAHM',
    biasLocation: {
        lat: 25.7617,  // Miami coordinates
        lng: -80.1918
    },
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    language: 'en',
    region: 'us'
});

// Make the service available globally
window.miamiLocationService = locationService;

// Initialize the service when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🔄 Initializing Miami Location Service...');
        
        await locationService.initialize();
        
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
    }
});

// Export for module usage
export default locationService;