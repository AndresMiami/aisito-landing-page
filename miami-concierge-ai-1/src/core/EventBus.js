class EventBus {
  constructor() {
    this.events = {};
    console.log('🔌 EventBus: Initialized');
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    
    console.log(`🔔 EventBus: Subscribed to '${eventName}' (${this.events[eventName].length} listeners)`);
    
    return () => this.off(eventName, callback);
  }

  off(eventName, callback) {
    if (!this.events[eventName]) return;
    
    this.events[eventName] = this.events[eventName].filter(
      cb => cb !== callback
    );
    
    console.log(`🔕 EventBus: Unsubscribed from '${eventName}' (${this.events[eventName].length} listeners remaining)`);
  }

  emit(eventName, data = {}) {
    if (!this.events[eventName] || this.events[eventName].length === 0) {
      console.warn(`⚠️ EventBus: No listeners for '${eventName}'`);
      return;
    }
    
    console.log(`📡 EventBus: Event '${eventName}' emitted`, data);
    
    this.events[eventName].forEach((callback, index) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ EventBus: Error in '${eventName}' handler #${index}:`, error);
      }
    });
  }

  once(eventName, callback) {
    const onceCallback = (data) => {
      this.off(eventName, onceCallback);
      callback(data);
    };
    
    return this.on(eventName, onceCallback);
  }
}

export const eventBus = new EventBus();
window.eventBus = eventBus;
export default eventBus;