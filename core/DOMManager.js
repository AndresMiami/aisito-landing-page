/**
 * DOMManager.js - Centralized DOM manipulation for Miami Concierge
 * 
 * This module provides a standardized interface for DOM operations,
 * decoupling components from direct DOM manipulation and making the
 * codebase more maintainable and testable.
 * 
 * Features:
 * - Type-safe element operations
 * - Consistent error handling
 * - Miami Concierge specific utilities
 * - Event delegation support
 * - Performance optimizations
 * 
 * Usage:
 * import DOMManager from './core/DOMManager.js';
 * 
 * // Get element and update it
 * const element = DOMManager.getElement('#my-element');
 * DOMManager.addClass(element, 'active');
 */

import EventDefinitions from './EventDefinitions.js';

class DOMManager {
  // Cache for frequently accessed elements
  static _elementCache = new Map();
  static _cacheEnabled = true;
  
  /**
   * Enable or disable element caching
   * @param {boolean} enabled - Whether to enable caching
   */
  static setCaching(enabled) {
    this._cacheEnabled = enabled;
    if (!enabled) {
      this._elementCache.clear();
    }
  }
  
  /**
   * Clear element cache
   */
  static clearCache() {
    this._elementCache.clear();
  }
  
  /**
   * Get a single element by selector with caching
   * @param {string} selector - CSS selector
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Element|null} DOM element or null if not found
   */
  static getElement(selector, useCache = true) {
    if (this._cacheEnabled && useCache && this._elementCache.has(selector)) {
      const cached = this._elementCache.get(selector);
      // Verify element is still in DOM
      if (document.contains(cached)) {
        return cached;
      } else {
        this._elementCache.delete(selector);
      }
    }
    
    const element = document.querySelector(selector);
    
    if (element && this._cacheEnabled && useCache) {
      this._elementCache.set(selector, element);
    }
    
    return element;
  }
  
  /**
   * Get multiple elements by selector
   * @param {string} selector - CSS selector
   * @returns {NodeList} Collection of DOM elements
   */
  static getElements(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Get multiple elements by selector (querySelectorAll wrapper)
   * @param {string} selector - CSS selector
   * @param {Element} context - Optional context element (defaults to document)
   * @returns {NodeList} Collection of DOM elements with error handling
   */
  static querySelectorAll(selector, context = document) {
    try {
      console.log(`🔍 DOMManager.querySelectorAll: "${selector}"`);
      return context.querySelectorAll(selector);
    } catch (error) {
      console.error(`❌ DOMManager.querySelectorAll error for "${selector}":`, error);
      return { length: 0, [Symbol.iterator]: () => [][Symbol.iterator]() };
    }
  }
  
  /**
   * Get a single element by selector (querySelector wrapper)
   * @param {string} selector - CSS selector
   * @param {Element} context - Optional context element (defaults to document)
   * @returns {Element|null} First matching DOM element or null if not found
   */
  static querySelector(selector, context = document) {
    try {
      console.log(`🔍 DOMManager.querySelector: "${selector}"`);
      return context.querySelector(selector);
    } catch (error) {
      console.error(`❌ DOMManager.querySelector error for "${selector}":`, error);
      return null;
    }
  }
  
  /**
   * Get element by ID with caching
   * @param {string} id - Element ID
   * @param {boolean} useCache - Whether to use cache
   * @returns {Element|null} DOM element or null if not found
   */
  static getElementById(id, useCache = true) {
    return this.getElement(`#${id}`, useCache);
  }
  
  /**
   * Safely resolve element from ID, selector, or element
   * @param {string|Element} element - Element identifier
   * @returns {Element|null} Resolved DOM element
   */
  static _resolveElement(element) {
    if (!element) return null;
    
    if (typeof element === 'string') {
      return element.startsWith('#') || element.includes('.') || element.includes(' ') 
        ? this.getElement(element) 
        : this.getElementById(element);
    }
    
    return element instanceof Element ? element : null;
  }
  
  /**
   * Set value of an input element
   * @param {string|Element} element - Element ID or DOM element
   * @param {string} value - Value to set
   * @returns {boolean} Success status
   */
  static setValue(element, value) {
    const el = this._resolveElement(element);
    if (el && ('value' in el)) {
      const oldValue = el.value;
      el.value = value;
      
      // Emit change event if value actually changed
      if (oldValue !== value && window.eventBus) {
        window.eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, {
          fieldId: el.id || el.name,
          oldValue,
          newValue: value,
          timestamp: Date.now(),
          source: 'DOMManager.setValue'
        });
      }
      
      return true;
    }
    return false;
  }
  
