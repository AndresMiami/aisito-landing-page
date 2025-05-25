// filepath: miami-concierge-ai/src/utils/EventValidator.js
/**
 * Utility functions for validating event data before it is emitted.
 */

export function validateEventData(eventName, data) {
    // Basic validation for event data structure
    if (typeof eventName !== 'string' || !eventName) {
        throw new Error('Invalid event name. It must be a non-empty string.');
    }

    if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid event data. It must be a non-null object.');
    }

    // Additional validation rules can be added here based on specific event requirements
    return true; // Return true if validation passes
}

export function validateFormEventData(data) {
    // Example validation for form event data
    if (!data.fieldId || typeof data.fieldId !== 'string') {
        throw new Error('Invalid fieldId in form event data.');
    }

    if (data.message && typeof data.message !== 'string') {
        throw new Error('Invalid message in form event data. It must be a string.');
    }

    return validateEventData('form:event', data); // Call the general event data validation
}

// Additional validation functions for other event types can be added here as needed