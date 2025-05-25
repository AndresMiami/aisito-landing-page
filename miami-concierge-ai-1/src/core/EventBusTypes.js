// filepath: c:\I love miami Project\AI concierge\src\core\EventBusTypes.js
// EventBusTypes.js
// This module defines types or interfaces related to events for the EventBus system.

export const EventTypes = {
    ERROR_SHOW: 'error:show',
    ERROR_CLEAR: 'error:clear',
    ERROR_CLEAR_ALL: 'error:clear-all',
    ERROR_GLOBAL: 'error:global',
    FORM_FIELD_CHANGED: 'form:field-changed',
    FORM_VALIDATION_REQUESTED: 'form:validation-requested',
    FORM_VALID: 'form:valid',
    FORM_INVALID: 'form:invalid',
    VEHICLE_SELECTION_READY: 'vehicle:selection-ready',
    VEHICLE_SELECTED: 'vehicle:selected',
    PRICING_UPDATED: 'pricing:updated',
};

// You can add more event types as needed for your application.