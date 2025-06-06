/**
 * Bridge - Connects existing code with the new event-driven architecture
 * Provides compatibility functions for gradual migration
 */
import eventBus from '../../eventBus.js';

// Map DOM events to EventBus events for gradual migration
export function connectDOMToEventBus(element, domEvent, eventBusEvent, dataTransformer = null) {
  if (!element) {
    console.warn(`Element not found for DOM-EventBus connection: ${eventBusEvent}`);
    return () => {}; // Return empty cleanup function
  }
  
  const handler = (e) => {
    const data = dataTransformer ? dataTransformer(e) : e;
    eventBus.publish(eventBusEvent, data);
  };
  
  element.addEventListener(domEvent, handler);
  
  // Return cleanup function
  return () => element.removeEventListener(domEvent, handler);
}

// Function to wrap legacy functions to publish events when called
export function wrapLegacyFunction(func, eventName, context = null) {
  return function(...args) {
    const result = func.apply(context || this, args);
    eventBus.publish(eventName, { args, result });
    return result;
  };
}

// Connect experience dropdown changes to EventBus
export function connectExperienceDropdown() {
  const dropdown = document.getElementById('experience-dropdown');
  if (!dropdown) return;
  
  dropdown.addEventListener('change', (e) => {
    const selectedValue = dropdown.value;
    
    // Publish the event
    eventBus.publish('experience.selected', { 
      value: selectedValue,
      element: dropdown,
      event: e
    });
    
    console.log(`[Bridge] Experience selected: ${selectedValue}`);
  });
}

// Initialize the bridge when the DOM is loaded
export function initBridge() {
  console.log('🌉 Initializing bridge between existing code and new architecture');
  
  // Publish app.ready event
  eventBus.publish('app.ready', { timestamp: Date.now() });
  
  // Connect specific UI elements to EventBus
  connectExperienceDropdown();
  
  // Connect form submit
  const form = document.getElementById('booking-form');
  if (form) {
    connectDOMToEventBus(form, 'submit', 'form.submit', (e) => {
      e.preventDefault();
      return {
        event: e,
        formData: new FormData(form)
      };
    });
  }
  
  // Connect tab buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    connectDOMToEventBus(button, 'click', 'tabs.change', (e) => {
      return {
        event: e,
        tabId: button.id,
        targetPanel: button.getAttribute('data-tab-target')
      };
    });
  });
  
  console.log('✅ Bridge initialized successfully');
  return true;
}

// Export default object for importing the whole bridge
export default {
  eventBus,
  connectDOMToEventBus,
  wrapLegacyFunction,
  initBridge,
  connectExperienceDropdown
};