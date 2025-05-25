/**
 * EventDefinitions.js - Centralized Event Definitions for Miami AI Concierge
 * 
 * This file serves as the single source of truth for all events in the Miami
 * Concierge application. It defines event names, payload structures, and helper
 * functions to ensure consistency across the entire EventBus system.
 */

// Main Event Categories
export const EVENTS = {
  // 🚨 Error Events
  ERROR: {
    SHOW: 'error:show',
    CLEAR: 'error:clear',
    CLEAR_ALL: 'error:clear-all',
    GLOBAL: 'error:global',
    GLOBAL_CLEAR: 'error:global-clear',
    SHOWN_CONFIRMED: 'error:shown:confirmed',
    CLEARED_CONFIRMED: 'error:cleared:confirmed',
    COMPONENT_ERROR: 'error:component'
  },

  // 📝 Form Events
  FORM: {
    SUBMIT: 'form:submit',
    SUBMISSION_STARTED: 'form:submission:started',
    SUBMISSION_SUCCEEDED: 'form:submission:succeeded',
    SUBMISSION_FAILED: 'form:submission:failed',
    FIELD_CHANGED: 'form:field:changed',
    FIELD_VALIDATED: 'form:field:validated',
    FIELD_VALIDATION_SUCCESS: 'form:field:validation-success',
    FIELD_VALIDATION_FAILURE: 'form:field:validation-failure',
    VALIDATION_REQUESTED: 'form:validation-requested',
    VALIDATION_CHANGED: 'form:validation-changed',
    VALIDATED: 'form:validated',
    LOADING_STARTED: 'form:loading:started',
    LOADING_ENDED: 'form:loading:ended',
    DATA_PROCESSED: 'form:data:processed'
  },

  // 🗺️ Map Events
  MAP: {
    AUTOCOMPLETE_INITIALIZED: 'map:autocomplete:initialized',
    PLACES_SUGGESTIONS: 'map:places:suggestions',
    LOCATION_SELECTED: 'map:location:selected',
    CURRENT_LOCATION_REQUESTED: 'map:current-location:requested',
    CURRENT_LOCATION_SUCCESS: 'map:current-location:success',
    CURRENT_LOCATION_FAILED: 'map:current-location:failed',
    GEOCODING_STARTED: 'map:geocoding:started',
    GEOCODING_COMPLETED: 'map:geocoding:completed'
  },

  // 📊 Analytics Events
  ANALYTICS: {
    TRACK: 'analytics:track',
    PAGE_VIEW: 'analytics:page-view',
    FORM_SUBMITTED: 'analytics:form-submitted',
    LOCATION_SELECTED: 'analytics:location-selected',
    ERROR_TRACKED: 'analytics:error-tracked',
    USER_INTERACTION: 'analytics:user-interaction'
  },

  // 🎯 Location Events
  LOCATION: {
    VALIDATION_REQUIRED: 'location:validation-required',
    VALIDATION_SUCCESS: 'location:validation-success',
    VALIDATION_FAILURE: 'location:validation-failure',
    AUTOCOMPLETE_SEARCH: 'location:autocomplete:search',
    FIELD_UPDATED: 'location:field:updated'
  },

  // 🎛️ UI Events
  UI: {
    LOADING_SHOW: 'ui:loading:show',
    LOADING_HIDE: 'ui:loading:hide',
    MODAL_OPEN: 'ui:modal:open',
    MODAL_CLOSE: 'ui:modal:close',
    TAB_CHANGED: 'ui:tab:changed',
    FIELD_STYLED: 'ui:field:styled',
    ERROR_SHOWN: 'ui:error:shown',
    EXPERIENCE_UPDATED: 'ui:experience:updated',
    EXPERIENCE_SELECTED: 'ui:experience:selected',
    EXPERIENCE_RESET: 'ui:experience:reset'
  },

  // ⚙️ System Events
  SYSTEM: {
    INITIALIZED: 'system:initialized',
    READY: 'system:ready',
    COMPONENT_REGISTERED: 'system:component:registered',
    COMPONENT_INITIALIZED: 'system:component:initialized',
    COMPONENT_DESTROYED: 'system:component:destroyed',
    COMPONENT_RECOVERED: 'system:component:recovered',
    COMPONENTS_INITIALIZED: 'system:components:initialized',
    COMPONENTS_DESTROYED: 'system:components:destroyed',
    ERROR: 'system:error',
    DEBUG_ENABLED: 'system:debug:enabled',
    DEBUG_DISABLED: 'system:debug:disabled'
  }
};

