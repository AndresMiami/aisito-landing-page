/**
 * errorHandling.js - Enhanced error handling with DOMManager integration
 * This module contains functions specifically for handling and displaying
 * form validation and submission errors on the dashboard page.
 */

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
  
  // Set error message and show error span
  if (errorSpan) {
    DOMManager.setText(errorSpan, message);
    DOMManager.removeClass(errorSpan, 'hidden');
    DOMManager.addClass(errorSpan, 'visible');
  }
  
  // Add error styling to input using DOMManager
  if (inputElement) {
    DOMManager.addClass(inputElement, 'border-red-500');
    DOMManager.addClass(inputElement, 'ring-red-500');
    DOMManager.setAttribute(inputElement, 'aria-invalid', 'true');
  }
  
  // Emit error event using EventDefinitions
  if (window.eventBus) {
    window.eventBus.emit(EventDefinitions.EVENTS.ERROR.SHOWN_CONFIRMED, {
      fieldId,
      message,
      timestamp: Date.now(),
      source: 'showError'
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
  
  // Use DOMManager for all DOM operations
  const errorSpan = DOMManager.getElementById(`${fieldId}-error`);
  const inputElement = DOMManager.getElementById(fieldId);
  
  // Clear error message and hide error span
  if (errorSpan) {
    DOMManager.setText(errorSpan, '');
    DOMManager.addClass(errorSpan, 'hidden');
    DOMManager.removeClass(errorSpan, 'visible');
  }
  
  // Remove error styling from input using DOMManager
  if (inputElement) {
    DOMManager.removeClass(inputElement, 'border-red-500');
    DOMManager.removeClass(inputElement, 'ring-red-500');
    DOMManager.removeAttribute(inputElement, 'aria-invalid');
  }
  
  // Emit error cleared event
  if (window.eventBus) {
    window.eventBus.emit(EventDefinitions.EVENTS.ERROR.CLEARED, {
      fieldId,
      timestamp: Date.now(),
      source: 'clearError'
    });
  }
}

/**
 * Clears all validation and form-related error messages, visual styling, and ARIA attributes
 * across the entire form using DOMManager for better performance and maintainability.
 *
 * @param {object} elements - Object containing references to DOM elements (from getElementRefs).
 */
export function clearAllErrors(elements) {
  // Get the booking form using DOMManager
  const bookingForm = elements.bookingForm || DOMManager.getElementById('booking-form');
  
  if (!bookingForm) {
    console.warn('Booking form not found for clearing errors');
    return;
  }
  
  // Find all error spans within the form using DOMManager
  const errorSpans = DOMManager.getElements('[id$="-error"]');
  errorSpans.forEach(span => {
    // Only process spans within the booking form
    if (bookingForm.contains(span)) {
      DOMManager.setText(span, '');
      DOMManager.addClass(span, 'hidden');
      DOMManager.removeClass(span, 'visible');
    }
  });
  
  // Find all elements with error styling classes using DOMManager
  const errorInputs = DOMManager.getElements('.ring-red-500, .border-red-500');
  errorInputs.forEach(el => {
    // Only process elements within the booking form
    if (bookingForm.contains(el)) {
      DOMManager.removeClass(el, 'ring-red-500');
      DOMManager.removeClass(el, 'ring-1');
      DOMManager.removeClass(el, 'rounded-md');
      DOMManager.removeClass(el, 'p-1');
      DOMManager.removeClass(el, 'border-red-500');
    }
  });
  
  // Find all elements with aria-invalid attribute using DOMManager
  const invalidElements = DOMManager.getElements('[aria-invalid="true"]');
  invalidElements.forEach(el => {
    if (bookingForm.contains(el)) {
      DOMManager.removeAttribute(el, 'aria-invalid');
    }
  });
  
  // Find all fieldset elements with aria-describedby attribute using DOMManager
  const fieldsets = DOMManager.getElements('fieldset[aria-describedby]');
  fieldsets.forEach(el => {
    if (bookingForm.contains(el)) {
      DOMManager.removeAttribute(el, 'aria-describedby');
    }
  });
  
  // Explicitly clear specific known error indicators
  clearError('submit-button');
  clearError('vehicle_type_oneway');
  clearError('booking-time');
  
  // Emit all errors cleared event
  if (window.eventBus) {
    window.eventBus.emit(EventDefinitions.EVENTS.ERROR.ALL_CLEARED, {
      timestamp: Date.now(),
      source: 'clearAllErrors'
    });
  }
}

/**
 * Enhanced error display function with DOMManager integration
 * @param {string} fieldId - Field ID
 * @param {string} message - Error message
 * @param {string} severity - Error severity level
 */
export function displayFieldError(fieldId, message, severity = ERROR_SEVERITY.ERROR) {
  // Get field and error elements using DOMManager
  const field = DOMManager.getElementById(fieldId);
  const errorElement = DOMManager.getElementById(`${fieldId}-error`);
  
  if (!field) {
    console.warn(`Field ${fieldId} not found for error display`);
    return;
  }
  
  // Create error element if it doesn't exist
  let errorEl = errorElement;
  if (!errorEl) {
    errorEl = DOMManager.createErrorElement(message, severity);
    errorEl.id = `${fieldId}-error`;
    
    // Insert after the field
    const parent = field.parentElement;
    if (parent) {
      DOMManager.appendChild(parent, errorEl);
    }
  } else {
    // Update existing error element
    DOMManager.setText(errorEl, message);
    DOMManager.removeClass(errorEl, 'hidden');
  }
  
  // Apply error styling to field using DOMManager
  DOMManager.addClass(field, 'error');
  DOMManager.addClass(field, 'border-red-500');
  DOMManager.setAttribute(field, 'aria-invalid', 'true');
  DOMManager.setAttribute(field, 'aria-describedby', `${fieldId}-error`);
  
  // Focus field for better UX
  if (field.focus && typeof field.focus === 'function') {
    field.focus();
  }
  
  // Emit error shown event
  if (window.eventBus) {
    window.eventBus.emit(EventDefinitions.EVENTS.ERROR.SHOW, {
      fieldId,
      message,
      severity,
      timestamp: Date.now(),
      source: 'displayFieldError'
    });
  }
}

/**
 * Enhanced error clearing function with DOMManager integration
 * @param {string} fieldId - Field ID
 */
export function clearFieldError(fieldId) {
  // Get field and error elements using DOMManager
  const field = DOMManager.getElementById(fieldId);
  const errorElement = DOMManager.getElementById(`${fieldId}-error`);
  
  if (field) {
    // Remove error styling using DOMManager
    DOMManager.removeClass(field, 'error');
    DOMManager.removeClass(field, 'border-red-500');
    DOMManager.removeClass(field, 'ring-red-500');
    DOMManager.setAttribute(field, 'aria-invalid', 'false');
    DOMManager.removeAttribute(field, 'aria-describedby');
  }
  
  if (errorElement) {
    // Clear and hide error element using DOMManager
    DOMManager.setText(errorElement, '');
    DOMManager.addClass(errorElement, 'hidden');
  }
  
  // Emit error cleared event
  if (window.eventBus) {
    window.eventBus.emit(EventDefinitions.EVENTS.ERROR.CLEAR, {
      fieldId,
      timestamp: Date.now(),
      source: 'clearFieldError'
    });
  }
}

// Legacy functions - keeping for backward compatibility but updating to use DOMManager
function legacyShowError(elements, fieldId, message) {
  const field = elements[fieldId] || DOMManager.getElementById(fieldId);
  const errorElement = elements[`${fieldId}Error`] || DOMManager.getElementById(`${fieldId}-error`);
  
  if (field && errorElement) {
    DOMManager.addClass(field, 'error');
    DOMManager.setAttribute(field, 'aria-invalid', 'true');
    DOMManager.setText(errorElement, message);
    DOMManager.removeClass(errorElement, 'hidden');
    
    // Auto-focus the field for better UX
    if (field.focus && typeof field.focus === 'function') {
      field.focus();
    }
  }
}

function legacyClearError(fieldId) {
  const field = DOMManager.getElementById(fieldId);
  const errorElement = DOMManager.getElementById(`${fieldId}-error`);
  
  if (field) {
    DOMManager.removeClass(field, 'error');
    DOMManager.setAttribute(field, 'aria-invalid', 'false');
  }
  
  if (errorElement) {
    DOMManager.setText(errorElement, '');
    DOMManager.addClass(errorElement, 'hidden');
  }
}

function legacyClearAllErrors(elements) {
  // Use DOMManager to get all form fields
  const formFields = DOMManager.getFormFields();
  
  Object.keys(formFields).forEach(key => {
    const field = formFields[key];
    if (field && field.id) {
      legacyClearError(field.id);
    }
  });
}

// Enhanced event emission function that prioritizes EventBus
export function emitEvent(eventName, data = {}) {
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
  try {
    const customEvent = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(customEvent);
  } catch (error) {
    console.warn('Could not emit custom DOM event:', error);
  }
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
    // Fallback to direct function call using DOMManager
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
    // Fallback to direct function call using DOMManager
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
    // Fallback to direct function call using DOMManager
    const elements = window.elementRefs || {};
    clearAllErrors(elements);
  }
}

// Enhanced EventBus listeners with DOMManager integration
eventBus.on('error:show', ({ fieldId, message, severity = 'error', source = 'unknown' }) => {
  console.log(`EventBus: Showing ${severity} error from ${source} for ${fieldId}: ${message}`);
  
  try {
    // Get elements reference from global store or use DOMManager
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
    clearError(fieldId);
    
  } catch (error) {
    console.error('Error in error:clear listener:', error);
  }
});

eventBus.on('error:global', ({ message, severity, code, dismissable, source, duration }) => {
  console.log(`EventBus: Global error [${severity}] - ${message}`);
  
  // Enhanced global error handling with DOMManager
  try {
    // Create or update global error display
    let globalErrorContainer = DOMManager.getElementById('global-error-container');
    
    if (!globalErrorContainer) {
      globalErrorContainer = DOMManager.createElement('div', {
        id: 'global-error-container',
        class: 'fixed top-4 right-4 z-50 max-w-md'
      });
      DOMManager.appendChild('body', globalErrorContainer);
    }
    
    // Create error notification element
    const errorNotification = DOMManager.createElement('div', {
      class: `alert alert-${severity} mb-2 p-4 rounded-lg shadow-lg`,
      role: 'alert'
    });
    
    DOMManager.setText(errorNotification, message);
    DOMManager.appendChild(globalErrorContainer, errorNotification);
    
    // Auto-dismiss if duration is specified
    if (duration && dismissable) {
      setTimeout(() => {
        DOMManager.removeElement(errorNotification, true);
      }, duration);
    }
    
  } catch (error) {
    console.error('Error in global error display:', error);
    // Fallback to console
    console.error(`Global Error [${severity}]: ${message}`);
  }
});

eventBus.on('error:all:cleared', ({ source }) => {
  console.log(`EventBus: All errors cleared by ${source}`);
  
  try {
    // Clear global error container if it exists
    const globalErrorContainer = DOMManager.getElementById('global-error-container');
    if (globalErrorContainer) {
      DOMManager.setHTML(globalErrorContainer, '');
    }
    
  } catch (error) {
    console.error('Error in error:all:cleared listener:', error);
  }
});

// Initialize error handling with DOMManager
function initErrorHandling() {
  console.log('🚨 Initializing enhanced error handling with DOMManager');
  
  // Ensure DOMManager is available
  if (!DOMManager) {
    console.error('DOMManager not available - error handling may not work properly');
    return;
  }
  
  // Set up global error container
  let globalErrorContainer = DOMManager.getElementById('global-error-container');
  if (!globalErrorContainer) {
    globalErrorContainer = DOMManager.createElement('div', {
      id: 'global-error-container',
      class: 'fixed top-4 right-4 z-50 max-w-md'
    });
    DOMManager.appendChild('body', globalErrorContainer);
  }
  
  console.log('✅ Enhanced error handling initialized with DOMManager');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initErrorHandling);
} else {
  initErrorHandling();
}

// Export legacy functions for backward compatibility
export { legacyShowError, legacyClearError, legacyClearAllErrors };

console.log("🚨 Enhanced Error Handling module loaded with DOMManager integration");
//# sourceMappingURL=errorHandling.js.map