  /**
   * Get value of an input element
   * @param {string|Element} element - Element ID or DOM element
   * @returns {string} Element value or empty string if not found
   */
  static getValue(element) {
    const el = this._resolveElement(element);
    return el && ('value' in el) ? el.value : '';
  }
  
  /**
   * Set attribute on an element
   * @param {string|Element} element - Element ID or DOM element
   * @param {string} attribute - Attribute name
   * @param {string} value - Attribute value
   * @returns {boolean} Success status
   */
  static setAttribute(element, attribute, value) {
    const el = this._resolveElement(element);
    if (el) {
      el.setAttribute(attribute, value);
      return true;
    }
    return false;
  }
  
  /**
   * Get attribute from an element
   * @param {string|Element} element - Element ID or DOM element
   * @param {string} attribute - Attribute name
   * @returns {string|null} Attribute value or null if not found
   */
  static getAttribute(element, attribute) {
    const el = this._resolveElement(element);
    return el ? el.getAttribute(attribute) : null;
  }
  
  /**
   * Remove attribute from an element
   * @param {string|Element} element - Element ID or DOM element
   * @param {string} attribute - Attribute name
   * @returns {boolean} Success status
   */
  static removeAttribute(element, attribute) {
    const el = this._resolveElement(element);
    if (el) {
      el.removeAttribute(attribute);
      return true;
    }
    return false;
  }
  
  /**
   * Add class to an element with animation support
   * @param {string|Element} element - Element ID, selector, or DOM element
   * @param {string} className - Class to add
   * @param {boolean} animate - Whether to animate the change
   * @returns {boolean} Success status
   */
  static addClass(element, className, animate = false) {
    const el = this._resolveElement(element);
    
    if (el) {
      if (animate) {
        el.style.transition = 'all 0.3s ease';
      }
      
      el.classList.add(className);
      
      if (animate) {
        // Remove transition after animation
        setTimeout(() => {
          el.style.transition = '';
        }, 300);
      }
      
      return true;
    }
    return false;
  }
  
  /**
   * Remove class from an element with animation support
   * @param {string|Element} element - Element ID, selector, or DOM element
   * @param {string} className - Class to remove
   * @param {boolean} animate - Whether to animate the change
   * @returns {boolean} Success status
   */
  static removeClass(element, className, animate = false) {
    const el = this._resolveElement(element);
    
    if (el) {
      if (animate) {
        el.style.transition = 'all 0.3s ease';
      }
      
      el.classList.remove(className);
      
      if (animate) {
        setTimeout(() => {
          el.style.transition = '';
        }, 300);
      }
      
      return true;
    }
    return false;
  }
  
  /**
   * Toggle class on an element with animation support
   * @param {string|Element} element - Element ID, selector, or DOM element
   * @param {string} className - Class to toggle
   * @param {boolean} animate - Whether to animate the change
   * @returns {boolean} New state (true if class added, false if removed)
   */
  static toggleClass(element, className, animate = false) {
    const el = this._resolveElement(element);
    
    if (el) {
      if (animate) {
        el.style.transition = 'all 0.3s ease';
      }
      
      const result = el.classList.toggle(className);
      
      if (animate) {
        setTimeout(() => {
          el.style.transition = '';
        }, 300);
      }
      
      return result;
    }
    return false;
  }
  
  /**
   * Check if element has a class
   * @param {string|Element} element - Element ID, selector, or DOM element
   * @param {string} className - Class to check
   * @returns {boolean} True if element has class
   */
  static hasClass(element, className) {
    const el = this._resolveElement(element);
    return el ? el.classList.contains(className) : false;
  }
  
  /**
   * Show an element with optional animation
   * @param {string|Element} element - Element ID, selector, or DOM element
   * @param {string} display - Display value (default: '')
   * @param {boolean} animate - Whether to animate
   * @returns {boolean} Success status
   */
  static showElement(element, display = '', animate = false) {
    const el = this._resolveElement(element);
    
    if (el) {
      if (animate) {
        el.style.opacity = '0';
        el.style.display = display;
        el.style.transition = 'opacity 0.3s ease';
        
        // Force reflow
        el.offsetHeight;
        
        el.style.opacity = '1';
        
        setTimeout(() => {
          el.style.transition = '';
        }, 300);
      } else {
        el.style.display = display;
      }
      
      // Emit UI event
      if (window.eventBus) {
        window.eventBus.emit(EventDefinitions.EVENTS.UI.LOADING_HIDE, {
          elementId: el.id,
          timestamp: Date.now()
        });
      }
      
      return true;
    }
    return false;
  }
  
