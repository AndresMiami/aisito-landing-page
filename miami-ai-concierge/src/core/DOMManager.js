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
    if (useCache && this._elementCache.has(selector)) {
      return this._elementCache.get(selector);
    }
    
    const element = document.querySelector(selector);
    if (element && useCache) {
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
    if (typeof element === 'string') {
      return this.getElement(element);
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
    if (el) {
      el.value = value;
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
    return el ? el.value : '';
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
}

// Export for both module and global usage
export default DOMManager;

// Global availability for non-module usage
if (typeof window !== 'undefined') {
  window.DOMManager = DOMManager;
}

console.log('🏗️ DOMManager loaded with Miami Concierge utilities');