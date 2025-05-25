// This file contains functions for handling and displaying form validation and submission errors.
// It includes integration with the EventBus for error handling, using standardized event names.

import eventBus from '../core/EventBus.js';
import { ERROR_EVENTS, ERROR_SEVERITY } from '../core/ErrorEvents.js';

/**
 * Displays a validation or API error message below a specific form field.
 * Also applies visual styling and ARIA attributes for accessibility.
 *
 * @param {object} elements - Object containing references to DOM elements (from getElementRefs).
 * @param {string} fieldId - The ID of the form field the error is related to.
 * @param {string} message - The error message to display.
 */
export function showError(elements, fieldId, message) {
    const errorSpanId = `${fieldId}-error`;
    const errorSpan = document.getElementById(errorSpanId);
    const inputElement = document.getElementById(fieldId);
    let labelText = fieldId;

    if (fieldId === 'booking-time') {
        labelText = 'Pickup Time Choice';
        const bookingTimeErrorSpan = document.getElementById('booking-time-error');
        if (bookingTimeErrorSpan) {
            bookingTimeErrorSpan.textContent = message;
            bookingTimeErrorSpan.classList.remove('hidden');
        }
        elements.requestNowButton?.classList.add('border-red-500');
        elements.bookLaterButton?.classList.add('border-red-500');
        return;
    }

    if (fieldId === 'vehicle_type_oneway') {
        labelText = 'Vehicle Type';
        const fieldset = document.querySelector('#vehicle-selection-oneway fieldset');
        const fieldsetErrorSpan = fieldset ? fieldset.querySelector('#vehicle-type-oneway-error') : null;
        if (fieldsetErrorSpan) {
            fieldsetErrorSpan.textContent = message;
            fieldsetErrorSpan.classList.remove('hidden');
        }
        if (fieldset) {
            fieldset.classList.add('ring-red-500', 'ring-1', 'rounded-md', 'p-1');
        }
        return;
    }

    const labelElement = document.querySelector(`label[for="${fieldId}"]`) || document.getElementById(`${fieldId}-label`);
    if (labelElement) {
        labelText = labelElement.textContent.replace('*', '').trim();
    } else if (fieldId === 'date_preference') labelText = 'Preferred Timing';
    else if (fieldId === 'motivation') labelText = 'Occasion';
    else if (fieldId === 'dinner_style_preference') labelText = 'Dinner Preference';
    else if (fieldId === 'lounge_interest') labelText = 'Lounge Interest';
    else if (fieldId === 'wynwood-other-restaurant') labelText = 'Other Cuisine / Restaurant Request';
    else if (fieldId === 'pickup-date-oneway') labelText = 'Date';
    else if (fieldId === 'pickup-time-oneway') labelText = 'Time';

    const fullMessage = `${labelText}: ${message}`;

    if (errorSpan) {
        errorSpan.textContent = fullMessage;
        errorSpan.classList.remove('hidden');
    } else {
        console.warn(`Error span not found for ID: ${errorSpanId}. Cannot display error message: "${fullMessage}"`);
    }

    if (inputElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(inputElement.tagName)) {
        inputElement.classList.add('ring-red-500', 'ring-1');
        inputElement.setAttribute('aria-invalid', 'true');

        let describedBy = inputElement.getAttribute('aria-describedby') || '';
        if (!describedBy.includes(errorSpanId)) {
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
    const errorSpans = elements.bookingForm?.querySelectorAll('[id$="-error"]');
    errorSpans?.forEach(span => { span.textContent = ''; span.classList.add('hidden'); });

    const errorInputs = elements.bookingForm?.querySelectorAll('.ring-red-500, .border-red-500');
    errorInputs?.forEach(el => el.classList.remove('ring-red-500', 'ring-1', 'rounded-md', 'p-1', 'border-red-500'));

    elements.bookingForm?.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute('aria-invalid'));
    elements.bookingForm?.querySelectorAll('fieldset[aria-describedby]').forEach(el => el.removeAttribute('aria-describedby'));

    clearError('submit-button');
    clearError('vehicle_type_oneway');
    clearError('booking-time');
}

// EventBus integration - New event-driven error handling
eventBus.on(ERROR_EVENTS.SHOW, ({ fieldId, message, severity = ERROR_SEVERITY.ERROR, source = 'unknown' }) => {
    console.log(`EventBus: Showing ${severity} from ${source} for ${fieldId}: ${message}`);
    const elements = window.elementRefs || {};
    showError(elements, fieldId, message);
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

eventBus.on(ERROR_EVENTS.CLEAR_ALL, ({ source = 'unknown' }) => {
    console.log(`EventBus: Clearing all errors (source: ${source})`);
    const elements = window.elementRefs || {};
    clearAllErrors(elements);
});

eventBus.on(ERROR_EVENTS.CLEAR, ({ fieldId, source = 'unknown' }) => {
    console.log(`EventBus: Clearing error for ${fieldId} (source: ${source})`);
    clearError(fieldId);
});

// Export functions for EventBus-driven error handling
export function emitError(fieldId, message, severity = ERROR_SEVERITY.ERROR, source = 'manual') {
    eventBus.emit(ERROR_EVENTS.SHOW, {
        fieldId,
        message,
        severity,
        source
    });
}

export function emitClearError(fieldId, source = 'manual') {
    eventBus.emit(ERROR_EVENTS.CLEAR, {
        fieldId,
        source
    });
}

export function emitGlobalError(message, severity = ERROR_SEVERITY.ERROR, code = null, dismissable = true, source = 'manual') {
    eventBus.emit(ERROR_EVENTS.GLOBAL, {
        message,
        severity,
        code,
        dismissable,
        source
    });
}

export function emitClearAllErrors(source = 'manual') {
    eventBus.emit(ERROR_EVENTS.CLEAR_ALL, {
        source
    });
}

// Legacy function exports (keeping for backward compatibility)
export { showError, clearError, clearAllErrors };