  /**
   * Hide an element with optional animation
   * @param {string|Element} element - Element ID, selector, or DOM element
   * @param {boolean} animate - Whether to animate
   * @returns {boolean} Success status
   */
  static hideElement(element, animate = false) {
    const el = this._resolveElement(element);
    
    if (el) {
      if (animate) {
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        
        setTimeout(() => {
          el.style.display = 'none';
          el.style.transition = '';
          el.style.opacity = '';
        }, 300);
      } else {
        el.style.display = 'none';
      }
      
      return true;
    }
    return false;
  }
  
  /**
   * Set inner HTML of an element safely
   * @param {string|Element} element - Element ID, selector, or DOM element
   * @param {string} html - HTML content
   * @param {boolean} sanitize - Whether to sanitize HTML (default: true)
   * @returns {boolean} Success status
   */
  static setHTML(element, html, sanitize = true) {
    const el = this._resolveElement(element);
    
    if (el) {
      if (sanitize) {
        // Basic HTML sanitization - remove script tags and event handlers
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        html = html.replace(/\son\w+="[^"]*"/g, '');
      }
      
      el.innerHTML = html;
      return true;
    }
    return false;
  }
  
  /**
   * Set the text content of an element
   * @param {string|Element} selector - Element or selector
   * @param {string} text - Text content to set
   * @returns {boolean} - Success or failure
   */
  static setTextContent(selector, text) {
    try {
      const element = this.getElement(selector);
      if (!element) {
        console.warn(`DOMManager: Element not found for setTextContent: ${selector}`);
        return false;
      }
      
      element.textContent = text;
      return true;
    } catch (error) {
      console.error(`DOMManager: Error setting text content: ${error.message}`);
      return false;
    }
  }

  /**
   * Alias for setTextContent for compatibility
   */
  static setText(selector, text) {
    return this.setTextContent(selector, text);
  }
  
  /**
   * Create a new element with Miami Concierge styling
   * @param {string} tagName - HTML tag name
   * @param {Object} attributes - Attributes to set
   * @param {string} textContent - Text content
   * @param {Array} classes - CSS classes to add
   * @returns {Element} Created element
   */
  static createElement(tagName, attributes = {}, textContent = '', classes = []) {
    const element = document.createElement(tagName);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    // Add classes
    if (classes.length > 0) {
      element.classList.add(...classes);
    }
    
    // Set text content if provided
    if (textContent) {
      element.textContent = textContent;
    }
    
    return element;
  }
  
  /**
   * Create Miami-themed button
   * @param {string} text - Button text
   * @param {Object} options - Button options
   * @returns {Element} Created button element
   */
  static createMiamiButton(text, options = {}) {
    const {
      type = 'button',
      variant = 'primary', // primary, secondary, accent
      size = 'medium', // small, medium, large
      disabled = false,
      onclick = null
    } = options;
    
    const button = this.createElement('button', {
      type,
      disabled: disabled ? 'disabled' : null
    }, text);
    
    // Add Miami styling classes
    const baseClasses = ['miami-btn', `miami-btn--${variant}`, `miami-btn--${size}`];
    button.classList.add(...baseClasses);
    
    if (onclick) {
      button.addEventListener('click', onclick);
    }
    
    return button;
  }
  
  /**
   * Append a child element
   * @param {string|Element} parent - Parent element ID, selector, or DOM element
   * @param {Element} child - Child element to append
   * @returns {boolean} Success status
   */
  static appendChild(parent, child) {
    const parentEl = this._resolveElement(parent);
    
    if (parentEl && child) {
      parentEl.appendChild(child);
      return true;
    }
    return false;
  }
  
