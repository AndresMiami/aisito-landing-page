// filepath: miami-concierge-ai/src/events/FormEvents.js
export const FORM_SUBMIT = 'form:submit';
export const FORM_VALIDATION_REQUESTED = 'form:validation-requested';
export const FORM_VALIDATION_SUCCESS = 'form:valid';
export const FORM_VALIDATION_FAILURE = 'form:invalid';
export const FIELD_CHANGED = 'form:field-changed';
export const ERROR_SHOW = 'error:show';
export const ERROR_CLEAR = 'error:clear';

// Function to emit form submission event
export function emitFormSubmit(data) {
    window.eventBus.emit(FORM_SUBMIT, data);
}

// Function to emit validation request event
export function emitValidationRequested(data) {
    window.eventBus.emit(FORM_VALIDATION_REQUESTED, data);
}

// Function to emit validation success event
export function emitValidationSuccess(data) {
    window.eventBus.emit(FORM_VALIDATION_SUCCESS, data);
}

// Function to emit validation failure event
export function emitValidationFailure(data) {
    window.eventBus.emit(FORM_VALIDATION_FAILURE, data);
}

// Function to emit field change event
export function emitFieldChanged(data) {
    window.eventBus.emit(FIELD_CHANGED, data);
}

// Function to emit error show event
export function emitErrorShow(data) {
    window.eventBus.emit(ERROR_SHOW, data);
}

// Function to emit error clear event
export function emitErrorClear(data) {
    window.eventBus.emit(ERROR_CLEAR, data);
}