/**
 * EventBus Integration Hub - Consolidated event system exports
 */

// Re-export the main EventBus
export { default as eventBus } from './src/core/EventBus.js';
export { default } from './src/core/EventBus.js';

// Re-export all event definitions
export * from './ErrorEvents.js';
export * from './MapEvents.js';
export * from './FormEvents.js';
export * from './UIEvents.js';

// Import for global availability
import eventBus from './src/core/EventBus.js';

// Make globally available
if (typeof window !== 'undefined') {
  window.eventBus = eventBus;
  window.EventBus = eventBus.constructor;
}

// In your maps integration
import { MAP_EVENTS, createLocationObject } from './eventBus.js';

// In your form validation
import { FORM_EVENTS, createFormValidationObject } from './eventBus.js';

// In your UI components
import { UI_EVENTS, createTabChangeObject } from './eventBus.js';

console.log('📡 EventBus integration hub loaded with all event definitions');