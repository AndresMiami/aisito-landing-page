/**
 * FormEvents.js - Standardized form event definitions
 */

export const FORM_EVENTS = {
  // Form lifecycle events
  FORM_INITIALIZED: 'form:initialized',
  FORM_RESET_STARTED: 'form:reset:started',
  FORM_RESET_COMPLETED: 'form:reset:completed',
  
  // Validation events
  FORM_VALIDATED: 'form:validated',
  FORM_VALIDATION_CHANGED: 'form:validation-changed',
  FIELD_VALIDATED: 'form:field:validated',
  FIELD_CHANGED: 'form:field:changed',
  
  // Submission events
  SUBMIT_REQUESTED: 'form:submit:requested',
  SUBMIT_STARTED: 'form:submit:started',
  SUBMIT_PROCESSING: 'form:submit:processing',
  SUBMIT_SUCCESS: 'form:submit:success',
  SUBMIT_ERROR: 'form:submit:error',
  SUBMIT_COMPLETED: 'form:submit:completed',
  SUBMIT_CANCELLED: 'form:submit:cancelled',
  
  // Vehicle selection events
  VEHICLE_SELECTED: 'form:vehicle:selected',
  VEHICLE_SELECTION_CLEARED: 'form:vehicle:cleared',
  
  // Experience events
  EXPERIENCE_TYPE_SELECTED: 'form:experience:type-selected',
  EXPERIENCE_DURATION_SELECTED: 'form:experience:duration-selected',
  
  // DateTime events
  DATETIME_SELECTED: 'form:datetime:selected',
  BOOKING_PREFERENCE_CHANGED: 'form:booking:preference-changed'
};

export function createFormValidationObject(isValid, errors, formId, source = 'validation') {
  return {
    isValid,
    errors: Array.isArray(errors) ? errors : [errors],
    formId,
    source,
    timestamp: Date.now()
  };
}

export function createFieldValidationObject(fieldId, value, isValid, errors = [], rules = []) {
  return {
    fieldId,
    value,
    isValid,
    errors: Array.isArray(errors) ? errors : [errors],
    rules,
    timestamp: Date.now()
  };
}

export default {
  FORM_EVENTS,
  createFormValidationObject,
  createFieldValidationObject
};