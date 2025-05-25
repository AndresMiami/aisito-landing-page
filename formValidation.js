/**
 * formValidation.js - Enhanced form validation with DOMManager integration
 * This module handles form field validation using centralized DOM operations
 * and event-driven architecture for better maintainability.
 */

import DOMManager from './core/DOMManager.js';
import eventBus from './src/core/EventBus.js';
import EventDefinitions from './core/EventDefinitions.js';
import { ERROR_SEVERITY } from './ErrorEvents.js';

/**
 * Validate a single form field with DOMManager integration
 * @param {string} fieldId - Field ID to validate
 * @param {string} value - Field value to validate
 * @param {Object} validationRules - Validation rules for the field
 * @returns {boolean} Validation result
 */
export function validateField(fieldId, value, validationRules = {}) {
  console.log(`🔍 Validating field: ${fieldId} with value: ${value}`);
  
  // Get field using DOMManager
  const field = DOMManager.getElementById(fieldId);
  if (!field) {
    console.warn(`Field ${fieldId} not found for validation`);
    return false;
  }
  
  let isValid = true;
  let errorMessage = '';
  const errors = [];
  
  // Required field validation
  if (validationRules.required && (!value || value.trim() === '')) {
    isValid = false;
    errorMessage = validationRules.requiredMessage || `${getFieldLabel(fieldId)} is required`;
    errors.push({ rule: 'required', message: errorMessage });
  }
  
  // Length validation
  if (value && validationRules.minLength && value.length < validationRules.minLength) {
    isValid = false;
    errorMessage = validationRules.minLengthMessage || `${getFieldLabel(fieldId)} must be at least ${validationRules.minLength} characters`;
    errors.push({ rule: 'minLength', message: errorMessage });
  }
  
  if (value && validationRules.maxLength && value.length > validationRules.maxLength) {
    isValid = false;
    errorMessage = validationRules.maxLengthMessage || `${getFieldLabel(fieldId)} must not exceed ${validationRules.maxLength} characters`;
    errors.push({ rule: 'maxLength', message: errorMessage });
  }
  
  // Email validation
  if (value && validationRules.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMessage = validationRules.emailMessage || 'Please enter a valid email address';
      errors.push({ rule: 'email', message: errorMessage });
    }
  }
  
  // Phone validation
  if (value && validationRules.phone) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      errorMessage = validationRules.phoneMessage || 'Please enter a valid phone number';
      errors.push({ rule: 'phone', message: errorMessage });
    }
  }
  
  // Custom validation function
  if (value && validationRules.custom && typeof validationRules.custom === 'function') {
    const customResult = validationRules.custom(value);
    if (!customResult.isValid) {
      isValid = false;
      errorMessage = customResult.message || 'Custom validation failed';
      errors.push({ rule: 'custom', message: errorMessage });
    }
  }
  
  // Create validation payload using EventDefinitions
  const validationResult = EventDefinitions.createValidationPayload(
    fieldId,
    isValid,
    errors,
    'form-validation'
  );
  
  // Emit validation result event
  eventBus.emit(EventDefinitions.EVENTS.VALIDATION.FIELD_VALIDATED, validationResult);
  
  // Update field UI based on validation result
  if (!isValid) {
    // Add error styling using DOMManager
    DOMManager.addClass(field, 'border-red-500');
    DOMManager.addClass(field, 'ring-red-500');
    DOMManager.setAttribute(field, 'aria-invalid', 'true');
    
    // Emit error show event
    eventBus.emit(EventDefinitions.EVENTS.ERROR.SHOW, {
      fieldId,
      message: errorMessage,
      severity: ERROR_SEVERITY.ERROR,
      timestamp: Date.now(),
      source: 'field-validation'
    });
  } else {
    // Remove error styling using DOMManager
    DOMManager.removeClass(field, 'border-red-500');
    DOMManager.removeClass(field, 'ring-red-500');
    DOMManager.removeAttribute(field, 'aria-invalid');
    
    // Emit error clear event
    eventBus.emit(EventDefinitions.EVENTS.ERROR.CLEAR, {
      fieldId,
      timestamp: Date.now(),
      source: 'field-validation'
    });
  }
  
  return isValid;
}

/**
 * Validate entire form with DOMManager integration
 * @param {string} formId - Form ID to validate
 * @param {Object} validationConfig - Validation configuration object
 * @returns {boolean} Overall form validation result
 */
