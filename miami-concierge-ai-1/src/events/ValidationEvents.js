// filepath: c:\I love miami Project\AI concierge\src\events\ValidationEvents.js
// ValidationEvents.js
// This module defines events specifically for validation processes.

export const VALIDATION_SUCCESS = 'validation:success';
export const VALIDATION_FAILURE = 'validation:failure';
export const VALIDATION_REQUESTED = 'validation:requested';

/**
 * Emit a validation success event.
 * @param {object} data - The data related to the validation success.
 */
export function emitValidationSuccess(data) {
    window.eventBus.emit(VALIDATION_SUCCESS, data);
}

/**
 * Emit a validation failure event.
 * @param {object} data - The data related to the validation failure.
 */
export function emitValidationFailure(data) {
    window.eventBus.emit(VALIDATION_FAILURE, data);
}

/**
 * Emit a validation requested event.
 * @param {object} data - The data related to the validation request.
 */
export function emitValidationRequested(data) {
    window.eventBus.emit(VALIDATION_REQUESTED, data);
}