/**
 * Maps integration module for the Miami AI Concierge
 * Contains Google Maps functionality, geocoding, and place autocomplete
 */

// Global variables
let autocomplete;
let map;
let marker;

/**
 * Initialize Google Places Autocomplete on address input fields
 */
export function initAutocomplete() {
  console.log("🗺️ Initializing Google Places Autocomplete");
  
  const addressInput = document.getElementById('pickupLocation');
  if (!addressInput) {
    console.error("Could not find pickupLocation input element");
    return;
  }

  // Initialize Google Maps Places Autocomplete
  autocomplete = new google.maps.places.Autocomplete(addressInput, {
    types: ['address'],
    componentRestrictions: { country: 'us' }, // Restrict to US addresses
    fields: ['address_components', 'geometry', 'name']
  });

  // Listen for place selection
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      console.warn("No geometry information for this place");
      return;
    }
    
    // Update form with place data if needed
    console.log('Selected place:', place);
    
    // Clear any existing errors
    if (window.clearError) {
      window.clearError('pickupLocation');
    }
  });
}

/**
 * Get the user's current location using Geolocation API
 * @returns {Promise<{lat: number, lng: number}>} Promise resolving to coordinates
 */
export function getCurrentLocation() {
  console.log("🔍 Getting current user location");
  
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log("📍 Got current location:", coords);
        resolve(coords);
      },
      (error) => {
        console.error("❌ Geolocation error:", error.message);
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

/**
 * Convert an address to coordinates using Google Maps Geocoding API
 * @param {string} address The address to geocode
 * @returns {Promise<{lat: number, lng: number}>} Promise resolving to coordinates
 */
export function geocodeAddress(address) {
  console.log(`🗺️ Geocoding address: ${address}`);
  
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API not loaded'));
      return;
    }
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        };
        console.log(`✅ Address geocoded:`, location);
        resolve(location);
      } else {
        console.error(`❌ Geocoding failed: ${status}`);
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

// Export default for convenience
export default {
  initAutocomplete,
  getCurrentLocation,
  geocodeAddress
};

console.log("🗺️ Maps module loaded successfully");