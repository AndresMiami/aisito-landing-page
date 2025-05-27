import { BOOKING_EVENTS, FORM_EVENTS } from './core/EventDefinitions.js';

/**
 * EventDefinitions.js - Domain-Organized Event Definitions for Miami AI Concierge
 * 
 * This file serves as the single source of truth for all events in the Miami
 * Concierge application, organized by business domain to prepare for potential
 * future microservices while maintaining current architecture compatibility.
 */

// Domain-organized Event Categories
export const EVENTS = {
  // 📝 Form Domain - All form-related interactions
  FORM: {
    // Field-level events
    FIELD_CHANGED: 'form:field:changed',
    FIELD_VALIDATED: 'form:field:validated',
    FIELD_VALIDATION_SUCCESS: 'form:field:validation-success',
    FIELD_VALIDATION_FAILURE: 'form:field:validation-failure',
    FIELD_FOCUSED: 'form:field:focused',
    FIELD_BLURRED: 'form:field:blurred',
    
    // Form-level events
    SUBMIT: 'form:submit',
    SUBMISSION_STARTED: 'form:submission:started',
    SUBMISSION_SUCCEEDED: 'form:submission:succeeded',
    SUBMISSION_FAILED: 'form:submission:failed',
    VALIDATED: 'form:validated',
    VALIDATION_REQUESTED: 'form:validation-requested',
    VALIDATION_CHANGED: 'form:validation-changed',
    RESET: 'form:reset',
    LOADING_STARTED: 'form:loading:started',
    LOADING_ENDED: 'form:loading:ended',
    DATA_PROCESSED: 'form:data:processed',
    READY_TO_SUBMIT: 'form:ready-to-submit',
    NOT_READY_TO_SUBMIT: 'form:not-ready-to-submit'
  },

  // 🚗 Booking Domain - Transportation booking lifecycle
  BOOKING: {
    // Booking lifecycle
    REQUESTED: 'booking:requested',
    INITIATED: 'booking:initiated',
    CONFIRMED: 'booking:confirmed',
    CANCELED: 'booking:canceled',
    UPDATED: 'booking:updated',
    COMPLETED: 'booking:completed',
    
    // Booking details
    DETAILS_LOADED: 'booking:details:loaded',
    PREFERENCES_SET: 'booking:preferences:set',
    SPECIAL_REQUESTS_ADDED: 'booking:special-requests:added',
    
    // Pricing and availability
    PRICE_CALCULATED: 'booking:price:calculated',
    AVAILABILITY_CHECKED: 'booking:availability:checked',
    AVAILABILITY_CONFIRMED: 'booking:availability:confirmed',
    
    // Experience-specific
    EXPERIENCE_SELECTED: 'booking:experience:selected',
    EXPERIENCE_CONFIGURED: 'booking:experience:configured'
  },

  // 🚙 Vehicle Domain - Vehicle selection and management
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

  // 📍 Location Domain - Maps, geocoding, and location services
  LOCATION: {
    // Selection events
    SELECTED: 'location:selected',
    CHANGED: 'location:changed',
    CLEARED: 'location:cleared',
    INVALID: 'location:invalid',
    
    // Validation events
    VALIDATION_REQUIRED: 'location:validation-required',
    VALIDATION_SUCCESS: 'location:validation-success',
    VALIDATION_FAILURE: 'location:validation-failure',
    
    // Autocomplete events
    AUTOCOMPLETE_SEARCH: 'location:autocomplete:search',
    AUTOCOMPLETE_SELECTED: 'location:autocomplete:selected',
    
    // Current location events
    CURRENT_REQUESTED: 'location:current:requested',
    CURRENT_DETECTED: 'location:current:detected',
    CURRENT_FAILED: 'location:current:failed',
    
    // Geocoding events
    GEOCODED: 'location:geocoded',
    GEOCODING_FAILED: 'location:geocoding:failed',
    
    // Route and distance
    ROUTE_CALCULATED: 'location:route:calculated',
    DISTANCE_CALCULATED: 'location:distance:calculated',
    
    // Field updates
    FIELD_UPDATED: 'location:field:updated'
  },

  // 💰 Payment Domain - Payment processing and billing
  PAYMENT: {
    INITIATED: 'payment:initiated',
    PROCESSING: 'payment:processing',
    COMPLETED: 'payment:completed',
    FAILED: 'payment:failed',
    CANCELED: 'payment:canceled',
    REFUNDED: 'payment:refunded',
    
    // Payment methods
    METHOD_SELECTED: 'payment:method:selected',
    METHOD_VALIDATED: 'payment:method:validated',
    
    // Pricing
    ESTIMATE_REQUESTED: 'payment:estimate:requested',
    ESTIMATE_CALCULATED: 'payment:estimate:calculated',
    FINAL_AMOUNT_CALCULATED: 'payment:final-amount:calculated'
  },

  // 👤 User Domain - User authentication and profile management
  USER: {
    // Authentication
    LOGIN_REQUESTED: 'user:login:requested',
    LOGGED_IN: 'user:logged:in',
    LOGIN_FAILED: 'user:login:failed',
    LOGGED_OUT: 'user:logged:out',
    
    // Profile management
    PROFILE_LOADED: 'user:profile:loaded',
    PROFILE_UPDATED: 'user:profile:updated',
    PREFERENCES_LOADED: 'user:preferences:loaded',
    PREFERENCES_CHANGED: 'user:preferences:changed',
    
    // Registration
    REGISTRATION_STARTED: 'user:registration:started',
    REGISTRATION_COMPLETED: 'user:registration:completed',
    REGISTRATION_FAILED: 'user:registration:failed'
  },

  // 🗺️ Map Domain - Google Maps integration
  MAP: {
    // Core map events
    READY: 'map:ready',
    LOAD_FAILED: 'map:load-failed',
    INITIALIZED: 'map:initialized',
    CLICKED: 'map:clicked',
    ZOOMED: 'map:zoomed',
    
    // Autocomplete events
    AUTOCOMPLETE_INITIALIZED: 'map:autocomplete:initialized',
    AUTOCOMPLETE_SUGGESTION_SELECTED: 'map:autocomplete:suggestion-selected',
    AUTOCOMPLETE_INPUT_CHANGED: 'map:autocomplete:input-changed',
    AUTOCOMPLETE_PLACE_CHANGED: 'map:autocomplete:place-changed',
    PLACES_SUGGESTIONS: 'map:places:suggestions',
    
    // Location events
    LOCATION_SELECTED: 'map:location:selected',
    CURRENT_LOCATION_REQUESTED: 'map:current-location:requested',
    CURRENT_LOCATION_SUCCESS: 'map:current-location:success',
    CURRENT_LOCATION_FAILED: 'map:current-location:failed',
    
    // Geocoding events
    GEOCODING_STARTED: 'map:geocoding:started',
    GEOCODING_COMPLETED: 'map:geocoding:completed'
  },

  // 🚨 Error Domain - Error handling and display
  ERROR: {
    // Error display
    SHOW: 'error:show',
    CLEAR: 'error:clear',
    CLEAR_ALL: 'error:clear-all',
    SHOWN_CONFIRMED: 'error:shown:confirmed',
    CLEARED_CONFIRMED: 'error:cleared:confirmed',
    
    // Global errors
    GLOBAL: 'error:global',
    GLOBAL_CLEAR: 'error:global-clear',
    
    // Error types
    VALIDATION: 'error:validation',
    API: 'error:api',
    SYSTEM: 'error:system',
    NETWORK: 'error:network',
    COMPONENT_ERROR: 'error:component'
  },

  // 🎛️ UI Domain - User interface interactions
  UI: {
    // Loading states
    LOADING_SHOW: 'ui:loading:show',
    LOADING_HIDE: 'ui:loading:hide',
    LOADING_STARTED: 'ui:loading:started',
    LOADING_FINISHED: 'ui:loading:finished',
    
    // Modal interactions
    MODAL_OPEN: 'ui:modal:open',
    MODAL_CLOSE: 'ui:modal:close',
    MODAL_OPENED: 'ui:modal:opened',
    MODAL_CLOSED: 'ui:modal:closed',
    
    // Tab navigation
    TAB_CHANGED: 'ui:tab:changed',
    TAB_ACTIVATED: 'ui:tab:activated',
    
    // Field styling
    FIELD_STYLED: 'ui:field:styled',
    ERROR_SHOWN: 'ui:error:shown',
    
    // Experience selector
    EXPERIENCE_UPDATED: 'ui:experience:updated',
    EXPERIENCE_SELECTED: 'ui:experience:selected',
    EXPERIENCE_RESET: 'ui:experience:reset'
  },

  // 📊 Analytics Domain - Tracking and monitoring
  ANALYTICS: {
    TRACK: 'analytics:track',
    PAGE_VIEW: 'analytics:page-view',
    FORM_SUBMITTED: 'analytics:form-submitted',
    LOCATION_SELECTED: 'analytics:location-selected',
    ERROR_TRACKED: 'analytics:error-tracked',
    USER_INTERACTION: 'analytics:user-interaction',
    BOOKING_FUNNEL_STEP: 'analytics:booking-funnel:step',
    CONVERSION_EVENT: 'analytics:conversion:event'
  },

  // ⚙️ System Domain - Application lifecycle and infrastructure
  SYSTEM: {
    INITIALIZED: 'system:initialized',
    READY: 'system:ready',
    SHUTDOWN: 'system:shutdown',
    
    // Component lifecycle
    COMPONENT_REGISTERED: 'system:component:registered',
    COMPONENT_INITIALIZED: 'system:component:initialized',
    COMPONENT_DESTROYED: 'system:component:destroyed',
    COMPONENT_RECOVERED: 'system:component:recovered',
    COMPONENTS_INITIALIZED: 'system:components:initialized',
    COMPONENTS_DESTROYED: 'system:components:destroyed',
    
    // System state
    ERROR: 'system:error',
    DEBUG_ENABLED: 'system:debug:enabled',
    DEBUG_DISABLED: 'system:debug:disabled',
    HEALTH_CHECK: 'system:health-check'
  }
};

