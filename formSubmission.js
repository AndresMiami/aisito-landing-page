/**
 * formSubmission.js - EventBus-driven Form Submission module
 * 
 * This module handles processing and submitting form data using the EventBus
 * architecture for decoupled, event-driven communication.
 */

import eventBus from './src/core/EventBus.js';
import { FORM_EVENTS, createSubmissionData, createSubmissionError } from './src/core/FormEvents.js';
import { ERROR_EVENTS, ERROR_SEVERITY } from './ErrorEvents.js';
import { emitError, emitClearError, emitGlobalError } from './errorHandling.js';
import DOMManager from './core/DOMManager.js';
import EventDefinitions from './core/EventDefinitions.js';

/**
 * Gathers and structures the form data into a JavaScript object suitable for submission.
 * Includes data specific to the active tab and selected service/experience.
 *
 * @param {object} elements - Object containing references to DOM elements
 * @returns {object} - A data object containing the collected form data
 */
export function processFormData(elements) {
    console.log('📋 Processing form data with DOMManager...');
    
    // Get form fields using DOMManager
    const formFields = DOMManager.getFormFields();
    
    const dataObject = {
        'from-location': DOMManager.getValue(formFields.fromLocation),
        'to-address': DOMManager.getValue(formFields.toAddress),
        'experience': DOMManager.getValue(formFields.experienceDropdown)
    };
    
    // Clean up empty values
    Object.keys(dataObject).forEach(key => {
        if (!dataObject[key] || dataObject[key].trim() === '') {
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
    
    // Common validation for all service types
    if (!data['from-location']) {
        errors.push({ field: 'from-location', message: 'Pickup location is required' });
    }
    
    // Service-specific validation
    if (serviceType === 'One Way') {
        if (!data['to-address']) {
            errors.push({ field: 'to-address', message: 'Destination address is required' });
        }
        
        if (!data.vehicle_type) {
            errors.push({ field: 'vehicle_type_oneway', message: 'Please select a vehicle type' });
        }
        
        if (data.booking_preference === 'Scheduled') {
            if (!data['pickup-date']) {
                errors.push({ field: 'pickup-date-oneway', message: 'Pickup date is required' });
            }
            
            if (!data['pickup-time']) {
                errors.push({ field: 'pickup-time-oneway', message: 'Pickup time is required' });
            }
        }
    } else if (serviceType === 'Hourly') {
        if (!data['duration-hourly']) {
            errors.push({ field: 'duration-hourly', message: 'Duration is required' });
        }
        
        if (!data['pickup-date']) {
            errors.push({ field: 'pickup-date-hourly', message: 'Pickup date is required' });
        }
        
        if (!data['pickup-time']) {
            errors.push({ field: 'pickup-time-hourly', message: 'Pickup time is required' });
        }
    } else if (serviceType === 'Experience') {
        if (!data.date_preference) {
            errors.push({ field: 'date_preference', message: 'Date preference is required' });
        }
        
        if (!data.name) {
            errors.push({ field: 'name', message: 'Name is required' });
        }
        
        if (!data.email) {
            errors.push({ field: 'email', message: 'Email is required' });
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push({ field: 'email', message: 'Please enter a valid email address' });
        }
        
        if (!data.phone) {
            errors.push({ field: 'phone', message: 'Phone number is required' });
        }
        
        // Wynwood Night specific validation
        if (data.experience_name && data.experience_name.includes('Wynwood')) {
            if (!data.motivation) {
                errors.push({ field: 'motivation', message: 'Please select an occasion' });
            }
            
            if (!data.dinner_style_preference) {
                errors.push({ field: 'dinner_style_preference', message: 'Dinner preference is required' });
            }
            
            if (data.dinner_style_preference === 'Other' && !data.other_restaurant_request) {
                errors.push({ field: 'other_restaurant_request', message: 'Please specify your restaurant request' });
            }
        }
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
export function sendFormData(dataObject, elements, config) {
    // If data is null or empty, don't proceed with submission
    if (!dataObject || Object.keys(dataObject).length === 0) {
        eventBus.emit(FORM_EVENTS.SUBMISSION_CANCELED, {
            reason: 'invalid_data',
            timestamp: Date.now()
        });
        
        emitGlobalError(
            'Form submission canceled: Invalid or missing data',
            ERROR_SEVERITY.ERROR,
            'SUBMISSION_CANCELED',
            true,
            'form-submission',
            5000
        );
        
        return;
    }
    
    // Emit submission started event
    eventBus.emit(FORM_EVENTS.SUBMISSION_STARTED, {
        data: dataObject,
        timestamp: Date.now()
    });
    
    // Emit loading started event
    eventBus.emit(FORM_EVENTS.LOADING_STARTED, {
        buttonId: 'submit-button',
        timestamp: Date.now()
    });
    
    // Set the submit button to a loading state
    setButtonLoadingState(elements.submitButton, true);
    
    // Clear any previous error message for the submit button
    emitClearError('submit-button', 'form-submission');

    // Check if the form submission endpoint is configured
    if (!config.FORM_ENDPOINT || 
        config.FORM_ENDPOINT === "https://formspree.io/your-endpoint" || 
        config.FORM_ENDPOINT === "YOUR_FORMSPREE_ENDPOINT" ) {
        
        // Simulate async behavior before showing dev mode alert
        setTimeout(() => {
            console.warn("Formspree endpoint not configured. Data logged to console instead of submitting.");
            alert("DEV MODE: Form endpoint not set. Data logged to console.\n\n" + JSON.stringify(dataObject, null, 2));
            
            // Emit loading ended event
            eventBus.emit(FORM_EVENTS.LOADING_ENDED, {
                buttonId: 'submit-button',
                timestamp: Date.now()
            });
            
            // Reset button state
            setButtonLoadingState(elements.submitButton, false);
            
            // Emit submission canceled event
            eventBus.emit(FORM_EVENTS.SUBMISSION_CANCELED, {
                reason: 'dev_mode',
                data: dataObject,
                timestamp: Date.now()
            });
        }, 1000);
        
        return;
    }

    // Use the Fetch API to send the form data
    fetch(config.FORM_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(dataObject),
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }).then(response => {
        // Emit loading ended event
        eventBus.emit(FORM_EVENTS.LOADING_ENDED, {
            buttonId: 'submit-button',
            timestamp: Date.now()
        });
        
        // Reset button state
        setButtonLoadingState(elements.submitButton, false);
        
        if (response.ok) {
            // On successful submission
            handleSuccessfulSubmission(elements, dataObject);
        } else {
            // On submission failure
            return response.json().then(data => {
                handleFailedSubmission(elements, response.status, data);
            }).catch(() => {
                // Handle cases where the response is not valid JSON
                handleFailedSubmission(elements, response.status);
            });
        }
    }).catch(error => {
        console.error('Network error during form submission:', error);
        
        // Emit loading ended event
        eventBus.emit(FORM_EVENTS.LOADING_ENDED, {
            buttonId: 'submit-button',
            timestamp: Date.now()
        });
        
        // Reset button state
        setButtonLoadingState(elements.submitButton, false);
        
        // Emit submission failed event
        const submissionError = createSubmissionError(
            'Network Error: Could not connect to the server',
            'NETWORK_ERROR',
            { originalError: error.message },
            'form-submission'
        );
        
        eventBus.emit(FORM_EVENTS.SUBMISSION_FAILED, submissionError);
        
        // Show error message
        emitError(
            'submit-button',
            'Network Error: Could not connect to the server. Please check your internet connection and try again.',
            ERROR_SEVERITY.ERROR,
            'form-submission'
        );
    });
}

/**
 * Handle successful form submission
 * @param {Object} elements - DOM elements
 * @param {Object} dataObject - Submitted data
 */
function handleSuccessfulSubmission(elements, dataObject) {
    // Hide the form content and show confirmation message
    const formContentContainer = elements.bookingForm.closest('.p-6');
    const tabNav = elements.tabNavigationContainer;
    
    if (formContentContainer) formContentContainer.classList.add('hidden');
    if (tabNav) tabNav.classList.add('hidden');
    
    if (elements.confirmationMessage) {
        elements.confirmationMessage.classList.remove('hidden');
        elements.confirmationMessage.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Emit submission succeeded event
    eventBus.emit(FORM_EVENTS.SUBMISSION_SUCCEEDED, {
        data: dataObject,
        timestamp: Date.now()
    });
    
    // Emit confirmation shown event
    eventBus.emit(FORM_EVENTS.CONFIRMATION_SHOWN, {
        timestamp: Date.now()
    });
    
    // Track successful submission with analytics
    eventBus.emit('analytics:track', {
        event: 'form_submitted',
        properties: {
            service_type: dataObject.service_type,
            timestamp: Date.now()
        }
    });
}

/**
 * Handle failed form submission
 * @param {Object} elements - DOM elements
 * @param {number} status - HTTP status code
 * @param {Object} data - Error data from response
 */
function handleFailedSubmission(elements, status, data = {}) {
    // Construct error message
    const errorMessage = data?.errors?.map(err => err.message).join(', ') || 
                         data?.error || 
                         `Submission failed with status ${status}. Please check details and try again.`;
    
    // Create submission error object
    const submissionError = createSubmissionError(
        errorMessage,
        `HTTP_${status}`,
        data,
        'form-submission'
    );
    
    // Emit submission failed event
    eventBus.emit(FORM_EVENTS.SUBMISSION_FAILED, submissionError);
    
    // Show error message
    emitError(
        'submit-button',
        `Submission Error: ${errorMessage}`,
        ERROR_SEVERITY.ERROR,
        'form-submission'
    );
    
    // Track failed submission with analytics
    eventBus.emit('analytics:track', {
        event: 'form_submission_failed',
        properties: {
            error_code: `HTTP_${status}`,
            error_message: errorMessage,
            timestamp: Date.now()
        }
    });
}

/**
 * Set button loading state
 * @param {HTMLElement} button - Button element
 * @param {boolean} isLoading - Whether button is in loading state
 */
export function setButtonLoadingState(button, isLoading) {
    return DOMManager.setButtonLoading(button, isLoading, 'Submitting...');
}

/**
 * Reset the form to its initial state
 * @param {Object} elements - DOM elements
 */
export function resetForm(elements) {
    if (!elements.bookingForm) return;
    
    // Reset the form
    elements.bookingForm.reset();
    
    // Clear all errors
    eventBus.emit(ERROR_EVENTS.CLEAR_ALL, {
        source: 'form-reset'
    });
    
    // Emit form reset event
    eventBus.emit(FORM_EVENTS.FORM_RESET, {
        timestamp: Date.now()
    });
    
    console.log('🔄 Form has been reset');
}

// Set up event listeners when the module is loaded
function setupEventListeners() {
    // Listen for loading started events
    eventBus.on(FORM_EVENTS.LOADING_STARTED, (data) => {
        const button = document.getElementById(data.buttonId);
        if (button) {
            setButtonLoadingState(button, true);
        }
    });
    
    // Listen for loading ended events
    eventBus.on(FORM_EVENTS.LOADING_ENDED, (data) => {
        const button = document.getElementById(data.buttonId);
        if (button) {
            setButtonLoadingState(button, false);
        }
    });
    
    console.log('✅ Form submission event listeners initialized');
}

// Initialize event listeners
setupEventListeners();

// Export default for convenience
export default {
    processFormData,
    sendFormData,
    resetForm
};

console.log("📝 EventBus-driven Form Submission module loaded successfully");