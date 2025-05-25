// errorHandling.js
// This module contains functions specifically for handling and displaying
// form validation and submission errors on the dashboard page.

import eventBus from './src/core/EventBus.js';
import { ERROR_EVENTS, ERROR_SEVERITY } from './ErrorEvents.js';
import DOMManager from './core/DOMManager.js';
import EventDefinitions from './core/EventDefinitions.js';

/**
 * Displays a validation or API error message below a specific form field.
 * Also applies visual styling and ARIA attributes for accessibility.
 *
 * @param {object} elements - Object containing references to DOM elements (from getElementRefs).
 * @param {string} fieldId - The ID of the form field the error is related to.
 * @param {string} message - The error message to display.
 */
export function showError(elements, fieldId, message) {
  console.log(`🚨 Showing error for ${fieldId}: ${message}`);
  
  // Use DOMManager for all DOM operations
  const errorSpan = DOMManager.getElementById(`${fieldId}-error`);
  const inputElement = DOMManager.getElementById(fieldId);
  
  // Set error message
  if (errorSpan) {
    DOMManager.setText(errorSpan, message);
    DOMManager.removeClass(errorSpan, 'hidden');
    DOMManager.addClass(errorSpan, 'visible');
  }
  
  // Add error styling to input
  if (inputElement) {
    DOMManager.addClass(inputElement, 'border-red-500');
    DOMManager.addClass(inputElement, 'ring-red-500');
    DOMManager.setAttribute(inputElement, 'aria-invalid', 'true');
  }
  
  // Emit error event
  if (window.eventBus) {
    window.eventBus.emit(EventDefinitions.EVENTS.ERROR.SHOWN_CONFIRMED, {
      fieldId,
      message,
      timestamp: Date.now()
    });
  }
}

/**
 * Clears the error message, visual styling, and ARIA attributes for a specific form field.
 *
 * @param {string} fieldId - The ID of the form field to clear the error for.
 */
export function clearError(fieldId) {
  console.log(`✨ Clearing error for ${fieldId}`);
  
  const errorSpan = DOMManager.getElementById(`${fieldId}-error`);
  const inputElement = DOMManager.getElementById(fieldId);
  
  if (errorSpan) {
    DOMManager.setText(errorSpan, '');
    DOMManager.addClass(errorSpan, 'hidden');
    DOMManager.removeClass(errorSpan, 'visible');
  }
  
  if (inputElement) {
    DOMManager.removeClass(inputElement, 'border-red-500');
    DOMManager.removeClass(inputElement, 'ring-red-500');
    DOMManager.removeAttribute(inputElement, 'aria-invalid');
  }
}

/**
 * Clears all validation and form-related error messages, visual styling, and ARIA attributes
 * across the entire form.
 *
 * @param {object} elements - Object containing references to DOM elements (from getElementRefs).
 */
export function clearAllErrors(elements) {
    // Find all elements within the booking form with an ID ending in '-error' (convention for error spans)
    const errorSpans = elements.bookingForm?.querySelectorAll('[id$="-error"]');
    // For each identified error span, clear its text content and hide it
    errorSpans?.forEach(span => { span.textContent = ''; span.classList.add('hidden'); });

    // Find all elements within the booking form that have error styling classes (ring-red-500 or border-red-500)
    const errorInputs = elements.bookingForm?.querySelectorAll('.ring-red-500, .border-red-500');
    // For each identified element with error styling, remove the styling classes
    errorInputs?.forEach(el => el.classList.remove('ring-red-500', 'ring-1', 'rounded-md', 'p-1', 'border-red-500')); // Include removal for button/fieldset styling

    // Find all elements within the booking form with the ARIA invalid attribute
    elements.bookingForm?.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute('aria-invalid'));
    // Find all fieldset elements within the booking form with the ARIA describedby attribute (used for radio groups)
    elements.bookingForm?.querySelectorAll('fieldset[aria-describedby]').forEach(el => el.removeAttribute('aria-describedby'));

    // Explicitly call clearError for specific known error indicators that might not be caught by the general selectors
    clearError('submit-button'); // Clear any error message specifically for the submit button
    clearError('vehicle_type_oneway'); // Clear errors for the vehicle type fieldset/group
    clearError('booking-time'); // Clear errors for the booking time button group
}

// Original functions - keeping for backward compatibility
function legacyShowError(elements, fieldId, message) {
  const field = elements[fieldId];
  const errorElement = elements[`${fieldId}Error`];
  
  if (field && errorElement) {
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    
    // Auto-focus the field for better UX
    if (field.focus) {
      field.focus();
    }
  }
}

function legacyClearError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (field) {
    field.classList.remove('error');
    field.setAttribute('aria-invalid', 'false');
  }
  
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.classList.add('hidden');
  }
}

function legacyClearAllErrors(elements) {
  Object.keys(elements).forEach(key => {
    if (key.endsWith('Error')) {
      const fieldId = key.replace('Error', '');
      legacyClearError(fieldId);
    }
  });
}

