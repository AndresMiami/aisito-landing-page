// errorHandling.js
// This module contains functions specifically for handling and displaying
// form validation and submission errors on the dashboard page.

import eventBus from './src/core/EventBus.js';
import { ERROR_EVENTS, ERROR_SEVERITY } from './ErrorEvents.js';

/**
 * Displays a validation or API error message below a specific form field.
 * Also applies visual styling and ARIA attributes for accessibility.
 *
 * @param {object} elements - Object containing references to DOM elements (from getElementRefs).
 * @param {string} fieldId - The ID of the form field the error is related to.
 * @param {string} message - The error message to display.
 */
export function showError(elements, fieldId, message) {
    const errorSpanId = `${fieldId}-error`; // Construct the ID of the error message span
    const errorSpan = document.getElementById(errorSpanId); // Get the error span element
    // Get the input element by ID; might be null for radio/button groups where error is on a container/fieldset
    const inputElement = document.getElementById(fieldId);
    let labelText = fieldId; // Default label text if no corresponding label found

    // --- Specific handling for different field types ---
    // Handle validation message display and styling for the Booking Time button group
    if (fieldId === 'booking-time') {
         labelText = 'Pickup Time Choice'; // Use a descriptive label for this group
         const bookingTimeErrorSpan = document.getElementById('booking-time-error'); // Get the specific error span for the buttons
         if (bookingTimeErrorSpan) {
             bookingTimeErrorSpan.textContent = message; // Display the error message directly
             bookingTimeErrorSpan.classList.remove('hidden'); // Make the error message visible
         }
         // Add error styling to the buttons or their container to highlight the issue
         elements.requestNowButton?.classList.add('border-red-500');
         elements.bookLaterButton?.classList.add('border-red-500');
         return; // Exit the function after handling this specific case
     }

    // Handle validation message display and styling for the Vehicle Type radio button group
    if (fieldId === 'vehicle_type_oneway') {
       labelText = 'Vehicle Type'; // Use a descriptive label for this group
       const fieldset = document.querySelector('#vehicle-selection-oneway fieldset'); // Find the fieldset container for the radio buttons
       const fieldsetErrorSpan = fieldset ? fieldset.querySelector('#vehicle-type-oneway-error') : null; // Find the associated error span within the fieldset
       if (fieldsetErrorSpan) {
           fieldsetErrorSpan.textContent = message; // Display the error message
           fieldsetErrorSpan.classList.remove('hidden'); // Make the error message visible
       }
       if (fieldset) {
           // Apply styling to the fieldset to indicate an error within the group
           fieldset.classList.add('ring-red-500', 'ring-1', 'rounded-md', 'p-1');
       }
       return; // Exit the function after handling this specific case
    }

    // --- General handling for standard inputs (text, select, textarea, etc.) ---
    // Attempt to find a label element associated with the input for a more user-friendly error message
    const labelElement = document.querySelector(`label[for="${fieldId}"]`) || document.getElementById(`${fieldId}-label`);
    if (labelElement) {
        // Use the label's text content, removing potential '*' for required fields and trimming whitespace
        labelText = labelElement.textContent.replace('*', '').trim();
    }
    // Fallback labels for specific fields if a standard label[for] or id-label is not found
    else if (fieldId === 'date_preference') labelText = 'Preferred Timing';
    else if (fieldId === 'motivation') labelText = 'Occasion';
    else if (fieldId === 'dinner_style_preference') labelText = 'Dinner Preference';
    else if (fieldId === 'lounge_interest') labelText = 'Lounge Interest';
    else if (fieldId === 'wynwood-other-restaurant') labelText = 'Other Cuisine / Restaurant Request';
    else if (fieldId === 'pickup-date-oneway') labelText = 'Date'; // Label for the one-way pickup date input
    else if (fieldId === 'pickup-time-oneway') labelText = 'Time'; // Label for the one-way pickup time input


    // Construct the full error message including the field label for clarity
    const fullMessage = `${labelText}: ${message}`;

    // Display the message in the designated error span if it exists
    if (errorSpan) {
      errorSpan.textContent = fullMessage; // Set the text content of the error span
      errorSpan.classList.remove('hidden'); // Make the error message visible
    } else {
        // Log a warning if the expected error span element is missing from the HTML
        console.warn(`Error span not found for ID: ${errorSpanId}. Cannot display error message: "${fullMessage}"`);
    }

    // Apply visual styling and ARIA attributes to the input element itself to highlight the error and improve accessibility
    if (inputElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(inputElement.tagName)) {
      inputElement.classList.add('ring-red-500', 'ring-1'); // Add a red ring around the input field
      inputElement.setAttribute('aria-invalid', 'true'); // Set ARIA attribute to indicate the input has an invalid value

      // Update the aria-describedby attribute to link the input element to its error message for screen readers
      let describedBy = inputElement.getAttribute('aria-describedby') || ''; // Get existing aria-describedby value
      if (!describedBy.includes(errorSpanId)) {
           // Add the current error span's ID to aria-describedby, ensuring previous IDs are kept if they exist
          inputElement.setAttribute('aria-describedby', describedBy ? `${describedBy} ${errorSpanId}` : errorSpanId);
      }
    }
}

