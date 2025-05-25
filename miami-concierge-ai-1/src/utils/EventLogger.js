// filepath: miami-concierge-ai/src/utils/EventLogger.js
/**
 * EventLogger.js
 * Utility functions for logging events emitted through the EventBus.
 */

import { eventBus } from '../core/EventBus';

/**
 * Logs an event when it is emitted through the EventBus.
 * 
 * @param {string} eventName - The name of the event being logged.
 * @param {object} data - The data associated with the event.
 */
export function logEvent(eventName, data) {
    console.log(`📡 Event Logged: ${eventName}`, data);
}

/**
 * Initializes event logging by subscribing to all events emitted through the EventBus.
 */
export function initializeEventLogging() {
    eventBus.on('*', (event) => {
        logEvent(event.name, event.data);
    });
}