// Enhanced event emission function that prioritizes EventBus
function emitEvent(eventName, data = {}) {
  console.log(`📡 Emitting event: ${eventName}`, data);
  
  // Primary: Use EventBus if available (preferred method)
  if (window.eventBus && typeof window.eventBus.emit === 'function') {
    window.eventBus.emit(eventName, data);
  }
  
  // Legacy: Emit via SimpleBridge if available (for backward compatibility)
  if (window.SimpleBridge && typeof window.SimpleBridge.emit === 'function') {
    window.SimpleBridge.emit(eventName, data);
  }
  
  // Legacy: Also emit as custom DOM event (for backward compatibility)
  const customEvent = new CustomEvent(eventName, { detail: data });
  document.dispatchEvent(customEvent);
}

// Enhanced emit functions with better error handling and logging
export function emitError(fieldId, message, severity = ERROR_SEVERITY.ERROR, source = 'manual') {
  const errorData = {
    fieldId,
    message,
    severity,
    source,
    timestamp: Date.now()
  };
  
  console.log(`🚨 Emitting field error for ${fieldId}:`, errorData);
  
  try {
    eventBus.emit(ERROR_EVENTS.SHOW, errorData);
    
    // Also emit as generic event for broader listening
    emitEvent('error:field', errorData);
    
  } catch (error) {
    console.error('Failed to emit error event:', error);
    // Fallback to direct function call
    const elements = window.elementRefs || {};
    showError(elements, fieldId, message);
  }
}

export function emitClearError(fieldId, source = 'manual') {
  const clearData = {
    fieldId,
    source,
    timestamp: Date.now()
  };
  
  console.log(`🧹 Emitting clear error for ${fieldId}:`, clearData);
  
  try {
    eventBus.emit(ERROR_EVENTS.CLEAR, clearData);
    
    // Also emit as generic event
    emitEvent('error:field:cleared', clearData);
    
  } catch (error) {
    console.error('Failed to emit clear error event:', error);
    // Fallback to direct function call
    clearError(fieldId);
  }
}

export function emitGlobalError(message, severity = ERROR_SEVERITY.ERROR, code = null, dismissable = true, source = 'manual', duration = null) {
  const globalErrorData = {
    message,
    severity,
    code,
    dismissable,
    source,
    duration,
    timestamp: Date.now()
  };
  
  console.log(`🌐 Emitting global error:`, globalErrorData);
  
  try {
    eventBus.emit(ERROR_EVENTS.GLOBAL, globalErrorData);
    
    // Also emit as generic event
    emitEvent('error:global', globalErrorData);
    
  } catch (error) {
    console.error('Failed to emit global error event:', error);
    // Fallback to console or alert
    console.error(`Global Error [${severity}]: ${message}`);
  }
}

export function emitClearAllErrors(source = 'manual') {
  const clearAllData = {
    source,
    timestamp: Date.now()
  };
  
  console.log(`🧽 Emitting clear all errors:`, clearAllData);
  
  try {
    eventBus.emit(ERROR_EVENTS.CLEAR_ALL, clearAllData);
    
    // Also emit as generic event
    emitEvent('error:all:cleared', clearAllData);
    
  } catch (error) {
    console.error('Failed to emit clear all errors event:', error);
    // Fallback to direct function call
    const elements = window.elementRefs || {};
    clearAllErrors(elements);
  }
}

// Enhanced EventBus listeners with better error handling
eventBus.on('error:show', ({ fieldId, message, severity = 'error', source = 'unknown' }) => {
  console.log(`EventBus: Showing ${severity} error from ${source} for ${fieldId}: ${message}`);
  
  try {
    // Get elements reference from global store
    const elements = window.elementRefs || {};
    showError(elements, fieldId, message);
    
    // Track error for analytics with enhanced data
    eventBus.emit('analytics:track', {
      event: 'error_shown',
      properties: {
        fieldId,
        message,
        severity,
        source,
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('Error in error:show listener:', error);
  }
});

eventBus.on('error:clear', ({ fieldId, source = 'manual' }) => {
  console.log(`EventBus: Clearing error for ${fieldId} from ${source}`);
  
  try {
    // Get elements reference from global store
    const elements = window.elementRefs || {};
    clearError(fieldId);
    
  } catch (error) {
    console.error('Error in error:clear listener:', error);
  }
});

eventBus.on('error:global', ({ message, severity, code, dismissable, source, duration }) => {
  console.log(`EventBus: Global error [${severity}] - ${message}`);
  
  // Here you can also trigger a global error display logic, if any
  // For example, showing a toast notification or a modal
});

eventBus.on('error:all:cleared', ({ source }) => {
  console.log(`EventBus: All errors cleared by ${source}`);
  
  // Here you can trigger a logic to hide any global error display, if needed
});

// Immediately Invoked Function Expression (IIFE) to initialize error handling state
(function initErrorHandling() {
  console.log('Initializing error handling state');
  
  // Predefine some common error messages for demonstration
  const predefinedErrors = {
    email: 'Please enter a valid email address.',
    password: 'Password must be at least 6 characters.',
    'submit-button': 'Please accept the terms and conditions.'
  };
  
  // Simulate showing predefined errors for demonstration
  Object.keys(predefinedErrors).forEach(fieldId => {
    const message = predefinedErrors[fieldId];
    showError(window.elementRefs, fieldId, message);
  });
})();

//# sourceMappingURL=errorHandling.js.map