/**
 * Clears the error message, visual styling, and ARIA attributes for a specific form field.
 *
 * @param {string} fieldId - The ID of the form field to clear the error for.
 */
export function clearError(fieldId) {
    const errorSpanId = `${fieldId}-error`;
    const errorSpan = document.getElementById(errorSpanId);
    const inputElement = document.getElementById(fieldId);

    if (errorSpan) {
        errorSpan.textContent = '';
        errorSpan.classList.add('hidden');
    }

    if (inputElement) {
        inputElement.classList.remove('ring-red-500', 'ring-1');
        inputElement.removeAttribute('aria-invalid');
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
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    });
    
    // Emit success confirmation
    emitEvent('error:shown:confirmed', {
      fieldId,
      severity,
      source
    });
    
  } catch (error) {
    console.error('Error handling error:show event:', error);
    // Emit error event for this failure
    emitEvent('error:handler:failed', {
      originalEvent: 'error:show',
      fieldId,
      error: error.message
    });
  }
});

eventBus.on('error:clear', ({ fieldId, source = 'unknown' }) => {
  console.log(`EventBus: Clearing error for ${fieldId} (source: ${source})`);
  
  try {
    clearError(fieldId);
    
    // Emit confirmation
    emitEvent('error:cleared:confirmed', {
      fieldId,
      source
    });
    
  } catch (error) {
    console.error('Error handling error:clear event:', error);
  }
});

eventBus.on('error:clear-all', ({ source = 'unknown' }) => {
  console.log(`EventBus: Clearing all errors (source: ${source})`);
  
  try {
    const elements = window.elementRefs || {};
    clearAllErrors(elements);
    
    // Emit confirmation
    emitEvent('error:all:cleared:confirmed', {
      source,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Error handling error:clear-all event:', error);
  }
});

// Enhanced global error handler with UI implementation
eventBus.on('error:global', ({ message, severity = 'error', code = null, dismissable = true, source = 'unknown', duration = null }) => {
  console.log(`EventBus: Global ${severity} error from ${source}: ${message}`);
  
  try {
    // Create or update global error display
    showGlobalErrorUI(message, severity, code, dismissable, duration);
    
    // Track global error
    eventBus.emit('analytics:track', {
      event: 'global_error_shown',
      properties: {
        message,
        severity,
        code,
        source,
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('Error handling global error event:', error);
    // Ultimate fallback
    alert(`${severity.toUpperCase()}: ${message}`);
  }
});

// Implementation for global error UI
function showGlobalErrorUI(message, severity, code, dismissable, duration) {
  // Find or create global error container
  let errorContainer = document.getElementById('global-error-container');
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.id = 'global-error-container';
    errorContainer.className = 'fixed top-4 right-4 z-50 max-w-md';
    document.body.appendChild(errorContainer);
  }
  
  // Create error element
  const errorElement = document.createElement('div');
  errorElement.className = `global-error mb-4 p-4 rounded-lg shadow-lg ${getSeverityClasses(severity)}`;
  
  // Add error content
  errorElement.innerHTML = `
    <div class="flex items-start">
      <div class="flex-shrink-0">
        ${getSeverityIcon(severity)}
      </div>
      <div class="ml-3 flex-1">
        <p class="text-sm font-medium">${message}</p>
        ${code ? `<p class="text-xs opacity-75 mt-1">Error Code: ${code}</p>` : ''}
      </div>
      ${dismissable ? `
        <div class="ml-4 flex-shrink-0">
          <button class="error-dismiss text-white hover:opacity-75 focus:outline-none" aria-label="Dismiss">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      ` : ''}
    </div>
  `;
  
  // Add dismiss handler
  if (dismissable) {
    const dismissButton = errorElement.querySelector('.error-dismiss');
    dismissButton.addEventListener('click', () => {
      errorElement.remove();
      emitEvent('error:global:dismissed', { code, severity });
    });
    
    // Auto-dismiss if duration provided
    if (duration) {
      setTimeout(() => {
        if (errorElement.parentNode) {
          errorElement.remove();
          emitEvent('error:global:auto-dismissed', { code, severity, duration });
        }
      }, duration);
    }
  }
  
  // Add to container
  errorContainer.appendChild(errorElement);
  
  return errorElement;
}

// Helper functions for UI styling
function getSeverityClasses(severity) {
  switch (severity) {
    case ERROR_SEVERITY.SUCCESS:
      return 'bg-green-500 text-white';
    case ERROR_SEVERITY.WARNING:
      return 'bg-yellow-500 text-white';
    case ERROR_SEVERITY.INFO:
      return 'bg-blue-500 text-white';
    case ERROR_SEVERITY.CRITICAL:
      return 'bg-red-700 text-white';
    default:
      return 'bg-red-500 text-white';
  }
}

function getSeverityIcon(severity) {
  const iconClass = 'h-5 w-5';
  switch (severity) {
    case ERROR_SEVERITY.SUCCESS:
      return `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
    case ERROR_SEVERITY.WARNING:
      return `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`;
    case ERROR_SEVERITY.INFO:
      return `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`;
    default:
      return `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`;
  }
}

// Initialize error handling system
console.log('🚨 Error handling system initialized with enhanced EventBus integration');

// Export the enhanced emitEvent function
export { emitEvent };

// ...existing exports...
