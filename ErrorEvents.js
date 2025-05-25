/**
 * ErrorEvents.js - Standardized error event definitions for Miami Concierge
 * 
 * This file defines all error-related events and their payload structures
 * for use with the EventBus system. It serves as the single source of truth
 * for error handling across the application.
 * 
 * Usage:
 * import { ERROR_EVENTS, ERROR_SEVERITY, createFieldError } from './ErrorEvents.js';
 * import eventBus from './src/core/EventBus.js';
 * 
 * // Emit an error
 * eventBus.emit(ERROR_EVENTS.SHOW, createFieldError('from-location', 'Please enter a location'));
 */

// Define all error event types with namespaced format
export const ERROR_EVENTS = {
  // Field-specific errors
  SHOW: 'error:show',           // Show error for a specific field
  CLEAR: 'error:clear',         // Clear error for a specific field
  CLEAR_ALL: 'error:clear-all', // Clear all errors
  
  // Global application errors
  GLOBAL: 'error:global',       // Show global application error
  GLOBAL_CLEAR: 'error:global-clear', // Clear global error
};

// Define error severity levels
export const ERROR_SEVERITY = {
  INFO: 'info',           // Informational message
  SUCCESS: 'success',     // Success message
  WARNING: 'warning',     // Warning - action can continue
  ERROR: 'error',         // Error - action cannot continue
  CRITICAL: 'critical'    // Critical error - system functionality affected
};

/**
 * Create a standardized field error object
 * @param {string} fieldId - ID of the form field
 * @param {string} message - Error message to display
 * @param {string} severity - From ERROR_SEVERITY
 * @param {string} source - Component that generated the error
 * @returns {Object} Formatted error object
 */
export function createFieldError(fieldId, message, severity = ERROR_SEVERITY.ERROR, source = 'unknown') {
  return {
    fieldId,
    message,
    severity,
    source,
    timestamp: Date.now()
  };
}

/**
 * Create a standardized global error object
 * @param {string} message - Error message to display
 * @param {string} severity - From ERROR_SEVERITY
 * @param {string} code - Optional error code
 * @param {boolean} dismissable - Whether user can dismiss the error
 * @param {string} source - Component that generated the error
 * @param {number} duration - Optional auto-dismiss duration in ms
 * @returns {Object} Formatted global error object
 */
export function createGlobalError(message, severity = ERROR_SEVERITY.ERROR, code = null, dismissable = true, source = 'unknown', duration = null) {
  return {
    message,
    severity,
    code,
    dismissable,
    source,
    duration,
    timestamp: Date.now()
  };
}

export default {
  ERROR_EVENTS,
  ERROR_SEVERITY,
  createFieldError,
  createGlobalError
};