export function validateForm(formId, validationConfig = {}) {
  console.log(`📋 Validating form: ${formId}`);
  
  // Get form using DOMManager
  const form = DOMManager.getElementById(formId);
  if (!form) {
    console.error(`Form ${formId} not found for validation`);
    return false;
  }
  
  // Get all form fields using DOMManager
  const fields = DOMManager.getElements('input, select, textarea', form);
  let isValid = true;
  let errors = [];
  let validatedFields = [];
  
  // Validate each field
  fields.forEach(field => {
    if (field.id && validationConfig[field.id]) {
      const fieldValue = DOMManager.getValue(field);
      const fieldValid = validateField(field.id, fieldValue, validationConfig[field.id]);
      
      validatedFields.push({
        fieldId: field.id,
        isValid: fieldValid,
        value: fieldValue
      });
      
      if (!fieldValid) {
        errors.push(field.id);
      }
      isValid = isValid && fieldValid;
    }
  });
  
  // Emit form validation event
  eventBus.emit(EventDefinitions.EVENTS.FORM.VALIDATED, {
    formId,
    isValid,
    errors,
    validatedFields,
    timestamp: Date.now()
  });
  
  // Update submit button state using DOMManager
  const submitButtons = DOMManager.getElements('button[type="submit"]', form);
  submitButtons.forEach(button => {
    DOMManager.setButtonLoading(button, false); // Ensure not in loading state
    button.disabled = !isValid;
    
    // Add visual feedback
    if (isValid) {
      DOMManager.removeClass(button, 'opacity-50');
      DOMManager.removeClass(button, 'cursor-not-allowed');
    } else {
      DOMManager.addClass(button, 'opacity-50');
      DOMManager.addClass(button, 'cursor-not-allowed');
    }
  });
  
  // Emit form ready/not ready events
  if (isValid) {
    eventBus.emit(EventDefinitions.EVENTS.FORM.READY_TO_SUBMIT, {
      formId,
      timestamp: Date.now()
    });
  } else {
    eventBus.emit(EventDefinitions.EVENTS.FORM.NOT_READY_TO_SUBMIT, {
      formId,
      errors,
      timestamp: Date.now()
    });
  }
  
  return isValid;
}

/**
 * Validate specific field types with Miami Concierge business rules
 * @param {string} fieldId - Field ID
 * @param {string} value - Field value
 * @param {string} fieldType - Type of field (location, vehicle, etc.)
 * @returns {Object} Validation result object
 */
export function validateMiamiField(fieldId, value, fieldType) {
  console.log(`🏖️ Validating Miami field: ${fieldId} (${fieldType})`);
  
  const field = DOMManager.getElementById(fieldId);
  if (!field) {
    return { isValid: false, message: 'Field not found' };
  }
  
  let result = { isValid: true, message: '' };
  
  switch (fieldType) {
    case 'location':
      result = validateLocationField(value);
      break;
    case 'vehicle':
      result = validateVehicleSelection(value);
      break;
    case 'datetime':
      result = validateDateTimeField(value);
      break;
    case 'passenger_count':
      result = validatePassengerCount(value);
      break;
    case 'duration':
      result = validateDuration(value);
      break;
    default:
      result = { isValid: true, message: '' };
  }
  
  // Apply validation result using DOMManager
  if (!result.isValid) {
    DOMManager.addClass(field, 'border-red-500');
    DOMManager.setAttribute(field, 'aria-invalid', 'true');
    
    // Show error message
    eventBus.emit(EventDefinitions.EVENTS.ERROR.SHOW, {
      fieldId,
      message: result.message,
      severity: ERROR_SEVERITY.ERROR,
      timestamp: Date.now(),
      source: 'miami-field-validation'
    });
  } else {
    DOMManager.removeClass(field, 'border-red-500');
    DOMManager.removeAttribute(field, 'aria-invalid');
    
    // Clear any existing errors
    eventBus.emit(EventDefinitions.EVENTS.ERROR.CLEAR, {
      fieldId,
      timestamp: Date.now(),
      source: 'miami-field-validation'
    });
  }
  
  return result;
}

/**
 * Real-time validation setup for form fields
 * @param {string} formId - Form ID to set up validation for
 * @param {Object} validationConfig - Validation configuration
 */
export function setupRealTimeValidation(formId, validationConfig) {
  console.log(`⚡ Setting up real-time validation for form: ${formId}`);
  
  const form = DOMManager.getElementById(formId);
  if (!form) {
    console.error(`Form ${formId} not found for real-time validation setup`);
    return;
  }
  
  // Set up event listeners for each field using DOMManager
  Object.keys(validationConfig).forEach(fieldId => {
    const field = DOMManager.getElementById(fieldId);
    if (field) {
      // Add input event listener for real-time validation
      DOMManager.addEventListener(field, 'input', (event) => {
        const value = DOMManager.getValue(field);
        validateField(fieldId, value, validationConfig[fieldId]);
      });
      
      // Add blur event listener for complete validation
      DOMManager.addEventListener(field, 'blur', (event) => {
        const value = DOMManager.getValue(field);
        validateField(fieldId, value, validationConfig[fieldId]);
        
        // Trigger form-level validation after field validation
        setTimeout(() => {
          validateForm(formId, validationConfig);
        }, 50);
      });
    }
  });
  
  // Set up form submit validation
  DOMManager.addEventListener(form, 'submit', (event) => {
    const isValid = validateForm(formId, validationConfig);
    if (!isValid) {
      event.preventDefault();
      event.stopPropagation();
      
      // Emit form submission blocked event
      eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_BLOCKED, {
        formId,
        reason: 'validation_failed',
        timestamp: Date.now()
      });
    }
  });
  
  console.log('✅ Real-time validation setup complete');
}

