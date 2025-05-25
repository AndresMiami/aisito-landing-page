// filepath: c:\I love miami Project\AI concierge\src\utils\constants.js

export const SERVICE_TYPES = {
    ONE_WAY: 'One Way',
    HOURLY_CHAUFFEUR: 'Hourly Chauffeur',
    YACHT_BOAT: 'Yacht & Boat',
    MIAMI_RELOCATION: 'Miami Relocation',
    TOURS_EXCURSIONS: 'Tours & Excursions',
    AIRPORT_TRANSFER: 'Airport Transfer'
};

export const ERROR_SEVERITY = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
};

export const API_ENDPOINTS = {
    SUBMISSION: '/api/bookings',
    LOCATION_AUTOCOMPLETE: '/api/location/autocomplete',
    VALIDATION: '/api/validation'
};

export const EVENT_NAMES = {
    FORM_SUBMITTED: 'form:submitted',
    FORM_VALIDATED: 'form:validated',
    ERROR_SHOWN: 'error:shown',
    ERROR_CLEARED: 'error:cleared'
};