import { EventBus } from '../../core/EventBus.js';
import { EVENT_DEFINITIONS } from '../../core/EventDefinitions.js';

/**
 * apiClient.js - Handles API requests and responses for the Miami Concierge application.
 */

const API_BASE_URL = 'https://api.miamiconcierge.com'; // Replace with actual API base URL

/**
 * Makes a GET request to the specified endpoint.
 * @param {string} endpoint - The API endpoint to call.
 * @returns {Promise<Object>} - The response data.
 */
export async function get(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        EventBus.emit(EVENT_DEFINITIONS.EVENTS.ANALYTICS.TRACK, {
            event: 'API Request',
            endpoint,
            status: 'success'
        });
        return data;
    } catch (error) {
        EventBus.emit(EVENT_DEFINITIONS.EVENTS.ERROR.SHOW, {
            message: error.message,
            severity: 'error'
        });
        throw error;
    }
}

/**
 * Makes a POST request to the specified endpoint with the provided data.
 * @param {string} endpoint - The API endpoint to call.
 * @param {Object} data - The data to send in the request body.
 * @returns {Promise<Object>} - The response data.
 */
export async function post(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        EventBus.emit(EVENT_DEFINITIONS.EVENTS.ANALYTICS.TRACK, {
            event: 'API Request',
            endpoint,
            status: 'success'
        });
        return responseData;
    } catch (error) {
        EventBus.emit(EVENT_DEFINITIONS.EVENTS.ERROR.SHOW, {
            message: error.message,
            severity: 'error'
        });
        throw error;
    }
}