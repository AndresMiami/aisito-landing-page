export function validateExperienceSelection(selectedExperience) {
    const validExperiences = ['yacht', 'relocation', 'tours', 'airport_transfer'];
    return validExperiences.includes(selectedExperience);
}

export function validateLocation(location) {
    if (!location || location.trim() === '') {
        return { isValid: false, message: 'Location cannot be empty.' };
    }
    return { isValid: true };
}

export function validateDateTime(dateTime) {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) {
        return { isValid: false, message: 'Invalid date and time.' };
    }
    return { isValid: true };
}

export function validatePassengerCount(count) {
    if (count <= 0) {
        return { isValid: false, message: 'Passenger count must be greater than zero.' };
    }
    return { isValid: true };
}