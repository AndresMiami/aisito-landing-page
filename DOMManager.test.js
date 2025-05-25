import { jest } from '@jest/globals';
import DOMManager from './DOMManager.js';

// Mock EventDefinitions
const mockEventDefinitions = {
  EVENTS: {
    FORM: {
      FIELD_CHANGED: 'form.field.changed'
    },
    UI: {
      LOADING_HIDE: 'ui.loading.hide'
    }
  }
};

jest.mock('./EventDefinitions.js', () => mockEventDefinitions);

// Mock DOM APIs
const mockElement = (id = 'test-element', options = {}) => ({
  id,
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(() => false),
    toggle: jest.fn(() => true)
  },
  setAttribute: jest.fn(),
  getAttribute: jest.fn(() => null),
  removeAttribute: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  style: {},
  value: '',
  textContent: '',
  innerHTML: '',
  parentNode: {
    removeChild: jest.fn()
  },
  offsetHeight: 100,
  dataset: {},
  ...options
});

const mockDocument = {
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  getElementById: jest.fn(),
  createElement: jest.fn(),
  contains: jest.fn(() => true)
};

const mockWindow = {
  eventBus: {
    emit: jest.fn()
  }
};

describe('DOMManager', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset static properties
    DOMManager._elementCache.clear();
    DOMManager._cacheEnabled = true;
    
    // Setup global mocks
    global.document = mockDocument;
    global.window = mockWindow;
    global.setTimeout = jest.fn((fn) => fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Cache Management', () => {
    test('should enable and disable caching', () => {
      expect(DOMManager._cacheEnabled).toBe(true);
      
      DOMManager.setCaching(false);
      expect(DOMManager._cacheEnabled).toBe(false);
      expect(DOMManager._elementCache.size).toBe(0);
      
      DOMManager.setCaching(true);
      expect(DOMManager._cacheEnabled).toBe(true);
    });

    test('should clear cache', () => {
      DOMManager._elementCache.set('test', 'value');
      expect(DOMManager._elementCache.size).toBe(1);
      
      DOMManager.clearCache();
      expect(DOMManager._elementCache.size).toBe(0);
    });
  });

  describe('Element Retrieval', () => {
    test('getElement should return element and cache it', () => {
      const element = mockElement();
      mockDocument.querySelector.mockReturnValue(element);
      
      const result1 = DOMManager.getElement('#test');
      const result2 = DOMManager.getElement('#test');
      
      expect(mockDocument.querySelector).toHaveBeenCalledTimes(1);
      expect(result1).toBe(element);
      expect(result2).toBe(element);
      expect(DOMManager._elementCache.has('#test')).toBe(true);
    });

    test('getElement should skip cache when useCache is false', () => {
      const element = mockElement();
      mockDocument.querySelector.mockReturnValue(element);
      
      DOMManager.getElement('#test', false);
      DOMManager.getElement('#test', false);
      
      expect(mockDocument.querySelector).toHaveBeenCalledTimes(2);
      expect(DOMManager._elementCache.has('#test')).toBe(false);
    });

    test('getElement should remove stale cache entries', () => {
      const element = mockElement();
      mockDocument.querySelector.mockReturnValue(element);
      mockDocument.contains.mockReturnValue(false);
      
      DOMManager._elementCache.set('#test', element);
      const result = DOMManager.getElement('#test');
      
      expect(DOMManager._elementCache.has('#test')).toBe(false);
      expect(mockDocument.querySelector).toHaveBeenCalledWith('#test');
    });

    test('getElements should return NodeList', () => {
      const elements = [mockElement('1'), mockElement('2')];
      mockDocument.querySelectorAll.mockReturnValue(elements);
      
      const result = DOMManager.getElements('.test');
      
      expect(mockDocument.querySelectorAll).toHaveBeenCalledWith('.test');
      expect(result).toBe(elements);
    });

    test('getElementById should get element by ID', () => {
      const element = mockElement();
      mockDocument.querySelector.mockReturnValue(element);
      
      const result = DOMManager.getElementById('test-id');
      
      expect(mockDocument.querySelector).toHaveBeenCalledWith('#test-id');
      expect(result).toBe(element);
    });

    test('_resolveElement should handle different input types', () => {
      const element = mockElement();
      mockDocument.querySelector.mockReturnValue(element);
      
      // Test with null
      expect(DOMManager._resolveElement(null)).toBe(null);
      
      // Test with selector string
      expect(DOMManager._resolveElement('#test')).toBe(element);
      expect(DOMManager._resolveElement('.test')).toBe(element);
      expect(DOMManager._resolveElement('div span')).toBe(element);
      
      // Test with ID string
      expect(DOMManager._resolveElement('test-id')).toBe(element);
      
      // Test with element
      expect(DOMManager._resolveElement(element)).toBe(element);
      
      // Test with invalid input
      expect(DOMManager._resolveElement({})).toBe(null);
    });
  });

  describe('Value Operations', () => {
    test('setValue should set element value and emit event', () => {
      const element = mockElement('input', { value: 'old' });
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.setValue(element, 'new');
      
      expect(element.value).toBe('new');
      expect(result).toBe(true);
      expect(mockWindow.eventBus.emit).toHaveBeenCalledWith(
        'form.field.changed',
        expect.objectContaining({
          fieldId: 'input',
          oldValue: 'old',
          newValue: 'new',
          source: 'DOMManager.setValue'
        })
      );
    });

    test('setValue should not emit event if value unchanged', () => {
      const element = mockElement('input', { value: 'same' });
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      DOMManager.setValue(element, 'same');
      
      expect(mockWindow.eventBus.emit).not.toHaveBeenCalled();
    });

    test('setValue should return false for invalid element', () => {
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(null);
      
      const result = DOMManager.setValue('invalid', 'value');
      
      expect(result).toBe(false);
    });

    test('getValue should return element value', () => {
      const element = mockElement('input', { value: 'test-value' });
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.getValue(element);
      
      expect(result).toBe('test-value');
    });

    test('getValue should return empty string for invalid element', () => {
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(null);
      
      const result = DOMManager.getValue('invalid');
      
      expect(result).toBe('');
    });
  });

  describe('Attribute Operations', () => {
    test('setAttribute should set attribute', () => {
      const element = mockElement();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.setAttribute(element, 'data-test', 'value');
      
      expect(element.setAttribute).toHaveBeenCalledWith('data-test', 'value');
      expect(result).toBe(true);
    });

    test('getAttribute should get attribute', () => {
      const element = mockElement();
      element.getAttribute.mockReturnValue('test-value');
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.getAttribute(element, 'data-test');
      
      expect(element.getAttribute).toHaveBeenCalledWith('data-test');
      expect(result).toBe('test-value');
    });

    test('removeAttribute should remove attribute', () => {
      const element = mockElement();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.removeAttribute(element, 'data-test');
      
      expect(element.removeAttribute).toHaveBeenCalledWith('data-test');
      expect(result).toBe(true);
    });
  });

  describe('Class Operations', () => {
    test('addClass should add class with animation', () => {
      const element = mockElement();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.addClass(element, 'test-class', true);
      
      expect(element.style.transition).toBe('all 0.3s ease');
      expect(element.classList.add).toHaveBeenCalledWith('test-class');
      expect(result).toBe(true);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 300);
    });

    test('removeClass should remove class without animation', () => {
      const element = mockElement();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.removeClass(element, 'test-class');
      
      expect(element.classList.remove).toHaveBeenCalledWith('test-class');
      expect(result).toBe(true);
      expect(element.style.transition).toBeUndefined();
    });

    test('toggleClass should toggle class and return state', () => {
      const element = mockElement();
      element.classList.toggle.mockReturnValue(true);
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.toggleClass(element, 'test-class');
      
      expect(element.classList.toggle).toHaveBeenCalledWith('test-class');
      expect(result).toBe(true);
    });

    test('hasClass should check if element has class', () => {
      const element = mockElement();
      element.classList.contains.mockReturnValue(true);
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.hasClass(element, 'test-class');
      
      expect(element.classList.contains).toHaveBeenCalledWith('test-class');
      expect(result).toBe(true);
    });
  });

  describe('Visibility Operations', () => {
    test('showElement should show element with animation', () => {
      const element = mockElement();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.showElement(element, 'block', true);
      
      expect(element.style.opacity).toBe('1');
      expect(element.style.display).toBe('block');
      expect(result).toBe(true);
      expect(mockWindow.eventBus.emit).toHaveBeenCalledWith(
        'ui.loading.hide',
        expect.objectContaining({ elementId: 'test-element' })
      );
    });

    test('hideElement should hide element without animation', () => {
      const element = mockElement();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.hideElement(element);
      
      expect(element.style.display).toBe('none');
      expect(result).toBe(true);
    });
  });

  describe('Content Operations', () => {
    test('setHTML should sanitize and set innerHTML', () => {
      const element = mockElement();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.setHTML(element, '<div>Safe</div><script>alert("bad")</script>');
      
      expect(element.innerHTML).toBe('<div>Safe</div>');
      expect(result).toBe(true);
    });

    test('setHTML should skip sanitization when disabled', () => {
      const element = mockElement();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      const html = '<div>Test</div><script>alert("test")</script>';
      
      const result = DOMManager.setHTML(element, html, false);
      
      expect(element.innerHTML).toBe(html);
      expect(result).toBe(true);
    });

    test('setText should set text content', () => {
      const element = mockElement();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.setText(element, 'Test text');
      
      expect(element.textContent).toBe('Test text');
      expect(result).toBe(true);
    });
  });

  describe('Element Creation', () => {
    test('createElement should create element with attributes and classes', () => {
      const element = mockElement();
      mockDocument.createElement.mockReturnValue(element);
      
      const result = DOMManager.createElement('div', 
        { id: 'test', 'data-test': 'value' }, 
        'Test content', 
        ['class1', 'class2']
      );
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(element.setAttribute).toHaveBeenCalledWith('id', 'test');
      expect(element.setAttribute).toHaveBeenCalledWith('data-test', 'value');
      expect(element.classList.add).toHaveBeenCalledWith('class1', 'class2');
      expect(element.textContent).toBe('Test content');
      expect(result).toBe(element);
    });

    test('createMiamiButton should create button with Miami styling', () => {
      const element = mockElement();
      mockDocument.createElement.mockReturnValue(element);
      const onclick = jest.fn();
      
      const result = DOMManager.createMiamiButton('Click me', {
        type: 'submit',
        variant: 'secondary',
        size: 'large',
        disabled: true,
        onclick
      });
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('button');
      expect(element.setAttribute).toHaveBeenCalledWith('type', 'submit');
      expect(element.setAttribute).toHaveBeenCalledWith('disabled', 'disabled');
      expect(element.classList.add).toHaveBeenCalledWith('miami-btn', 'miami-btn--secondary', 'miami-btn--large');
      expect(element.addEventListener).toHaveBeenCalledWith('click', onclick);
      expect(element.textContent).toBe('Click me');
    });
  });

  describe('DOM Operations', () => {
    test('appendChild should append child to parent', () => {
      const parent = mockElement();
      const child = mockElement('child');
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(parent);
      
      const result = DOMManager.appendChild(parent, child);
      
      expect(parent.appendChild).toHaveBeenCalledWith(child);
      expect(result).toBe(true);
    });

    test('removeElement should remove element with animation', () => {
      const element = mockElement();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.removeElement(element, true);
      
      expect(element.style.transition).toBe('all 0.3s ease');
      expect(element.style.opacity).toBe('0');
      expect(element.style.transform).toBe('scale(0.95)');
      expect(result).toBe(true);
    });

    test('addEventListener should add listener and return cleanup function', () => {
      const element = mockElement();
      const handler = jest.fn();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const cleanup = DOMManager.addEventListener(element, 'click', handler);
      
      expect(element.addEventListener).toHaveBeenCalledWith('click', handler, {});
      expect(typeof cleanup).toBe('function');
      
      cleanup();
      expect(element.removeEventListener).toHaveBeenCalledWith('click', handler);
    });

    test('removeEventListener should remove event listener', () => {
      const element = mockElement();
      const handler = jest.fn();
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(element);
      
      const result = DOMManager.removeEventListener(element, 'click', handler);
      
      expect(element.removeEventListener).toHaveBeenCalledWith('click', handler);
      expect(result).toBe(true);
    });
  });

  describe('Miami-specific Utilities', () => {
    test('getFormFields should return form field references', () => {
      const mockFields = {
        'from-location': mockElement('from-location'),
        'to-address': mockElement('to-address'),
        'experience-dropdown': mockElement('experience-dropdown')
      };
      
      mockDocument.querySelector.mockImplementation((selector) => {
        const id = selector.replace('#', '');
        return mockFields[id] || null;
      });
      
      const result = DOMManager.getFormFields();
      
      expect(result).toHaveProperty('fromLocation');
      expect(result).toHaveProperty('toAddress');
      expect(result).toHaveProperty('experienceDropdown');
    });

    test('setButtonLoading should set loading state', () => {
      const button = mockElement('btn', { textContent: 'Submit' });
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(button);
      jest.spyOn(DOMManager, 'addClass');
      jest.spyOn(DOMManager, 'removeClass');
      
      // Test loading state
      const result1 = DOMManager.setButtonLoading(button, true, 'Processing...');
      
      expect(button.disabled).toBe(true);
      expect(button.dataset.originalText).toBe('Submit');
      expect(button.innerHTML).toBe('<span class="spinner"></span> Processing...');
      expect(DOMManager.addClass).toHaveBeenCalledWith(button, 'loading');
      expect(result1).toBe(true);
      
      // Test non-loading state
      const result2 = DOMManager.setButtonLoading(button, false);
      
      expect(button.disabled).toBe(false);
      expect(button.textContent).toBe('Submit');
      expect(DOMManager.removeClass).toHaveBeenCalledWith(button, 'loading');
      expect(result2).toBe(true);
    });

    test('clearAllFormFields should clear all form values', () => {
      const mockFields = {
        fromLocation: mockElement('from-location', { value: 'test1' }),
        toAddress: mockElement('to-address', { value: 'test2' })
      };
      
      jest.spyOn(DOMManager, 'getFormFields').mockReturnValue(mockFields);
      jest.spyOn(DOMManager, 'setValue').mockReturnValue(true);
      
      const result = DOMManager.clearAllFormFields();
      
      expect(DOMManager.setValue).toHaveBeenCalledWith(mockFields.fromLocation, '');
      expect(DOMManager.setValue).toHaveBeenCalledWith(mockFields.toAddress, '');
      expect(result).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    test('batchOperation should apply operation to multiple elements', () => {
      const elements = ['#el1', '#el2', '#el3'];
      const mockOperation = jest.fn().mockReturnValue(true);
      
      const results = DOMManager.batchOperation(elements, mockOperation, 'test-class');
      
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(mockOperation).toHaveBeenCalledWith('#el1', 'test-class');
      expect(results).toEqual([true, true, true]);
    });

    test('waitForElement should resolve when element appears', async () => {
      const element = mockElement();
      mockDocument.querySelector.mockReturnValue(element);
      
      const result = await DOMManager.waitForElement('#test');
      
      expect(result).toBe(element);
    });

    test('waitForElement should observe DOM changes', async () => {
      mockDocument.querySelector.mockReturnValueOnce(null).mockReturnValueOnce(mockElement());
      
      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn()
      };
      global.MutationObserver = jest.fn().mockImplementation((callback) => {
        // Simulate element appearing
        setTimeout(() => callback([], mockObserver), 0);
        return mockObserver;
      });
      
      const result = await DOMManager.waitForElement('#test');
      
      expect(mockObserver.observe).toHaveBeenCalledWith(document.body, {
        childList: true,
        subtree: true
      });
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    test('createErrorElement should create error message', () => {
      const element = mockElement();
      mockDocument.createElement.mockReturnValue(element);
      
      const result = DOMManager.createErrorElement('Test error', 'warning');
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(element.setAttribute).toHaveBeenCalledWith('class', 'error-message error-warning');
      expect(element.setAttribute).toHaveBeenCalledWith('role', 'alert');
      expect(element.textContent).toBe('Test error');
    });
  });

  describe('Error Handling', () => {
    test('should handle operations on null elements gracefully', () => {
      jest.spyOn(DOMManager, '_resolveElement').mockReturnValue(null);
      
      expect(DOMManager.setValue('invalid', 'value')).toBe(false);
      expect(DOMManager.addClass('invalid', 'class')).toBe(false);
      expect(DOMManager.showElement('invalid')).toBe(false);
      expect(DOMManager.setAttribute('invalid', 'attr', 'val')).toBe(false);
    });

    test('batchOperation should handle errors gracefully', () => {
      const errorOperation = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      const results = DOMManager.batchOperation(['#el1'], errorOperation);
      
      expect(results).toEqual([false]);
      expect(consoleError).toHaveBeenCalledWith('DOMManager batch operation error:', expect.any(Error));
      
      consoleError.mockRestore();
    });
  });
});