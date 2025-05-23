/**
 * EventBus - A lightweight event system for decoupled communication between components
 * Implements the publish/subscribe pattern with support for namespaced events
 * and debounced/throttled event publishing
 */
export class EventBus {
  constructor() {
    this.subscribers = new Map();
    this.middlewares = [];
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.throttleLastRun = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} eventType - The event name to subscribe to (can use namespaces with dot notation)
   * @param {Function} callback - The function to be called when event is published
   * @param {Object} options - Additional options for the subscription
   * @param {boolean} options.once - If true, the subscription will be removed after first event
   * @param {Object} options.context - The context (this) to apply to the callback
   * @returns {Function} - Unsubscribe function
   */
  subscribe(eventType, callback, options = {}) {
    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }
    
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    const subscriber = {
      callback,
      once: options.once || false,
      context: options.context || null
    };

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    const subscribers = this.subscribers.get(eventType);
    subscribers.push(subscriber);

    // Return unsubscribe function
    return () => {
      const index = subscribers.indexOf(subscriber);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
      
      // Clean up if no more subscribers
      if (subscribers.length === 0) {
        this.subscribers.delete(eventType);
      }
    };
  }

  /**
   * Subscribe to an event once
   * @param {string} eventType - The event name to subscribe to
   * @param {Function} callback - The function to be called when event is published
   * @param {Object} options - Additional options for the subscription
   * @returns {Function} - Unsubscribe function
   */
  once(eventType, callback, options = {}) {
    return this.subscribe(eventType, callback, { ...options, once: true });
  }

  /**
   * Publish an event
   * @param {string} eventType - The event name to publish
   * @param {*} data - The data to pass to subscribers
   * @returns {boolean} - True if event had subscribers
   */
  publish(eventType, data) {
    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    // Apply middlewares
    data = this._applyMiddlewares(eventType, data);
    
    let hasSubscribers = false;
    
    // Check for exact event subscribers
    if (this.subscribers.has(eventType)) {
      hasSubscribers = true;
      const subscribers = this.subscribers.get(eventType);
      
      // Process subscribers in reverse to safely handle removal of once subscriptions
      for (let i = subscribers.length - 1; i >= 0; i--) {
        const { callback, once, context } = subscribers[i];
        callback.call(context, data);
        
        if (once) {
          subscribers.splice(i, 1);
        }
      }
      
      // Clean up empty subscriber arrays
      if (subscribers.length === 0) {
        this.subscribers.delete(eventType);
      }
    }
    
    // Handle namespaced events (e.g. "form.submit" should trigger "form.*" subscribers)
    if (eventType.includes('.')) {
      const namespaceParts = eventType.split('.');
      
      for (let i = namespaceParts.length - 1; i > 0; i--) {
        const namespace = namespaceParts.slice(0, i).join('.') + '.*';
        
        if (this.subscribers.has(namespace)) {
          hasSubscribers = true;
          const subscribers = this.subscribers.get(namespace);
          
          for (let j = subscribers.length - 1; j >= 0; j--) {
            const { callback, once, context } = subscribers[j];
            callback.call(context, data);
            
            if (once) {
              subscribers.splice(j, 1);
            }
          }
          
          if (subscribers.length === 0) {
            this.subscribers.delete(namespace);
          }
        }
      }
    }
    
    return hasSubscribers;
  }

  /**
   * Add a middleware to process events before they're published
   * @param {Function} middleware - Function to process events
   */
  addMiddleware(middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function');
    }
    this.middlewares.push(middleware);
  }

  /**
   * Apply all middlewares to the event data
   * @private
   * @param {string} eventType - The event type
   * @param {*} data - The event data
   * @returns {*} - The processed data
   */
  _applyMiddlewares(eventType, data) {
    return this.middlewares.reduce((processedData, middleware) => {
      return middleware(eventType, processedData);
    }, data);
  }

  /**
   * Publish an event with debounce (wait until activity stops)
   * @param {string} eventType - The event name to publish
   * @param {*} data - The data to pass to subscribers
   * @param {number} wait - The debounce delay in milliseconds
   */
  debounce(eventType, data, wait = 300) {
    const key = `debounce_${eventType}`;
    
    // Clear any existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.publish(eventType, data);
      this.debounceTimers.delete(key);
    }, wait);
    
    this.debounceTimers.set(key, timer);
  }

  /**
   * Publish an event with throttle (at most once per specified period)
   * @param {string} eventType - The event name to publish
   * @param {*} data - The data to pass to subscribers
   * @param {number} limit - The minimum time between events in milliseconds
   */
  throttle(eventType, data, limit = 300) {
    const key = `throttle_${eventType}`;
    const now = Date.now();
    
    // If never run or limit exceeded, publish immediately
    if (!this.throttleLastRun.has(key) || 
        (now - this.throttleLastRun.get(key)) >= limit) {
      this.publish(eventType, data);
      this.throttleLastRun.set(key, now);
      return;
    }
    
    // Otherwise, schedule one more publish after the limit
    if (!this.throttleTimers.has(key)) {
      const remainingTime = limit - (now - this.throttleLastRun.get(key));
      
      const timer = setTimeout(() => {
        this.publish(eventType, data);
        this.throttleLastRun.set(key, Date.now());
        this.throttleTimers.delete(key);
      }, remainingTime);
      
      this.throttleTimers.set(key, timer);
    }
  }

  /**
   * Remove all subscribers for a specific event type
   * @param {string} eventType - The event to unsubscribe from
   */
  clear(eventType) {
    if (eventType) {
      this.subscribers.delete(eventType);
    } else {
      this.subscribers.clear();
    }
  }
}

// Create and export a singleton instance
const eventBus = new EventBus();
export default eventBus;
