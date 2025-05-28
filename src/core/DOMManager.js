/**
 * DOMManager - Provides utilities for DOM manipulation and event binding
 * with EventBus integration for component communication
 */
import eventBus from '../../eventBus.js';

export class DOMManager {
  constructor(document, eventBusInstance = eventBus) {
    this.document = document;
    this.eventBus = eventBusInstance;
    this.boundEvents = new Map();
    this.elementCache = new Map();
  }

  /**
   * Get an element by ID with caching
   * @param {string} id - Element ID
   * @returns {HTMLElement|null} - The found element or null
   */
  getElementById(id) {
    if (!this.elementCache.has(id)) {
      const element = this.document.getElementById(id);
      if (element) {
        this.elementCache.set(id, element);
      }
    }
    return this.elementCache.get(id) || null;
  }

  /**
   * Get elements by query selector
   * @param {string} selector - CSS selector
   * @param {HTMLElement|Document} context - Element to search within (defaults to document)
   * @returns {Array<HTMLElement>} - Array of found elements
   */
  querySelectorAll(selector, context = this.document) {
    return Array.from(context.querySelectorAll(selector));
  }

  /**
   * Bind a DOM event to an EventBus event
   * @param {HTMLElement|string} element - Element or element ID
   * @param {string} eventName - DOM event name (e.g., 'click')
   * @param {string} eventBusEvent - EventBus event name to publish
   * @param {Function} dataTransformer - Function to transform event data
   * @returns {Function} - Unbind function
   */
  bindEvent(element, eventName, eventBusEvent, dataTransformer = null) {
    // If element is a string, get the element by ID
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }

    if (!element) {
      console.warn(`Element not found for event binding: ${eventBusEvent}`);
      return () => {};
    }

    const key = `${element.id || 'anonymous'}-${eventName}-${eventBusEvent}`;
    
    // Unbind existing handler if any
    if (this.boundEvents.has(key)) {
      this.boundEvents.get(key)();
    }
    
    const handler = (event) => {
      const data = dataTransformer ? dataTransformer(event, element) : { 
        originalEvent: event, 
        element 
      };
      
      this.eventBus.publish(eventBusEvent, data);
    };
    
    element.addEventListener(eventName, handler);
    
    // Store unbind function
    const unbind = () => {
      element.removeEventListener(eventName, handler);
      this.boundEvents.delete(key);
    };
    
    this.boundEvents.set(key, unbind);
    return unbind;
  }

  /**
   * Toggle element visibility
   * @param {HTMLElement|string} element - Element or element ID
   * @param {boolean} visible - Whether the element should be visible
   */
  toggleVisibility(element, visible) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    
    if (!element) return;
    
    if (visible) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
    
    // Publish visibility change event
    this.eventBus.publish('dom.visibilityChanged', {
      element,
      visible,
      id: element.id
    });
  }

  /**
   * Set element text content
   * @param {HTMLElement|string} element - Element or element ID
   * @param {string} text - Text to set
   */
  setText(element, text) {
    if (typeof element === 'string') {
      element = this.getElementById(element);
    }
    
    if (!element) return;
    element.textContent = text;
  }

  /**
   * Clean up all bound events
   */
  destroy() {
    for (const unbind of this.boundEvents.values()) {
      unbind();
    }
    
    this.boundEvents.clear();
    this.elementCache.clear();
  }
}

export default DOMManager;
