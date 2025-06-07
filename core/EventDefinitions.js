/**
 * EventDefinitions.js - Domain-Organized Event Definitions for Miami AI Concierge
 */

export const EVENTS = {
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
    VALIDATION_CHANGED: 'form:validation:changed',
    VALIDATED: 'form:validated',
    LOADING_STARTED: 'form:loading:started',
    LOADING_ENDED: 'form:loading:ended',
    DATA_PROCESSED: 'form:data:processed',
    RESET: 'form:reset',
    VALIDATION_STARTED: 'form:validation:started',
    VALIDATION_COMPLETED: 'form:validation:completed',
    TRIP_CALCULATION_STARTED: 'form:trip:calculation:started',
    TRIP_CALCULATION_COMPLETED: 'form:trip:calculation:completed',
    TRIP_CALCULATION_FAILED: 'form:trip:calculation:failed',
    CONTINUE_BUTTON_UPDATED: 'form:continue:button:updated'
  },
  BOOKING: {
    REQUESTED: 'booking:requested',
    INITIATED: 'booking:initiated',
    CONFIRMED: 'booking:confirmed',
    CANCELED: 'booking:canceled',
    UPDATED: 'booking:updated',
    COMPLETED: 'booking:completed',
    DETAILS_LOADED: 'booking:details:loaded',
    PREFERENCES_SET: 'booking:preferences:set',
    SPECIAL_REQUESTS_ADDED: 'booking:special-requests:added',
    PRICE_CALCULATED: 'booking:price:calculated',
    AVAILABILITY_CHECKED: 'booking:availability:checked',
    AVAILABILITY_CONFIRMED: 'booking:availability:confirmed',
    EXPERIENCE_SELECTED: 'booking:experience:selected',
    EXPERIENCE_CONFIGURED: 'booking:experience:configured',
    TRIP_SUMMARY_READY: 'booking:trip_summary_ready',
    ROUTE_CALCULATED: 'booking:route:calculated',
    PRICING_UPDATED: 'booking:pricing:updated'
  },
  VEHICLE: {
    SELECTED: 'vehicle:selected',
    DESELECTED: 'vehicle:deselected',
    OPTIONS_LOADED: 'vehicle:options:loaded',
    AVAILABILITY_CHECKED: 'vehicle:availability:checked',
    PRICE_CALCULATED: 'vehicle:price:calculated',
    CAPACITY_VALIDATED: 'vehicle:capacity:validated',
    FEATURES_DISPLAYED: 'vehicle:features:displayed',
    TYPE_CHANGED: 'vehicle:type:changed'
  },
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
  ANALYTICS: {
    TRACK: 'analytics:track',
    PAGE_VIEW: 'analytics:page-view',
    FORM_SUBMITTED: 'analytics:form-submitted',
    LOCATION_SELECTED: 'analytics:location-selected',
    ERROR_TRACKED: 'analytics:error-tracked',
    USER_INTERACTION: 'analytics:user-interaction'
  },
  LOCATION: {
    VALIDATION_REQUIRED: 'location:validation-required',
    VALIDATION_SUCCESS: 'location:validation-success',
    VALIDATION_FAILURE: 'location:validation-failure',
    AUTOCOMPLETE_SEARCH: 'location:autocomplete:search',
    FIELD_UPDATED: 'location:field:updated',
    SELECTED: 'location:selected',
    CHANGED: 'location:changed',
    CLEARED: 'location:cleared',
    INVALID: 'location:invalid'
  },
  UI: {
    LOADING_SHOW: 'ui:loading:show',
    LOADING_HIDE: 'ui:loading:hide',
    MODAL_OPEN: 'ui:modal:open',
    MODAL_CLOSE: 'ui:modal:close',
    TAB_CHANGED: 'ui:tab:changed',
    FIELD_STYLED: 'ui:field:styled',
    ERROR_SHOWN: 'ui:error:shown'
  },
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
  },
  YACHT: {
    TAB_ACTIVATED: 'yacht:tab_activated',
    DATE_SELECTED: 'yacht:date_selected',
    GUEST_UPDATED: 'yacht:guest_updated',
    DATE_MODAL_OPENED: 'yacht:date_modal_opened',
    GUEST_MODAL_OPENED: 'yacht:guest_modal_opened',
    SEARCH: 'yacht:search'
  },
  VALIDATION: {
    LOCATION_VALIDATED: 'validation:location:validated',
    VEHICLE_VALIDATED: 'validation:vehicle:validated',
    TIMING_VALIDATED: 'validation:timing:validated',
    FORM_STATE_CHANGED: 'validation:form:state:changed',
    CONTINUE_ENABLED: 'validation:continue:enabled',
    CONTINUE_DISABLED: 'validation:continue:disabled'
  }
};

