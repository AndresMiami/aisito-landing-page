/**
 * FormEvents.js - Standardized form submission event definitions
 * 
 * This file defines all form submission-related events and their payload structures
 * for use with the EventBus system.
 */

// Define all form submission event types with namespaced format
export const FORM_EVENTS = {
  // Form submission process events
  SUBMISSION_STARTED: 'form:submission:started',
  SUBMISSION_SUCCEEDED: 'form:submission:succeeded',
  SUBMISSION_FAILED: 'form:submission:failed',
  SUBMISSION_CANCELED: 'form:submission:canceled',
  
  // Form data events
  DATA_PROCESSED: 'form:data:processed',
  DATA_INVALID: 'form:data:invalid',
  
  // UI state events
  LOADING_STARTED: 'form:loading:started',
  LOADING_ENDED: 'form:loading:ended',
  
  // Confirmation events
  CONFIRMATION_SHOWN: 'form:confirmation:shown',
  CONFIRMATION_DISMISSED: 'form:confirmation:dismissed',
  
  // Form reset events
  FORM_RESET: 'form:reset',
  FORM_CLEAR: 'form:clear'
};

/**
 * Create a standardized form submission data object
 * @param {Object} formData - The processed form data
 * @param {string} serviceType - Type of service selected
 * @param {string} source - Component that generated the event
 * @returns {Object} Formatted submission data object
 */
export function createSubmissionData(formData, serviceType, source = 'form-submission') {
  return {
    data: formData,
    serviceType,
    source,
    timestamp: Date.now()
  };
}

/**
 * Create a standardized form submission error object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @param {string} source - Component that generated the error
 * @returns {Object} Formatted submission error object
 */
export function createSubmissionError(message, code, details = {}, source = 'form-submission') {
  return {
    message,
    code,
    details,
    source,
    timestamp: Date.now()
  };
}

// Example usage:
// import { FORM_EVENTS, createSubmissionData } from './src/core/FormEvents.js';
// import eventBus from './src/core/EventBus.js';
// eventBus.emit(FORM_EVENTS.SUBMISSION_STARTED, createSubmissionData(formData, 'oneway'));

export default {
  FORM_EVENTS,
  createSubmissionData,
  createSubmissionError
};