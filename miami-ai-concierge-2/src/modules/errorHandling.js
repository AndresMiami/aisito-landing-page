// filepath: c:\I love miami Project\AI concierge\src\modules\errorHandling.js
/**
 * errorHandling.js - Enhanced error handling with DOMManager integration
 * This module contains functions specifically for handling and displaying
 * form validation and submission errors on the dashboard page.
 */

import DOMManager from '../core/DOMManager.js';
import eventBus from '../core/EventBus.js';
import { EVENTS } from '../core/EventDefinitions.js';

/**
 * Displays a validation or API error message below a specific form field.
 * Also applies visual styling and ARIA attributes for accessibility.
 *
 * @param {object} elements - Object containing references to DOM elements.
 * @param {string} fieldId - The ID of the form field the error is related to.
 * @param {string} message - The error message to display.
 */
export function showError(elements, fieldId, message) {
    const fieldElement = DOMManager.getElementById(fieldId);
    if (fieldElement) {
        const errorElement = DOMManager.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerText = message;
        DOMManager.setAttribute(errorElement, 'role', 'alert');
        fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
    }
}

/**
 * Clears the error message, visual styling, and ARIA attributes for a specific form field.
 *
 * @param {string} fieldId - The ID of the form field to clear the error for.
 */
export function clearError(fieldId) {
    const errorElement = DOMManager.getElement(`.${fieldId}-error`);
    if (errorElement) {
        DOMManager.removeElement(errorElement);
    }
}

/**
 * Clears all validation and form-related error messages across the entire form.
 *
 * @param {object} elements - Object containing references to DOM elements.
 */
export function clearAllErrors(elements) {
    const errorMessages = DOMManager.getElements('.error-message');
    errorMessages.forEach(error => {
        DOMManager.removeElement(error);
    });
}

/**
 * Enhanced error display function with DOMManager integration.
 * @param {string} fieldId - Field ID.
 * @param {string} message - Error message.
 * @param {string} severity - Error severity level.
 */
export function displayFieldError(fieldId, message, severity = 'error') {
    showError({ fieldId }, fieldId, message);
    eventBus.emit(EVENTS.ERROR.SHOW, { fieldId, message, severity });
}

/**
 * Enhanced error clearing function with DOMManager integration.
 * @param {string} fieldId - Field ID.
 */
export function clearFieldError(fieldId) {
    clearError(fieldId);
    eventBus.emit(EVENTS.ERROR.CLEAR, { fieldId });
}

// Initialize error handling with DOMManager
function initErrorHandling() {
    eventBus.on(EVENTS.ERROR.SHOW, ({ fieldId, message }) => {
        displayFieldError(fieldId, message);
    });

    eventBus.on(EVENTS.ERROR.CLEAR, ({ fieldId }) => {
        clearFieldError(fieldId);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initErrorHandling);
} else {
    initErrorHandling();
}

console.log("🚨 Enhanced Error Handling module loaded with DOMManager integration");