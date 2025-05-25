// filepath: c:\I love miami Project\AI concierge\src\modules\formSubmission.js
/**
 * formSubmission.js - EventBus-driven Form Submission module
 * 
 * This module handles processing and submitting form data using the EventBus
 * architecture for decoupled, event-driven communication.
 */

import EventBus from '../core/EventBus.js';
import DOMManager from '../core/DOMManager.js';
import { EVENTS } from '../core/EventDefinitions.js';

/**
 * Gathers and structures the form data into a JavaScript object suitable for submission.
 * Includes data specific to the active tab and selected service/experience.
 *
 * @param {object} elements - Object containing references to DOM elements
 * @returns {object} - A data object containing the collected form data
 */
export function processFormData(elements) {
    console.log('📋 Processing form data with DOMManager...');
    
    const formFields = DOMManager.getFormFields();
    
    const dataObject = {
        'from-location': DOMManager.getValue(formFields.fromLocation),
        'to-address': DOMManager.getValue(formFields.toAddress),
        'experience': DOMManager.getValue(formFields.experienceDropdown)
    };
    
    Object.keys(dataObject).forEach(key => {
        if (!dataObject[key]) {
            delete dataObject[key];
        }
    });
    
    return dataObject;
}

/**
 * Validate form data based on service type
 * @param {Object} data - Form data object
 * @param {string} serviceType - Type of service
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateFormData(data, serviceType) {
    const errors = [];
    
    if (!data['from-location']) {
        errors.push('From location is required.');
    }
    
    if (serviceType === 'One Way' && !data['to-address']) {
        errors.push('To address is required for one-way transfers.');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Handles the asynchronous submission of the form data to the configured endpoint.
 * Updates the UI to show loading state and displays confirmation or error messages.
 *
 * @param {object} dataObject - The structured data object to submit
 * @param {object} elements - Object containing references to DOM elements
 * @param {object} config - Application configuration object
 */
export async function sendFormData(dataObject, elements, config) {
    if (!dataObject || Object.keys(dataObject).length === 0) {
        console.warn('No data to submit.');
        return;
    }

    try {
        const response = await fetch(config.submitEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataObject)
        });

        if (!response.ok) {
            throw new Error(`Submission failed with status: ${response.status}`);
        }

        const responseData = await response.json();
        handleSuccessfulSubmission(elements, responseData);
    } catch (error) {
        handleFailedSubmission(elements, error);
    }
}

/**
 * Handle successful form submission
 * @param {Object} elements - DOM elements
 * @param {Object} dataObject - Submitted data
 */
function handleSuccessfulSubmission(elements, dataObject) {
    console.log('✅ Form submitted successfully:', dataObject);
    EventBus.emit(EVENTS.FORM.SUBMISSION_SUCCEEDED, dataObject);
}

/**
 * Handle failed form submission
 * @param {Object} elements - DOM elements
 * @param {Error} error - Error object
 */
function handleFailedSubmission(elements, error) {
    console.error('❌ Form submission failed:', error);
    EventBus.emit(EVENTS.FORM.SUBMISSION_FAILED, { error });
}

/**
 * Set button loading state
 * @param {HTMLElement} button - Button element
 * @param {boolean} isLoading - Whether button is in loading state
 */
export function setButtonLoadingState(button, isLoading) {
    button.disabled = isLoading;
    button.textContent = isLoading ? 'Submitting...' : 'Submit';
}

/**
 * Reset the form to its initial state
 * @param {Object} elements - DOM elements
 */
export function resetForm(elements) {
    DOMManager.setValue(elements.fromLocation, '');
    DOMManager.setValue(elements.toAddress, '');
    DOMManager.setValue(elements.experienceDropdown, '');
}

// Set up event listeners when the module is loaded
function setupEventListeners() {
    EventBus.on(EVENTS.FORM.SUBMIT, async (data) => {
        const elements = data.elements;
        const formData = processFormData(elements);
        const validation = validateFormData(formData, data.serviceType);
        
        if (validation.isValid) {
            setButtonLoadingState(elements.submitButton, true);
            await sendFormData(formData, elements, data.config);
            setButtonLoadingState(elements.submitButton, false);
        } else {
            console.error('Validation errors:', validation.errors);
        }
    });
}

// Initialize event listeners
setupEventListeners();

console.log("📝 EventBus-driven Form Submission module loaded successfully");