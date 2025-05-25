// formValidation.js
// This module contains the logic for validating the booking form.

// Import error handling functions needed for displaying validation errors.
import { showError, clearAllErrors } from './errorHandling.js';
import eventBus from './src/core/EventBus.js';

// Create a validation rules registry
const validationRules = {
  required: {
    validator: (value) => value !== undefined && value !== null && value.toString().trim() !== '',
    message: 'This field is required'
  },
  email: {
    validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address'
  },
  phone: {
    validator: (value) => !value || /^\+?[\d\s()-]{10,20}$/.test(value),
    message: 'Please enter a valid phone number'
  },
  minLength: {
    validator: (value, length) => !value || value.length >= length,
    message: (length) => `Must be at least ${length} characters`
  },
  locationSelected: {
    validator: (value, field) => {
      // Check if the location field has a valid place selected
      const fieldElement = document.getElementById(field || 'from-location');
      return fieldElement && fieldElement.value && fieldElement.value.trim() !== '';
    },
    message: 'Please select a location from the dropdown suggestions'
  },
  vehicleSelected: {
    validator: (value, vehicleName) => {
      // Check if a vehicle radio button is selected
      const selectedVehicle = document.querySelector(`input[name="${vehicleName || 'vehicle_type_oneway'}"]:checked`);
      return !!selectedVehicle;
    },
    message: 'Please select a vehicle type'
  }
};

// Global form state to track validation status
window.formState = {
  oneway: {
    fromLocation: false,
    toAddress: false,
    bookingTime: false,
    pickupDate: false,
    pickupTime: false,
    vehicleType: false
  },
  experiencePlus: {
    fromLocation: false,
    experienceType: false,
    datePreference: false,
    guestInfo: false
  }
};

/**
 * Validates the form based on the currently active tab and the inputs within that tab.
 * Displays user-friendly error messages next to invalid fields and logs validation failures.
 *
 * @param {object} elements - Object containing references to DOM elements (from getElementRefs).
 * @returns {boolean} - true if the form is valid, false otherwise.
 */
export function validateForm(elements) {
    // Clear previous errors
    eventBus.emit('error:clear-all', { source: 'validation' });
    
    let isValid = true;
    
    // Get the active tab
    const activeTabButton = document.querySelector('.tab-button[aria-selected="true"]');
    const activePanelId = activeTabButton?.getAttribute('aria-controls');
    
    console.log('Active panel:', activePanelId);
    
    // Collect all fields that need validation based on the active panel
    const fieldsToValidate = getFieldsToValidate(elements, activePanelId);
    
    console.log('Fields to validate:', fieldsToValidate);
    
    // Validate each field
    Object.entries(fieldsToValidate).forEach(([fieldId, config]) => {
      const fieldElement = elements[fieldId] || document.getElementById(fieldId);
      const value = fieldElement?.value || '';
      
      console.log(`Validating field: ${fieldId}, value: "${value}"`);
      
      // Validate the field
      const fieldValid = validateField(fieldId, value, config.rules, config.params);
      
      if (!fieldValid.isValid) {
        isValid = false;
        console.log(`❌ Field ${fieldId} validation failed:`, fieldValid.errors);
        
        // Emit error event
        eventBus.emit('error:show', {
          fieldId,
          message: fieldValid.errors[0],
          severity: 'error',
          source: 'validation'
        });
        
        // Update form state
        updateFormState(fieldId, false);
      } else {
        console.log(`✅ Field ${fieldId} validation passed`);
        
        // Clear any existing errors
        eventBus.emit('error:clear', { fieldId, source: 'validation' });
        
        // Update form state
        updateFormState(fieldId, true);
      }
    });
    
    // Emit form validated event
    eventBus.emit('form:validated', {
      formId,
      isValid,
      source: 'validateForm',
      fieldsValidated: Object.keys(fieldsToValidate)
    });
    
    console.log(`🚌 Form validation complete. Valid: ${isValid}`);
    return isValid;
}

