export function validateRequiredField(value) {
    return value && value.trim() !== '';
}

export function validateEmailField(value) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
}

export function validatePhoneField(value) {
    const phonePattern = /^\+?[1-9]\d{1,14}$/; // E.164 format
    return phonePattern.test(value);
}

export function validateLocationField(value) {
    return validateRequiredField(value); // Assuming location is required
}

export function validateVehicleSelection(value) {
    return value !== 'none'; // Assuming 'none' is a placeholder for no selection
}

export function validateDateTimeField(value) {
    return !isNaN(Date.parse(value)); // Check if the date is valid
}

export function validatePassengerCount(value) {
    const count = parseInt(value, 10);
    return count > 0; // Must be greater than 0
}

export function validateDuration(value) {
    const duration = parseInt(value, 10);
    return duration > 0; // Must be greater than 0
}