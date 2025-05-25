// This file serves as the entry point for the application. 
// It initializes the application and sets up any necessary configurations or event listeners.

import eventBus from './core/EventBus.js';
import { ERROR_EVENTS } from './core/ErrorEvents.js';

// Initialize the application
function initApp() {
    console.log('Application initialized.');

    // Set up event listeners
    eventBus.on(ERROR_EVENTS.SHOW, (data) => {
        console.log('Error event received:', data);
        // Handle the error display logic here
    });

    eventBus.on(ERROR_EVENTS.CLEAR, (data) => {
        console.log('Clear error event received for:', data.fieldId);
        // Handle the error clearing logic here
    });

    eventBus.on(ERROR_EVENTS.CLEAR_ALL, () => {
        console.log('Clear all errors event received.');
        // Handle the logic to clear all errors here
    });

    // Additional initialization logic can go here
}

// Start the application
initApp();