// Payload creators
export const createFormPayload = (fieldId, value, formData = {}) => ({
  fieldId,
  value,
  formData,
  timestamp: Date.now(),
  source: 'form-domain'
});

export const createLocationPayload = (locationData) => ({
  address: locationData.address,
  coordinates: locationData.coordinates || null,
  placeId: locationData.placeId || null,
  fieldId: locationData.fieldId,
  locationType: locationData.locationType || 'generic',
  ...locationData,
  timestamp: Date.now(),
  source: 'location-domain'
});

export const createFieldError = (fieldId, message, severity = 'error') => ({
  fieldId,
  message,
  severity,
  timestamp: Date.now(),
  source: 'miami-concierge'
});

export const createAnalyticsPayload = (event, properties = {}) => ({
  event,
  properties: {
    ...properties,
    timestamp: Date.now(),
    source: 'analytics-domain',
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  }
});

export const createValidationPayload = (fieldId, isValid, data = null, errors = []) => ({
  fieldId,
  isValid,
  data,
  errors,
  timestamp: Date.now(),
  source: 'form-validation'
});

export const createTripDataPayload = (distance, duration, pricing, route) => ({
  distance,
  duration,
  pricing,
  route,
  timestamp: Date.now(),
  source: 'trip-calculation'
});

// ONLY ONE DECLARATION OF EACH - Individual domain exports
export const FORM_EVENTS = EVENTS.FORM;
export const BOOKING_EVENTS = EVENTS.BOOKING;
export const VEHICLE_EVENTS = EVENTS.VEHICLE;
export const LOCATION_EVENTS = EVENTS.LOCATION;
export const MAP_EVENTS = EVENTS.MAP;
export const ERROR_EVENTS = EVENTS.ERROR;
export const UI_EVENTS = EVENTS.UI;
export const ANALYTICS_EVENTS = EVENTS.ANALYTICS;
export const SYSTEM_EVENTS = EVENTS.SYSTEM;
export const YACHT_EVENTS = EVENTS.YACHT;
export const VALIDATION_EVENTS = EVENTS.VALIDATION;

// Utility functions
export const getAllEvents = () => {
  const allEvents = [];
  Object.values(EVENTS).forEach(domain => {
    Object.values(domain).forEach(event => {
      allEvents.push(event);
    });
  });
  return allEvents.sort();
};

export const getEventsByCategory = (category) => {
  const categoryUpper = category.toUpperCase();
  return Object.values(EVENTS[categoryUpper] || {});
};

export const validateEventName = (eventName) => {
  return getAllEvents().includes(eventName);
};

// Default export
export default {
  EVENTS,
  FORM_EVENTS,
  BOOKING_EVENTS,
  VEHICLE_EVENTS,
  LOCATION_EVENTS,
  MAP_EVENTS,
  ERROR_EVENTS,
  UI_EVENTS,
  ANALYTICS_EVENTS,
  SYSTEM_EVENTS,
  YACHT_EVENTS,
  VALIDATION_EVENTS,
  createFormPayload,
  createLocationPayload,
  createFieldError,
  createAnalyticsPayload,
  createValidationPayload,
  createTripDataPayload,
  getAllEvents,
  getEventsByCategory,
  validateEventName
};

console.log('🎯 Domain-organized EventDefinitions loaded');