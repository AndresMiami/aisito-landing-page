import { eventBus } from '../core/EventBus.js';
import { validateField as validateFieldUtil } from './fieldValidators.js';
import EventDefinitions from '../core/EventDefinitions.js';

/**
 * Validate a single form field with DOMManager integration
 * @param {string} fieldId - Field ID to validate
 * @param {string} value - Field value to validate
 * @param {Object} validationRules - Validation rules for the field
 * @returns {boolean} Validation result
 */
export function validateField(fieldId, value, validationRules = {}) {
    const isValid = validateFieldUtil(fieldId, value, validationRules);
    eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_VALIDATED, { fieldId, isValid });
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
        const fieldValid = validateField(fieldId, value, validationConfig[fieldId]);
        isValid = isValid && fieldValid;
    });

    eventBus.emit(EventDefinitions.EVENTS.FORM.VALIDATED, { formId, isValid });
    return isValid;
}

/**
 * Real-time validation setup for form fields
 * @param {string} formId - Form ID to set up validation for
 * @param {Object} validationConfig - Validation configuration
 */
export function setupRealTimeValidation(formId, validationConfig) {
    const formFields = DOMManager.getElements(`#${formId} input, #${formId} select`);

    formFields.forEach(field => {
        field.addEventListener('input', () => {
            const value = DOMManager.getValue(field);
            validateField(field.id, value, validationConfig[field.id]);
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const validationConfig = {}; // Populate with actual validation rules
        setupRealTimeValidation(form.id, validationConfig);
    });
});