// Domain-specific payload creators
export const createFormPayload = (fieldId, value, formData = {}) => ({
  fieldId,
  value,
  formData,
  timestamp: Date.now(),
  source: 'form-domain'
});

export const createBookingPayload = (bookingData) => ({
  bookingId: bookingData.bookingId || generateBookingId(),
  serviceType: bookingData.serviceType,
  pickupLocation: bookingData.pickupLocation,
  dropoffLocation: bookingData.dropoffLocation,
  vehicleType: bookingData.vehicleType,
  scheduledTime: bookingData.scheduledTime,
  passengerCount: bookingData.passengerCount,
  specialRequests: bookingData.specialRequests || [],
  ...bookingData,
  timestamp: Date.now(),
  source: 'booking-domain'
});

export const createVehiclePayload = (vehicleData) => ({
  vehicleType: vehicleData.vehicleType,
  capacity: vehicleData.capacity,
  features: vehicleData.features || [],
  pricing: vehicleData.pricing,
  availability: vehicleData.availability,
  ...vehicleData,
  timestamp: Date.now(),
  source: 'vehicle-domain'
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

export const createPaymentPayload = (paymentData) => ({
  amount: paymentData.amount,
  currency: paymentData.currency || 'USD',
  paymentMethod: paymentData.paymentMethod,
  bookingId: paymentData.bookingId,
  ...paymentData,
  timestamp: Date.now(),
  source: 'payment-domain'
});

export const createUserPayload = (userData) => ({
  userId: userData.userId,
  email: userData.email,
  profile: userData.profile || {},
  preferences: userData.preferences || {},
  ...userData,
  timestamp: Date.now(),
  source: 'user-domain'
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

// Export individual domains for selective imports
export const FORM_EVENTS = EVENTS.FORM;
export const BOOKING_EVENTS = EVENTS.BOOKING;
export const VEHICLE_EVENTS = EVENTS.VEHICLE;
export const LOCATION_EVENTS = EVENTS.LOCATION;
export const PAYMENT_EVENTS = EVENTS.PAYMENT;
export const USER_EVENTS = EVENTS.USER;
export const MAP_EVENTS = EVENTS.MAP;
export const ERROR_EVENTS = EVENTS.ERROR;
export const UI_EVENTS = EVENTS.UI;
export const ANALYTICS_EVENTS = EVENTS.ANALYTICS;
export const SYSTEM_EVENTS = EVENTS.SYSTEM;

// Backward compatibility - flatten all events for legacy code
export const FLAT_EVENTS = {};
Object.values(EVENTS).forEach(domain => {
  Object.assign(FLAT_EVENTS, domain);
});

// Legacy support - maintain original structure for existing imports
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

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

export const SERVICE_TYPES = {
  ONE_WAY: 'one-way',
  ROUND_TRIP: 'round-trip',
  MULTI_STOP: 'multi-stop',
  HOURLY: 'hourly',
  AIRPORT_TRANSFER: 'airport-transfer'
};

// Legacy payload creators (maintain backward compatibility)
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

export const createMiamiServicePayload = (serviceType, fromLocation, toLocation, additionalData = {}) => ({
  serviceType,
  fromLocation,
  toLocation,
  ...additionalData,
  timestamp: Date.now(),
  source: 'miami-concierge',
  city: 'Miami'
});

// Domain utilities
export const getDomainEvents = (domain) => {
  const domainUpper = domain.toUpperCase();
  return EVENTS[domainUpper] || {};
};

export const getEventDomain = (eventName) => {
  for (const [domain, events] of Object.entries(EVENTS)) {
    if (Object.values(events).includes(eventName)) {
      return domain.toLowerCase();
    }
  }
  return 'unknown';
};

export const isEventInDomain = (eventName, domain) => {
  const domainEvents = getDomainEvents(domain);
  return Object.values(domainEvents).includes(eventName);
};

// Event Categories for Organization (backward compatibility)
export const EVENT_CATEGORIES = {
  FORM: 'form',
  BOOKING: 'booking',
  VEHICLE: 'vehicle',
  LOCATION: 'location',
  PAYMENT: 'payment',
  USER: 'user',
  MAP: 'map',
  ERROR: 'error',
  UI: 'ui',
  ANALYTICS: 'analytics',
  SYSTEM: 'system'
};

// Helper functions (backward compatibility)
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
  const allEvents = getAllEvents();
  return allEvents.includes(eventName);
};

// Helper function for generating unique IDs
function generateBookingId() {
  return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Domain-specific event builders for complex scenarios
export const BookingEventBuilder = {
  requested: (data) => ({ event: BOOKING_EVENTS.REQUESTED, payload: createBookingPayload(data) }),
  confirmed: (data) => ({ event: BOOKING_EVENTS.CONFIRMED, payload: createBookingPayload(data) }),
  priceCalculated: (data) => ({ event: BOOKING_EVENTS.PRICE_CALCULATED, payload: createBookingPayload(data) })
};

export const FormEventBuilder = {
  fieldChanged: (fieldId, value) => ({ 
    event: FORM_EVENTS.FIELD_CHANGED, 
    payload: createFormPayload(fieldId, value) 
  }),
  submitted: (formData) => ({ 
    event: FORM_EVENTS.SUBMIT, 
    payload: createFormPayload(null, null, formData) 
  })
};

// Export everything for comprehensive access
export default {
  EVENTS,
  FORM_EVENTS,
  BOOKING_EVENTS,
  VEHICLE_EVENTS,
  LOCATION_EVENTS,
  PAYMENT_EVENTS,
  USER_EVENTS,
  MAP_EVENTS,
  ERROR_EVENTS,
  UI_EVENTS,
  ANALYTICS_EVENTS,
  SYSTEM_EVENTS,
  FLAT_EVENTS,
  ERROR_SEVERITY,
  FIELD_TYPES,
  SERVICE_TYPES,
  EVENT_CATEGORIES,
  createFormPayload,
  createBookingPayload,
  createVehiclePayload,
  createLocationPayload,
  createPaymentPayload,
  createUserPayload,
  createAnalyticsPayload,
  createFieldError,
  createGlobalError,
  createFieldChangePayload,
  createValidationPayload,
  createMiamiServicePayload,
  getDomainEvents,
  getEventDomain,
  isEventInDomain,
  getAllEvents,
  getEventsByCategory,
  validateEventName,
  BookingEventBuilder,
  FormEventBuilder
};

console.log('🎯 Domain-organized EventDefinitions loaded with backward compatibility');