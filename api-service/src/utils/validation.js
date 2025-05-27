// filepath: api-service/src/utils/validation.js
/**
 * validation.js - Utility functions for validating input data
 * 
 * This module provides functions for validating form inputs and ensuring
 * data integrity before making API calls.
 */

/**
 * Validate a booking form input
 * @param {Object} bookingData - The booking data to validate
 * @returns {Object} - Validation result with isValid flag and errors array
 */
export function validateBookingData(bookingData) {
    const errors = [];
    let isValid = true;

    if (!bookingData.date) {
        isValid = false;
        errors.push('Date is required.');
    }

    if (!bookingData.vehicleId) {
        isValid = false;
        errors.push('Vehicle ID is required.');
    }

    if (!bookingData.location) {
        isValid = false;
        errors.push('Location is required.');
    }

    return { isValid, errors };
}

/**
 * Validate a vehicle selection
 * @param {string} vehicleId - The ID of the selected vehicle
 * @returns {Object} - Validation result with isValid flag and errors array
 */
export function validateVehicleSelection(vehicleId) {
    const errors = [];
    let isValid = true;

    if (!vehicleId) {
        isValid = false;
        errors.push('Vehicle selection is required.');
    }

    return { isValid, errors };
}

/**
 * Validate a location input
 * @param {string} location - The location to validate
 * @returns {Object} - Validation result with isValid flag and errors array
 */
export function validateLocation(location) {
    const errors = [];
    let isValid = true;

    if (!location) {
        isValid = false;
        errors.push('Location is required.');
    } else if (location.length < 3) {
        isValid = false;
        errors.push('Location must be at least 3 characters long.');
    }

    return { isValid, errors };
}