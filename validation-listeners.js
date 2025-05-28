/**
 * validation-listeners.js - Centralized validation event handling system
 * 
 * This file creates event listeners for all validation-related events,
 * working with the enhanced error handling system to provide real-time
 * feedback and form state management.
 */

import eventBus from './eventBus.js';
import { ERROR_EVENTS, ERROR_SEVERITY } from './ErrorEvents.js';
import { emitError, emitClearError, emitGlobalError, emitEvent } from './errorHandling.js';

/**
 * Initialize validation event listeners
 * Sets up listeners for all validation-related events
 */
function initializeValidationEventListeners() {
  console.log('🔄 Initializing validation event listeners...');
  
  // Get EventBus instance - try both global and SimpleBridge
  const eventBusInstance = window.eventBus || eventBus || (window.SimpleBridge?.eventBus);
  
  if (!eventBusInstance) {
    console.error('❌ Cannot initialize validation listeners: EventBus not available');
    return false;
  }
  
  // Listen for field validation events
  eventBusInstance.on('form:field:validated', handleFieldValidation);
  
  // Listen for form validation events
  eventBusInstance.on('form:validated', handleFormValidation);
  
  // Listen for validation change events
  eventBusInstance.on('form:validation-changed', handleValidationChanged);
  
  // Listen for field change events
  eventBusInstance.on('form:field-changed', handleFieldChanged);
  
  // Listen for real-time validation requests
  eventBusInstance.on('form:validate-field', handleValidateFieldRequest);
  
  // Listen for location validation events (specific to Miami Concierge)
  eventBusInstance.on('location:validation-required', handleLocationValidation);
  
  console.log('✅ Validation event listeners initialized');
  return true;
}

/**
 * Handle field validation events
 * @param {Object} data - Field validation data
 */
function handleFieldValidation(data) {
  const { fieldId, isValid, value, errors = [], source = 'unknown' } = data;
  console.log(`🔍 Field validation result for ${fieldId}:`, isValid ? 'valid' : 'invalid');
  
  try {
    // Update UI based on validation result
    if (isValid) {
      // Clear any existing errors for this field
      emitClearError(fieldId, source);
      
      // Add success indicator
      const field = document.getElementById(fieldId);
      if (field) {
        field.classList.remove('invalid', 'ring-red-500', 'ring-1');
        field.classList.add('valid', 'ring-green-500');
        
        // Update aria attributes for accessibility
        field.setAttribute('aria-invalid', 'false');
        
        // Find and update associated label if exists
        const label = document.querySelector(`label[for="${fieldId}"]`);
        if (label) {
          label.classList.remove('text-red-500');
          label.classList.add('text-green-700');
        }
      }
      
      // Emit validation success event
      emitEvent('form:field:validation-success', {
        fieldId,
        value,
        source
      });
      
    } else {
      // Show validation errors
      if (errors.length > 0) {
        emitError(fieldId, errors[0], ERROR_SEVERITY.ERROR, source);
      }
      
      // Add error styling
      const field = document.getElementById(fieldId);
      if (field) {
        field.classList.remove('valid', 'ring-green-500');
        field.classList.add('invalid');
        field.setAttribute('aria-invalid', 'true');
      }
      
      // Emit validation failure event
      emitEvent('form:field:validation-error', {
        fieldId,
        errors,
        source
      });
    }
    
  } catch (error) {
    console.error('Error handling field validation:', error);
  }
}

/**
 * Handle form validation events
 * @param {Object} data - Form validation data
 */
