// filepath: miami-ai-concierge/src/modules/formValidation.js
/**
 * formValidation.js - Enhanced form validation with DOMManager integration
 * This module handles form field validation using centralized DOM operations
 * and event-driven architecture for better maintainability.
 */

import DOMManager from '../core/DOMManager.js';
import eventBus from '../core/EventBus.js';
import { EVENTS } from '../core/EventDefinitions.js';

/**
 * Validate a single form field with DOMManager integration
 * @param {string} fieldId - Field ID to validate
 * @param {string} value - Field value to validate
 * @param {Object} validationRules - Validation rules for the field
 * @returns {boolean} Validation result
 */
export function validateField(fieldId, value, validationRules = {}) {
    let isValid = true;
    const errors = [];

    // Example validation rules
    if (validationRules.required && !value) {
        isValid = false;
        errors.push(`${getFieldLabel(fieldId)} is required.`);
    }

    if (validationRules.minLength && value.length < validationRules.minLength) {
        isValid = false;
        errors.push(`${getFieldLabel(fieldId)} must be at least ${validationRules.minLength} characters long.`);
    }

    // Emit validation result
    eventBus.emit(EVENTS.FORM.FIELD_VALIDATED, { fieldId, isValid, errors });
    return isValid;
}

/**
 * Validate entire form with DOMManager integration
 * @param {string} formId - Form ID to validate
 * @param {Object} validationConfig - Validation configuration object
 * @returns {boolean} Overall form validation result
 */
export function validateForm(formId, validationConfig = {}) {
    const formFields = DOMManager.getElements(`#${formId} input, #${formId} select`);
    let isValid = true;

    formFields.forEach(field => {
        const fieldId = field.id;
        const value = DOMManager.getValue(field);
        const rules = validationConfig[fieldId] || {};
        const fieldIsValid = validateField(fieldId, value, rules);
        isValid = isValid && fieldIsValid;
    });

    // Emit overall validation result
    eventBus.emit(EVENTS.FORM.VALIDATED, { formId, isValid });
    return isValid;
}

/**
 * Get field label for error messages
 * @param {string} fieldId - Field ID
 * @returns {string} Field label
 */
function getFieldLabel(fieldId) {
    const labelElement = DOMManager.getElement(`label[for="${fieldId}"]`);
    return labelElement ? DOMManager.getValue(labelElement) : fieldId;
}

// Initialize validation system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Setup real-time validation or other initialization logic here
});