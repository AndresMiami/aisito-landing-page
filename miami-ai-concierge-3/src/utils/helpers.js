// filepath: miami-ai-concierge/src/utils/helpers.js
/**
 * helpers.js - Utility functions for the Miami AI Concierge application
 * 
 * This module contains various helper functions that assist with tasks
 * throughout the application, promoting code reuse and maintainability.
 */

/**
 * Capitalizes the first letter of a given string.
 * @param {string} str - The string to capitalize.
 * @returns {string} - The capitalized string.
 */
export function capitalizeFirstLetter(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Debounces a function to limit the rate at which it can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to wait before invoking the function.
 * @returns {Function} - The debounced function.
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttles a function to ensure it is only called at most once in a specified time period.
 * @param {Function} func - The function to throttle.
 * @param {number} limit - The time period in milliseconds.
 * @returns {Function} - The throttled function.
 */
export function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

/**
 * Generates a unique identifier (UUID).
 * @returns {string} - A unique identifier.
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}