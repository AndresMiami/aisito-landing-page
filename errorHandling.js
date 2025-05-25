// errorHandling.js
// This module contains functions specifically for handling and displaying
// form validation and submission errors on the dashboard page.

import eventBus from './src/core/EventBus.js';

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

// EventBus integration - New event-driven error handling
eventBus.on('error:show', ({ fieldId, message, severity = 'error', source = 'unknown' }) => {
  console.log(`EventBus: Showing ${severity} from ${source} for ${fieldId}: ${message}`);
  
  // Get elements reference from global store
  const elements = window.elementRefs || {};
  showError(elements, fieldId, message);
  
  // Track error for analytics
  eventBus.emit('analytics:track', {
    event: 'error_shown',
    properties: {
      fieldId,
      message,
      severity,
      source
    }
  });
});

// Add event handler for clearing all errors
eventBus.on('error:clear-all', ({ source = 'unknown' }) => {
  console.log(`EventBus: Clearing all errors (source: ${source})`);
  const elements = window.elementRefs || {};
  clearAllErrors(elements);
});

// Add event handler for clearing a specific error
eventBus.on('error:clear', ({ fieldId, source = 'unknown' }) => {
  console.log(`EventBus: Clearing error for ${fieldId} (source: ${source})`);
  clearError(fieldId);
});

// Export functions for EventBus-driven error handling
export function emitError(fieldId, message, severity = 'error', source = 'manual') {
  eventBus.emit('error:show', {
    fieldId,
    message,
    severity,
    source
  });
}

export function emitClearError(fieldId, source = 'manual') {
  eventBus.emit('error:clear', {
    fieldId,
    source
  });
}

export function emitGlobalError(message, severity = 'error', code = null, dismissable = true, source = 'manual') {
  eventBus.emit('error:global', {
    message,
    severity,
    code,
    dismissable,
    source
  });
}

export function emitClearAllErrors(source = 'manual') {
  eventBus.emit('error:clear-all', {
    source
  });
}

// Legacy function exports (keeping for backward compatibility)
export { showError, clearError, clearAllErrors };