// Helper function to get fields that need validation based on active panel
function getFieldsToValidate(elements, activePanelId) {
  const fields = {};
  
  if (activePanelId === 'panel-oneway') {
    // One-Way tab fields
    fields['from-location'] = { 
      rules: ['required', 'locationSelected'],
      params: { locationSelected: ['from-location'] }
    };
    
    fields['to-address'] = { 
      rules: ['required', 'locationSelected'],
      params: { locationSelected: ['to-address'] }
    };
    
    // Check if booking time is selected
    const bookingPref = document.getElementById('booking-preference')?.value;
    if (bookingPref === 'Scheduled') {
      fields['pickup-date-oneway'] = { rules: ['required'] };
      fields['pickup-time-oneway'] = { rules: ['required'] };
    }
    
    // Vehicle selection validation
    fields['vehicle_type_oneway'] = { 
      rules: ['vehicleSelected'],
      params: { vehicleSelected: ['vehicle_type_oneway'] }
    };
  } 
  else if (activePanelId === 'panel-experience-plus') {
    // Experience+ tab fields
    fields['from-location-exp'] = { 
      rules: ['required', 'locationSelected'],
      params: { locationSelected: ['from-location-exp'] }
    };
    
    fields['experience-dropdown'] = { rules: ['required'] };
    
    // Add service-specific validation based on selected experience
    const selectedService = document.getElementById('experience-dropdown')?.value;
    
    if (selectedService === 'hourly_chauffeur') {
      fields['duration-hourly'] = { rules: ['required'] };
      fields['pickup-date-hourly'] = { rules: ['required'] };
      fields['pickup-time-hourly'] = { rules: ['required'] };
    } else if (selectedService && selectedService !== '') {
      // Date preference for curated experiences
      fields['date_preference'] = { rules: ['required'] };
    }
  }
  
  return fields;
}

// Function to validate a single field
function validateField(fieldId, value, rules = [], params = {}) {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  // Process each validation rule
  for (const rule of rules) {
    let ruleName = rule;
    let ruleParams = [];
    
    // Handle rules with parameters (e.g., minLength:3)
    if (rule.includes(':')) {
      const [name, ...paramsList] = rule.split(':');
      ruleName = name;
      ruleParams = paramsList;
    }
    
    // Use params object if available
    if (params[ruleName]) {
      ruleParams = params[ruleName];
    }
    
    // Get the validation rule
    const validationRule = validationRules[ruleName];
    if (!validationRule) {
      console.warn(`Unknown validation rule: ${ruleName}`);
      continue;
    }
    
    // Apply the validation rule
    const isValid = validationRule.validator(value, ...ruleParams);
    if (!isValid) {
      result.isValid = false;
      
      // Get the error message (handle both function and string messages)
      const message = typeof validationRule.message === 'function' 
        ? validationRule.message(...ruleParams)
        : validationRule.message;
        
      result.errors.push(message);
      break; // Stop on first error
    }
  }
  
  return result;
}

// Helper function to update form state
function updateFormState(fieldId, isValid) {
  if (!window.formState) return;
  
  // Map field IDs to form state properties
  const fieldMapping = {
    'from-location': ['oneway', 'fromLocation'],
    'from-location-exp': ['experiencePlus', 'fromLocation'],
    'to-address': ['oneway', 'toAddress'],
    'pickup-date-oneway': ['oneway', 'pickupDate'],
    'pickup-time-oneway': ['oneway', 'pickupTime'],
    'vehicle_type_oneway': ['oneway', 'vehicleType'],
    'experience-dropdown': ['experiencePlus', 'experienceType'],
    'date_preference': ['experiencePlus', 'datePreference']
  };
  
  const mapping = fieldMapping[fieldId];
  if (mapping) {
    const [tabType, stateKey] = mapping;
    if (window.formState[tabType]) {
      window.formState[tabType][stateKey] = isValid;
    }
  }
}

