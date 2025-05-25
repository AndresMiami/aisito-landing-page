/**
 * Simple EventBus implementation for the Miami AI Concierge
 */

class EventBus {
  constructor() {
    this.events = {};
  }

  subscribe(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);

    // Return unsubscribe function
    return () => {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    };
  }

  publish(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${eventName}:`, error);
        }
      });
    }
  }
}

// Create an instance and export it as default
const eventBus = new EventBus();

// Add compatibility methods for essential-functions.js
eventBus.on = eventBus.subscribe;
eventBus.emit = eventBus.publish;
eventBus.off = function(eventName, callback) {
  if (this.events[eventName]) {
    this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
  }
};

export default eventBus;

// Add global fallback for non-module usage
if (typeof window !== 'undefined') {
  window.eventBus = eventBus;
  window.EventBus = EventBus;
}