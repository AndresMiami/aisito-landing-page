import EventBus from '../../core/EventBus.js';
import DOMManager from '../../core/DOMManager.js';
import EventDefinitions from '../../core/EventDefinitions.js';

/**
 * googleMapsAPI.js - Integration with Google Maps API for location services
 * 
 * This module provides functions to interact with the Google Maps API,
 * including geocoding, place searches, and location retrieval.
 */

/**
 * Initialize Google Maps API with the provided API key.
 * @param {string} apiKey - The Google Maps API key.
 */
export function initializeGoogleMaps(apiKey) {
    if (!apiKey) {
        console.error('Google Maps API key is required.');
        return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
        EventBus.emit(EventDefinitions.EVENTS.MAP.AUTOCOMPLETE_INITIALIZED, {
            message: 'Google Maps API loaded successfully.'
        });
    };

    script.onerror = () => {
        EventBus.emit(EventDefinitions.EVENTS.MAP.AUTOCOMPLETE_INITIALIZED, {
            message: 'Failed to load Google Maps API.',
            error: true
        });
    };
}

/**
 * Geocode an address using the Google Maps Geocoding service.
 * @param {string} address - The address to geocode.
 * @returns {Promise<Object>} - A promise that resolves to the geocoded location.
 */
export function geocodeAddress(address) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK') {
                resolve(results[0]);
            } else {
                reject(`Geocode was not successful for the following reason: ${status}`);
            }
        });
    });
}

/**
 * Get place details using the Google Maps Places service.
 * @param {string} placeId - The ID of the place to retrieve details for.
 * @returns {Promise<Object>} - A promise that resolves to the place details.
 */
export function getPlaceDetails(placeId) {
    return new Promise((resolve, reject) => {
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        service.getDetails({ placeId }, (place, status) => {
            if (status === 'OK') {
                resolve(place);
            } else {
                reject(`Place details request failed due to: ${status}`);
            }
        });
    });
}