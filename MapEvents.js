/**
 * MapEvents.js - Standardized map event definitions
 * 
 * This file defines all map-related events and their payload structures
 * for use with the EventBus system.
 */

// Define all map event types with namespaced format
export const MAP_EVENTS = {
  // Core map events
  MAP_READY: 'map:ready',
  MAP_LOAD_FAILED: 'map:load-failed',
  MAP_INITIALIZED: 'map:initialized',
  MAP_CLICKED: 'map:clicked',
  MAP_ZOOMED: 'map:zoomed',
  
  // Location selection events
  LOCATION_SELECTED: 'map:location:selected',
  LOCATION_CHANGED: 'map:location:changed',
  LOCATION_CLEARED: 'map:location:cleared',
  LOCATION_INVALID: 'map:location:invalid',
  LOCATION_VALIDATION_REQUIRED: 'map:location:validation-required',
  
  // Geocoding events
  GEOCODE_REQUESTED: 'map:geocode:requested',
  GEOCODE_SUCCEEDED: 'map:geocode:succeeded',
  GEOCODE_FAILED: 'map:geocode:failed',
  REVERSE_GEOCODE_REQUESTED: 'map:reverse-geocode:requested',
  REVERSE_GEOCODE_SUCCEEDED: 'map:reverse-geocode:succeeded',
  REVERSE_GEOCODE_FAILED: 'map:reverse-geocode:failed',
  
  // User location events
  USER_LOCATION_REQUESTED: 'map:user-location:requested',
  USER_LOCATION_SUCCEEDED: 'map:user-location:succeeded',
  USER_LOCATION_FAILED: 'map:user-location:failed',
  USER_LOCATION_NOT_SUPPORTED: 'map:user-location:not-supported',
  
  // Autocomplete events
  AUTOCOMPLETE_INITIALIZED: 'map:autocomplete:initialized',
  AUTOCOMPLETE_SUGGESTION_SELECTED: 'map:autocomplete:suggestion-selected',
  AUTOCOMPLETE_INPUT_CHANGED: 'map:autocomplete:input-changed',
  AUTOCOMPLETE_PLACE_CHANGED: 'map:autocomplete:place-changed'
};

// Define event payload structures for validation
export const MAP_EVENT_SCHEMAS = {
  [MAP_EVENTS.LOCATION_SELECTED]: {
    placeId: 'string',
    address: 'string', 
    coordinates: 'object',
    fieldId: 'string',
    source: 'string',
    timestamp: 'number'
  },
  
  [MAP_EVENTS.GEOCODE_SUCCEEDED]: {
    address: 'string',
    coordinates: 'object',
    results: 'array',
    source: 'string',
    timestamp: 'number'
  },
  
  [MAP_EVENTS.USER_LOCATION_SUCCEEDED]: {
    coordinates: 'object',
    accuracy: 'number',
    source: 'string',
    timestamp: 'number'
  }
};

/**
 * Create a standardized location object
 * @param {string} placeId - Google Maps place ID
 * @param {string} address - Formatted address
 * @param {Object} coordinates - Lat/lng coordinates
 * @param {string} fieldId - ID of the form field
 * @param {string} source - Component that generated the event
 * @returns {Object} Formatted location object
 */
export function createLocationObject(placeId, address, coordinates, fieldId, source = 'maps') {
  return {
    placeId,
    address,
    coordinates: {
      lat: coordinates.lat,
      lng: coordinates.lng
    },
    fieldId,
    source,
    timestamp: Date.now(),
    isValid: !!(placeId && address && coordinates.lat && coordinates.lng)
  };
}

/**
 * Create a standardized coordinates object
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Formatted coordinates object
 */
export function createCoordinatesObject(lat, lng) {
  return {
    lat: parseFloat(lat),
    lng: parseFloat(lng)
  };
}

/**
 * Create a standardized error object for map events
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {string} source - Source of the error
 * @returns {Object} Formatted error object
 */
export function createMapError(message, code, source = 'maps') {
  return {
    message,
    code,
    source,
    timestamp: Date.now()
  };
}

/**
 * Validate event payload against schema
 * @param {string} eventName - Name of the event
 * @param {Object} payload - Event payload to validate
 * @returns {boolean} Whether payload is valid
 */
export function validateEventPayload(eventName, payload) {
  const schema = MAP_EVENT_SCHEMAS[eventName];
  if (!schema) return true; // No validation for undefined schemas
  
  for (const [key, expectedType] of Object.entries(schema)) {
    if (!(key in payload)) {
      console.warn(`MapEvents: Missing required field '${key}' in ${eventName}`);
      return false;
    }
    
    const actualType = typeof payload[key];
    if (expectedType === 'array' && !Array.isArray(payload[key])) {
      console.warn(`MapEvents: Field '${key}' should be array in ${eventName}`);
      return false;
    } else if (expectedType !== 'array' && actualType !== expectedType) {
      console.warn(`MapEvents: Field '${key}' should be ${expectedType}, got ${actualType} in ${eventName}`);
      return false;
    }
  }
  
  return true;
}

export default {
  MAP_EVENTS,
  MAP_EVENT_SCHEMAS,
  createLocationObject,
  createCoordinatesObject,
  createMapError,
  validateEventPayload
};