  /**
   * Remove an element with optional animation
   * @param {string|Element} element - Element ID, selector, or DOM element
   * @param {boolean} animate - Whether to animate removal
   * @returns {boolean} Success status
   */
  static removeElement(element, animate = false) {
    const el = this._resolveElement(element);
    
    if (el && el.parentNode) {
      if (animate) {
        el.style.transition = 'all 0.3s ease';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }, 300);
      } else {
        el.parentNode.removeChild(el);
      }
      return true;
    }
    return false;
  }
  
  /**
   * Add event listener to an element with automatic cleanup
   * @param {string|Element} element - Element ID, selector, or DOM element
   * @param {string} eventType - Event type (e.g., 'click', 'input')
   * @param {Function} handler - Event handler function
   * @param {Object} options - Event listener options
   * @returns {Function|null} Cleanup function or null if failed
   */
  static addEventListener(element, eventType, handler, options = {}) {
    const el = this._resolveElement(element);
    
    if (el) {
      el.addEventListener(eventType, handler, options);
      
      // Return cleanup function
      return () => {
        el.removeEventListener(eventType, handler);
      };
    }
    return null;
  }
  
  /**
   * Remove event listener from an element
   * @param {string|Element} element - Element ID, selector, or DOM element
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler function
   * @returns {boolean} Success status
   */
  static removeEventListener(element, eventType, handler) {
    const el = this._resolveElement(element);
    
    if (el) {
      el.removeEventListener(eventType, handler);
      return true;
    }
    return false;
  }
  
  // Miami Concierge specific utilities
  
  /**
   * Get all form field elements in the booking form
   * @returns {Object} Object containing form field references
   */
  static getFormFields() {
    return {
      fromLocation: this.getElementById('from-location'),
      toAddress: this.getElementById('to-address'),
      fromLocationExp: this.getElementById('from-location-exp'),
      experienceDropdown: this.getElementById('experience-dropdown'),
      submitButton: this.getElementById('submit-button'),
      resetButton: this.getElementById('reset-button'),
      bookingForm: this.getElementById('booking-form')
    };
  }
  
  /**
   * Get all error display elements
   * @returns {Object} Object containing error element references
   */
  static getErrorElements() {
    const errorElements = {};
    const formFields = this.getFormFields();
    
    Object.keys(formFields).forEach(key => {
      const fieldId = formFields[key]?.id;
      if (fieldId) {
        errorElements[`${key}Error`] = this.getElementById(`${fieldId}-error`);
      }
    });
    
    return errorElements;
  }
  
  /**
   * Set loading state for Miami buttons
   * @param {string|Element} button - Button element
   * @param {boolean} loading - Loading state
   * @param {string} loadingText - Text to show when loading
   * @returns {boolean} Success status
   */
  static setButtonLoading(button, loading, loadingText = 'Loading...') {
    const el = this._resolveElement(button);
    
    if (el) {
      if (loading) {
        el.disabled = true;
        el.dataset.originalText = el.textContent;
        el.innerHTML = `<span class="spinner"></span> ${loadingText}`;
        this.addClass(el, 'loading');
      } else {
        el.disabled = false;
        el.textContent = el.dataset.originalText || el.textContent;
        this.removeClass(el, 'loading');
      }
      return true;
    }
    return false;
  }
  
  /**
   * Clear all form fields
   * @returns {boolean} Success status
   */
  static clearAllFormFields() {
    const fields = this.getFormFields();
    let success = true;
    
    Object.values(fields).forEach(field => {
      if (field && 'value' in field) {
        success = this.setValue(field, '') && success;
      }
    });
    
    return success;
  }
  
  /**
   * Validate element exists before operation
   * @param {string|Element} element - Element to validate
   * @param {string} operation - Operation name for error reporting
   * @returns {Element|null} Validated element or null
   */
  static _validateElement(element, operation) {
    const el = this._resolveElement(element);
    
    if (!el) {
      console.warn(`DOMManager.${operation}: Element not found`, element);
      return null;
    }
    
    return el;
  }
  
  /**
   * Batch operations for multiple elements
   * @param {Array} elements - Array of element identifiers
   * @param {Function} operation - Operation to perform
   * @param {...any} args - Arguments for the operation
   * @returns {Array} Array of operation results
   */
  static batchOperation(elements, operation, ...args) {
    return elements.map(element => {
      try {
        return operation.call(this, element, ...args);
      } catch (error) {
        console.error('DOMManager batch operation error:', error);
        return false;
      }
    });
  }
  
  /**
   * Wait for element to appear in DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Element>} Promise resolving to element
   */
  static waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = this.getElement(selector);
      
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver((mutations, obs) => {
        const element = this.getElement(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
  
  /**
   * Create error message element
   * @param {string} message - Error message
   * @param {string} severity - Error severity
   * @returns {Element} Error element
   */
  static createErrorElement(message, severity = 'error') {
    return this.createElement('div', {
      class: `error-message error-${severity}`,
      role: 'alert',
      'aria-live': 'polite'
    }, message);
  }
  
  /**
   * Get text content of an element with event integration
   * @param {string|Element} element - Element ID, selector, or DOM element
   * @returns {string} Element text content or empty string if not found
   */
  static getText(element) {
    const el = this._resolveElement(element);
    
    if (el) {
      const text = el.textContent || el.innerText || '';
      
      // Emit event for event-based architecture
      if (window.eventBus && text) {
        window.eventBus.emit('dom:text-accessed', {
          elementId: el.id || 'unknown',
          text: text.trim(),
          timestamp: Date.now(),
          source: 'DOMManager.getText'
        });
      }
      
      return text.trim();
    }
    return '';
  }
}

// Export for both module and global usage
export default DOMManager;

// Global availability for non-module usage
if (typeof window !== 'undefined') {
  window.DOMManager = DOMManager;
}

console.log('🏗️ DOMManager loaded with Miami Concierge utilities');