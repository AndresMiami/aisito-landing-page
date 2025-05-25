class EventBus {
  constructor() {
    this.listeners = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event - The event name
   * @param {function} listener - The callback function to execute when the event is emitted
   */
  on(event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - The event name
   * @param {function} listener - The callback function to remove
   */
  off(event, listener) {
    if (!this.listeners[event]) return;

    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  /**
   * Emit an event, triggering all registered listeners
   * @param {string} event - The event name
   * @param {any} data - The data to pass to the listeners
   */
  emit(event, data) {
    if (!this.listeners[event]) return;

    this.listeners[event].forEach(listener => listener(data));
  }
}

// Export a singleton instance of EventBus
const eventBus = new EventBus();
export default eventBus;