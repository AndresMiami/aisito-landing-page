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

/**
 * Gathers and structures the form data into a JavaScript object suitable for submission.
 * Includes data specific to the active tab and selected service/experience.
 *
 * @param {object} elements - Object containing references to DOM elements
 * @returns {object} - A data object containing the collected form data
 */
export function processFormData(elements) {
    console.log('📋 Processing form data...');
    
    // Emit event that form data processing has started
    eventBus.emit(FORM_EVENTS.DATA_PROCESSED, {
        status: 'started',
        timestamp: Date.now()
    });
    
    // Ensure the bookingForm element exists before creating FormData
    if (!elements.bookingForm) {
        const error = 'Booking form element not found. Cannot process form data.';
        console.error(error);
        
        // Emit error events
        eventBus.emit(FORM_EVENTS.DATA_INVALID, {
            error,
            timestamp: Date.now()
        });
        
        eventBus.emit(ERROR_EVENTS.GLOBAL, {
            message: 'Could not process form: Form element not found',
            severity: ERROR_SEVERITY.ERROR,
            code: 'FORM_NOT_FOUND',
            source: 'form-submission'
        });
        
        return {}; // Return an empty object
    }

    const formData = new FormData(elements.bookingForm);
    let serviceType = '';
    
    // Find the currently active tab button element
    const activeTabButton = elements.tabNavigationContainer?.querySelector('.active-tab');
    const activePanelId = activeTabButton ? activeTabButton.getAttribute('data-tab-target') : null;

    // Start building the data object with the 'From' location
    const dataObject = {
        'from-location': formData.get('from-location')?.trim(),
    };

    // Add data specific to the One-Way tab if it's the active panel
    if (activePanelId === '#panel-oneway') {
        serviceType = 'One Way';
        dataObject.service_type = serviceType;
        dataObject['to-address'] = formData.get('to-address')?.trim();
        dataObject.vehicle_type = formData.get('vehicle_type_oneway');

        // Add booking preference and conditional date/time
        dataObject.booking_preference = formData.get('booking_preference');
        if (dataObject.booking_preference === 'Scheduled') {
            dataObject['pickup-date'] = formData.get('pickup-date-oneway');
            dataObject['pickup-time'] = formData.get('pickup-time-oneway');
        }
    } else if (activePanelId === '#panel-experience-plus') {
        // Data processing for Experience+ tab
        const selectedServiceValue = elements.serviceDropdown.value;
        if (selectedServiceValue === 'hourly_chauffeur') {
            serviceType = 'Hourly';
            dataObject.service_type = serviceType;
            dataObject.experience_name = "Hourly Chauffeur";
            dataObject['duration-hourly'] = formData.get('duration-hourly');
            dataObject['pickup-date'] = formData.get('pickup-date-hourly');
            dataObject['pickup-time'] = formData.get('pickup-time-hourly');
        } else if (selectedServiceValue) {
            serviceType = 'Experience';
            dataObject.service_type = serviceType;
            dataObject.experience_name = elements.serviceDropdown.options[elements.serviceDropdown.selectedIndex].text;
            dataObject.date_preference = formData.get('date_preference');
            dataObject.name = formData.get('name')?.trim();
            dataObject.guests = formData.get('guests');
            dataObject.email = formData.get('email')?.trim();
            dataObject.phone = formData.get('phone')?.trim();

            // Add data specific to the Wynwood Night experience
            if (selectedServiceValue === 'wynwood_night') {
                dataObject.motivation = formData.get('motivation');
                dataObject.dinner_style_preference = formData.get('dinner_style_preference');
                if (formData.get('dinner_style_preference') === 'Other') {
                    dataObject.other_restaurant_request = formData.get('other_restaurant_request')?.trim();
                }
                dataObject.lounge_interest = formData.get('lounge_interest');
            }
        }
    }

    // Clean up the data object by removing empty values
    Object.keys(dataObject).forEach(key => {
        if (dataObject[key] === null || dataObject[key] === undefined || dataObject[key] === '') {
            if (key === 'other_restaurant_request' && dataObject.dinner_style_preference !== 'Other') {
                delete dataObject[key];
            } else if (key !== 'other_restaurant_request') {
                delete dataObject[key];
            }
        }
    });

    // Validate required fields based on service type
    const validationResult = validateFormData(dataObject, serviceType);
    if (!validationResult.isValid) {
        // Emit data invalid event with validation errors
        eventBus.emit(FORM_EVENTS.DATA_INVALID, {
            errors: validationResult.errors,
            data: dataObject,
            serviceType,
            timestamp: Date.now()
        });
        
        // Show validation errors
        validationResult.errors.forEach(error => {
            emitError(error.field, error.message, ERROR_SEVERITY.ERROR, 'form-validation');
        });
        
        return null; // Return null to indicate invalid data
    }

    // Create submission data object
    const submissionData = createSubmissionData(dataObject, serviceType);
    
    // Emit event that form data processing is complete
    eventBus.emit(FORM_EVENTS.DATA_PROCESSED, {
        status: 'completed',
        data: submissionData,
        timestamp: Date.now()
    });

    console.log("📋 Final Data Object for Submission:", dataObject);
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
function setButtonLoadingState(button, isLoading) {
    if (!button) return;
    
    const spinner = button.querySelector('.spinner') || button.querySelector('.loading-spinner');
    const text = button.querySelector('.button-text') || button.querySelector('.text');
    
    button.disabled = isLoading;
    
    if (spinner) {
        spinner.classList.toggle('hidden', !isLoading);
    }
    
    if (text) {
        text.classList.toggle('hidden', isLoading);
    }
    
    if (isLoading) {
        button.setAttribute('aria-busy', 'true');
    } else {
        button.removeAttribute('aria-busy');
    }
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