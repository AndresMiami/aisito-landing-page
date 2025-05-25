class EventBus {
  constructor() {
    this.listeners = {};
  }

  /**
   * Register an event listener for a specific event type.
   * @param {string} eventType - The type of event to listen for.
   * @param {function} callback - The function to call when the event is emitted.
   */
  on(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
  }

  /**
   * Emit an event of a specific type, calling all registered listeners.
   * @param {string} eventType - The type of event to emit.
   * @param {object} data - The data to pass to the event listeners.
   */
  emit(eventType, data) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(callback => callback(data));
    }
  }

  /**
   * Remove a specific listener for a given event type.
   * @param {string} eventType - The type of event.
   * @param {function} callback - The listener function to remove.
   */
  off(eventType, callback) {
    if (this.listeners[eventType]) {
      this.listeners[eventType] = this.listeners[eventType].filter(listener => listener !== callback);
    }
  }

  /**
   * Clear all listeners for a specific event type.
   * @param {string} eventType - The type of event to clear.
   */
  clear(eventType) {
    if (this.listeners[eventType]) {
      delete this.listeners[eventType];
    }
  }
}

// Export the EventBus instance for use in other modules
const eventBus = new EventBus();
export default eventBus;