// Helper functions

/**
 * Get field label for error messages
 * @param {string} fieldId - Field ID
 * @returns {string} Field label
 */
function getFieldLabel(fieldId) {
  const field = DOMManager.getElementById(fieldId);
  if (!field) return fieldId;
  
  // Try to find associated label
  const label = DOMManager.getElement(`label[for="${fieldId}"]`);
  if (label) {
    return DOMManager.getText(label).replace('*', '').trim();
  }
  
  // Fallback to field name or placeholder
  return field.getAttribute('data-label') || 
         field.getAttribute('placeholder') || 
         fieldId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Validate location field (Miami-specific)
 * @param {string} value - Location value
 * @returns {Object} Validation result
 */
function validateLocationField(value) {
  if (!value || value.trim() === '') {
    return { isValid: false, message: 'Location is required' };
  }
  
  if (value.length < 3) {
    return { isValid: false, message: 'Please enter a more specific location' };
  }
  
  // Miami-specific location validation could be added here
  return { isValid: true, message: '' };
}

/**
 * Validate vehicle selection
 * @param {string} value - Vehicle type value
 * @returns {Object} Validation result
 */
function validateVehicleSelection(value) {
  const validVehicles = ['sedan', 'suv', 'luxury', 'van', 'limo'];
  
  if (!value) {
    return { isValid: false, message: 'Please select a vehicle type' };
  }
  
  if (!validVehicles.includes(value)) {
    return { isValid: false, message: 'Please select a valid vehicle type' };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validate date/time field
 * @param {string} value - DateTime value
 * @returns {Object} Validation result
 */
function validateDateTimeField(value) {
  if (!value) {
    return { isValid: false, message: 'Date and time are required' };
  }
  
  const selectedDate = new Date(value);
  const now = new Date();
  
  if (selectedDate <= now) {
    return { isValid: false, message: 'Please select a future date and time' };
  }
  
  // Check if date is too far in the future (e.g., 1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (selectedDate > oneYearFromNow) {
    return { isValid: false, message: 'Please select a date within the next year' };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validate passenger count
 * @param {string} value - Passenger count value
 * @returns {Object} Validation result
 */
function validatePassengerCount(value) {
  const count = parseInt(value);
  
  if (isNaN(count) || count < 1) {
    return { isValid: false, message: 'Please enter a valid number of passengers' };
  }
  
  if (count > 20) {
    return { isValid: false, message: 'For groups larger than 20, please contact us directly' };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validate duration for hourly services
 * @param {string} value - Duration value
 * @returns {Object} Validation result
 */
function validateDuration(value) {
  const duration = parseInt(value);
  
  if (isNaN(duration) || duration < 1) {
    return { isValid: false, message: 'Please select a valid duration' };
  }
  
  if (duration > 12) {
    return { isValid: false, message: 'For services longer than 12 hours, please contact us directly' };
  }
  
  return { isValid: true, message: '' };
}

// Event listeners for validation events
eventBus.on(EventDefinitions.EVENTS.VALIDATION.FIELD_VALIDATED, (data) => {
  console.log(`✅ Field validation completed for ${data.fieldId}:`, data);
});

eventBus.on(EventDefinitions.EVENTS.FORM.VALIDATED, (data) => {
  console.log(`📝 Form validation completed for ${data.formId}:`, data);
});

// Initialize validation system
function initValidationSystem() {
  console.log('🔍 Initializing Miami Concierge validation system with DOMManager');
  
  // Ensure DOMManager is available
  if (!DOMManager) {
    console.error('DOMManager not available - validation may not work properly');
    return;
  }
  
  // Set up global validation event listeners
  console.log('✅ Validation system initialized with DOMManager');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initValidationSystem);
} else {
  initValidationSystem();
}

// Export validation configuration for common Miami Concierge fields
export const MIAMI_VALIDATION_CONFIG = {
  'from-location': {
    required: true,
    minLength: 3,
    requiredMessage: 'Pickup location is required',
    minLengthMessage: 'Please enter a more specific pickup location'
  },
  'to-address': {
    required: true,
    minLength: 3,
    requiredMessage: 'Destination is required',
    minLengthMessage: 'Please enter a more specific destination'
  },
  'passenger-count': {
    required: true,
    custom: (value) => {
      const count = parseInt(value);
      if (isNaN(count) || count < 1) {
        return { isValid: false, message: 'Please enter a valid number of passengers' };
      }
      if (count > 20) {
        return { isValid: false, message: 'For groups larger than 20, please contact us directly' };
      }
      return { isValid: true };
    }
  },
  'contact-email': {
    required: true,
    email: true,
    requiredMessage: 'Email address is required',
    emailMessage: 'Please enter a valid email address'
  },
  'contact-phone': {
    required: true,
    phone: true,
    requiredMessage: 'Phone number is required',
    phoneMessage: 'Please enter a valid phone number'
  }
};

console.log("🔍 Enhanced Form Validation module loaded with DOMManager integration");