function handleFormValidation(data) {
  const { isValid, errors = [], source = 'unknown', formId = 'booking-form' } = data;
  console.log(`🔍 Form validation result:`, isValid ? 'valid' : 'invalid');
  
  try {
    // Update submit button state
    updateSubmitButtonState(isValid, formId);
    
    // Show global validation message if needed
    if (!isValid && errors.length > 0) {
      emitGlobalError(
        `Please correct ${errors.length} error${errors.length > 1 ? 's' : ''} before submitting`,
        ERROR_SEVERITY.WARNING,
        'FORM_INVALID',
        true,
        source,
        5000
      );
    } else if (isValid) {
      // Clear any existing global validation errors
      eventBus.emit(ERROR_EVENTS.GLOBAL_CLEAR);
    }
    
    // Update form visual state
    const form = document.getElementById(formId);
    if (form) {
      form.setAttribute('data-valid', isValid.toString());
      
      if (isValid) {
        form.classList.add('form-valid');
        form.classList.remove('form-invalid');
      } else {
        form.classList.add('form-invalid');
        form.classList.remove('form-valid');
      }
    }
    
    // Emit analytics event
    emitEvent('analytics:track', {
      event: 'form_validation_completed',
      properties: {
        isValid,
        errorCount: errors.length,
        formId,
        source,
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('Error handling form validation:', error);
  }
}

/**
 * Handle validation changed events (for dynamic form updates)
 * @param {Object} data - Validation change data
 */
function handleValidationChanged(data) {
  const { isValid, tab, fieldId, reason = 'field-change' } = data;
  console.log(`🔄 Validation changed for ${tab || 'form'}:`, isValid ? 'valid' : 'invalid');
  
  try {
    // Update UI elements based on tab
    if (tab) {
      const tabId = tab === 'oneway' ? 'panel-oneway' : 'panel-experience-plus';
      const tabPanel = document.getElementById(tabId);
      
      if (tabPanel) {
        // Update vehicle selection visibility for oneway tab
        if (tab === 'oneway') {
          const vehicleSelection = document.getElementById('vehicle-selection-oneway');
          if (vehicleSelection) {
            if (isValid) {
              vehicleSelection.classList.remove('hidden');
              vehicleSelection.classList.add('show');
              
              // Animate the reveal
              setTimeout(() => {
                vehicleSelection.style.opacity = '1';
                vehicleSelection.style.transform = 'translateY(0)';
              }, 100);
            } else {
              vehicleSelection.style.opacity = '0';
              vehicleSelection.style.transform = 'translateY(-10px)';
              
              setTimeout(() => {
                vehicleSelection.classList.add('hidden');
                vehicleSelection.classList.remove('show');
              }, 300);
            }
          }
        }
        
        // Update submit button state for specific tab
        updateSubmitButtonState(isValid, `${tabId}-form`);
      }
    }
    
    // Emit analytics event
    emitEvent('analytics:track', {
      event: 'validation_state_changed',
      properties: {
        tab: tab || 'unknown',
        fieldId: fieldId || 'unknown',
        isValid,
        reason,
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('Error handling validation change:', error);
  }
}

/**
 * Handle field changed events
 * @param {Object} data - Field change data
 */
function handleFieldChanged(data) {
  const { field, value, rules = [], params = {} } = data;
  console.log(`📝 Field changed: ${field} = "${value}"`);
  
  try {
    // Clear errors when field changes (but user is actively typing)
    if (value && value.length > 0) {
      emitClearError(field, 'field-change');
    }
    
    // For location fields, trigger location validation
    if (['from-location', 'to-address', 'from-location-exp'].includes(field)) {
      emitEvent('location:validation-required', {
        fieldId: field,
        value,
        timestamp: Date.now()
      });
    }
    
    // Trigger real-time validation for certain fields
    if (rules.length > 0) {
      setTimeout(() => {
        emitEvent('form:validate-field', {
          fieldId: field,
          value,
          rules,
          params,
          source: 'real-time'
        });
      }, 300); // Debounce validation
    }
    
  } catch (error) {
    console.error('Error handling field change:', error);
  }
}

/**
 * Handle validation requests for specific fields
 * @param {Object} data - Validation request data
 */
function handleValidateFieldRequest(data) {
  const { fieldId, value, rules = [], params = {} } = data;
  console.log(`🔍 Validating field: ${fieldId}`);
  
  try {
    // This would trigger your actual validation logic
    // For now, emit a placeholder validation result
    const isValid = validateFieldValue(fieldId, value, rules, params);
    
    emitEvent('form:field:validated', {
      fieldId,
      value,
      isValid,
      errors: isValid ? [] : [`${fieldId} validation failed`],
      source: 'real-time-validation'
    });
    
  } catch (error) {
    console.error('Error validating field:', error);
  }
}

/**
 * Handle location-specific validation
 * @param {Object} data - Location validation data
 */
function handleLocationValidation(data) {
  const { fieldId, value } = data;
  console.log(`📍 Location validation required for ${fieldId}`);
  
  try {
    // Check if location field has been selected via Google Places
    const field = document.getElementById(fieldId);
    if (field) {
      const hasPlaceData = field.hasAttribute('data-place-id');
      
      if (value && !hasPlaceData) {
        emitError(
          fieldId,
          'Please select a location from the dropdown suggestions',
          ERROR_SEVERITY.WARNING,
          'location-validation'
        );
      } else if (hasPlaceData) {
        emitClearError(fieldId, 'location-validation');
      }
    }
    
  } catch (error) {
    console.error('Error handling location validation:', error);
  }
}

/**
 * Update submit button state based on validation
 * @param {boolean} isValid - Whether form is valid
 * @param {string} formId - Form identifier
 */
function updateSubmitButtonState(isValid, formId = 'booking-form') {
  const submitButton = document.querySelector(`#${formId} .submit-button`) || 
                      document.getElementById('submit-button');
  
  if (submitButton) {
    submitButton.disabled = !isValid;
    
    if (isValid) {
      submitButton.classList.remove('disabled', 'opacity-50', 'cursor-not-allowed');
      submitButton.classList.add('enabled', 'hover:bg-blue-700');
      submitButton.setAttribute('aria-disabled', 'false');
      submitButton.title = 'Submit booking request';
    } else {
      submitButton.classList.remove('enabled', 'hover:bg-blue-700');
      submitButton.classList.add('disabled', 'opacity-50', 'cursor-not-allowed');
      submitButton.setAttribute('aria-disabled', 'true');
      submitButton.title = 'Please complete all required fields';
    }
  }
}

/**
 * Simple field validation function (placeholder)
 * Replace with your actual validation logic
 */
function validateFieldValue(fieldId, value, rules, params) {
  // Basic validation - replace with your actual validation logic
  if (rules.includes('required') && (!value || value.trim().length === 0)) {
    return false;
  }
  
  if (rules.includes('locationSelected') && params.locationSelected) {
    const field = document.getElementById(fieldId);
    return field && field.hasAttribute('data-place-id');
  }
  
  return true;
}

// Initialize listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for EventBus to be available
  const checkEventBus = () => {
    if (window.eventBus || eventBus || window.SimpleBridge?.eventBus) {
      initializeValidationEventListeners();
    } else {
      console.log('⏳ Waiting for EventBus to be available...');
      setTimeout(checkEventBus, 100);
    }
  };
  
  checkEventBus();
});

// Export functions for testing and reuse
export {
  initializeValidationEventListeners,
  handleFieldValidation,
  handleFormValidation,
  handleValidationChanged,
  handleFieldChanged,
  handleValidateFieldRequest,
  handleLocationValidation
};

console.log('🎯 Validation listeners module loaded');