// Error Severity Levels
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Form Field Types
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  LOCATION: 'location',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
  RADIO: 'radio'
};

// Miami-specific Service Types
export const SERVICE_TYPES = {
  ONE_WAY: 'one-way',
  ROUND_TRIP: 'round-trip',
  MULTI_STOP: 'multi-stop',
  HOURLY: 'hourly',
  AIRPORT_TRANSFER: 'airport-transfer'
};

// Payload Creation Helpers
export const createFieldError = (fieldId, message, severity = ERROR_SEVERITY.ERROR) => ({
  fieldId,
  message,
  severity,
  timestamp: Date.now(),
  source: 'miami-concierge'
});

export const createGlobalError = (message, severity = ERROR_SEVERITY.ERROR) => ({
  message,
  severity,
  timestamp: Date.now(),
  source: 'miami-concierge',
  global: true
});

export const createFormPayload = (data, eventType = 'form-action') => ({
  ...data,
  timestamp: Date.now(),
  source: 'miami-concierge',
  eventType
});

export const createLocationPayload = (locationData) => ({
  ...locationData,
  timestamp: Date.now(),
  source: 'miami-concierge',
  coordinates: locationData.coordinates || null,
  placeId: locationData.placeId || null,
  address: locationData.address || ''
});

export const createAnalyticsPayload = (event, properties = {}) => ({
  event,
  properties: {
    ...properties,
    timestamp: Date.now(),
    source: 'miami-concierge',
    url: window.location.href,
    userAgent: navigator.userAgent
  }
});

// Field Validation Helpers
export const createFieldChangePayload = (fieldId, value, fieldType = FIELD_TYPES.TEXT) => ({
  fieldId,
  value,
  fieldType,
  timestamp: Date.now(),
  source: 'miami-concierge'
});

export const createValidationPayload = (fieldId, isValid, errors = [], value = null) => ({
  fieldId,
  isValid,
  errors,
  value,
  timestamp: Date.now(),
  source: 'miami-concierge'
});

// Miami-specific Payload Helpers
export const createMiamiServicePayload = (serviceType, fromLocation, toLocation, additionalData = {}) => ({
  serviceType,
  fromLocation,
  toLocation,
  ...additionalData,
  timestamp: Date.now(),
  source: 'miami-concierge',
  city: 'Miami'
});

// Event Categories for Organization
export const EVENT_CATEGORIES = {
  ERROR: 'error',
  FORM: 'form',
  MAP: 'map',
  ANALYTICS: 'analytics',
  LOCATION: 'location',
  UI: 'ui',
  SYSTEM: 'system'
};

// Debug and Development Helpers
export const getAllEvents = () => {
  const allEvents = [];
  Object.values(EVENTS).forEach(category => {
    Object.values(category).forEach(event => {
      allEvents.push(event);
    });
  });
  return allEvents.sort();
};

export const getEventsByCategory = (category) => {
  return Object.values(EVENTS[category.toUpperCase()] || {});
};

export const validateEventName = (eventName) => {
  const allEvents = getAllEvents();
  return allEvents.includes(eventName);
};

// Export everything for easy importing
export default {
  EVENTS,
  ERROR_SEVERITY,
  FIELD_TYPES,
  SERVICE_TYPES,
  EVENT_CATEGORIES,
  createFieldError,
  createGlobalError,
  createFormPayload,
  createLocationPayload,
  createAnalyticsPayload,
  createFieldChangePayload,
  createValidationPayload,
  createMiamiServicePayload,
  getAllEvents,
  getEventsByCategory,
  validateEventName
};