// Debug function to force validation (for your debug controls)
export function forceLocationValidation(fieldId, tabType, stateKey) {
  console.log(`🔧 Debug: Force validating ${fieldId} in ${tabType}.${stateKey}`);
  
  // Clear any existing error
  eventBus.emit('error:clear', { fieldId, source: 'debug' });
  
  // Mark as valid in form state
  if (window.formState && window.formState[tabType]) {
    window.formState[tabType][stateKey] = true;
  }
  
  // Show success feedback
  eventBus.emit('error:global', {
    message: `${fieldId} marked as valid for testing`,
    severity: 'success',
    code: 'DEBUG001',
    dismissable: true,
    source: 'debug'
  });
  
  // Also emit validation success event
  eventBus.emit('form:field:validated', {
    formId: 'booking-form',
    fieldId,
    value: 'debug-value',
    isValid: true,
    errors: [],
    warnings: [],
    source: 'debug'
  });
}

// Register event listeners for validation events
eventBus.on('form:field:validate', ({ formId, fieldId, value, rules = [], params = {}, silent = false }) => {
  console.log(`🚌 EventBus: Validating field ${fieldId} in form ${formId}`);
  
  // Validate the field
  const result = validateField(fieldId, value, rules, params);
  
  // Emit the validated event
  eventBus.emit('form:field:validated', {
    formId,
    fieldId,
    value,
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    source: 'eventbus-validation'
  });
  
  // Show/clear error if not silent
  if (!silent) {
    if (!result.isValid) {
      eventBus.emit('error:show', {
        fieldId,
        message: result.errors[0],
        severity: 'error',
        source: 'validation'
      });
    } else {
      eventBus.emit('error:clear', { fieldId, source: 'validation' });
    }
  }
  
  // Update form state
  updateFormState(fieldId, result.isValid);
});

eventBus.on('form:validate', ({ formId, source = 'unknown', options = {} }) => {
  console.log(`🚌 EventBus: Validating form ${formId} from ${source}`);
  
  // Get form elements
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form with ID ${formId} not found`);
    eventBus.emit('error:global', {
      message: `Form with ID ${formId} not found`,
      severity: 'error',
      code: 'FORM001',
      source: 'validation'
    });
    return false;
  }
  
  // Create elements object similar to what validateForm expects
  const elements = {
    bookingForm: form,
    tabNavigationContainer: document.querySelector('#tab-navigation'),
    // Add other elements as needed from window.elementRefs
    ...window.elementRefs
  };
  
  // Use the original validateForm for backward compatibility
  const isValid = validateForm(elements);
  
  return isValid;
});

// Register custom validation rule
eventBus.on('validation:rule:register', ({ name, validator, errorMessage }) => {
  console.log(`🚌 EventBus: Registering validation rule ${name}`);
  
  validationRules[name] = {
    validator,
    message: errorMessage
  };
});

// Event listener for real-time field validation
eventBus.on('form:field:changed', ({ fieldId, value, rules = [], params = {} }) => {
  console.log(`🚌 EventBus: Field ${fieldId} changed, validating...`);
  
  // Validate the field in real-time
  eventBus.emit('form:field:validate', {
    formId: 'booking-form',
    fieldId,
    value,
    rules,
    params,
    silent: false
  });
});

// Enhanced validation for location fields
eventBus.on('location:selected', ({ fieldId, place, isValid }) => {
  console.log(`🚌 EventBus: Location selected for ${fieldId}:`, place);
  
  if (isValid) {
    eventBus.emit('error:clear', { fieldId, source: 'location-validation' });
    updateFormState(fieldId, true);
  } else {
    eventBus.emit('error:show', {
      fieldId,
      message: 'Please select a valid location from the dropdown',
      severity: 'warning',
      source: 'location-validation'
    });
    updateFormState(fieldId, false);
  }
});

// Enhanced validation for vehicle selection
eventBus.on('vehicle:selected', ({ vehicleType, tabType }) => {
  console.log(`🚌 EventBus: Vehicle selected: ${vehicleType} in ${tabType}`);
  
  const fieldId = `vehicle_type_${tabType}`;
  eventBus.emit('error:clear', { fieldId, source: 'vehicle-validation' });
  updateFormState(fieldId, true);
});

// Initialize validation system
console.log('🚌 EventBus: Form validation module initialized');

// Export functions for backward compatibility
export { validationRules, updateFormState };