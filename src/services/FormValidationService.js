/**
 * FormValidation Service - Provides validation utilities for forms
 * Communicates with components via the EventBus
 */
import eventBus from '../core/EventBus.js';

export class FormValidationService {
  constructor(config = {}) {
    // Default configuration
    this.config = {
      validateOnChange: true,
      validateOnBlur: true,
      showValidationMessages: true,
      errorClass: 'form-error',
      validClass: 'form-valid',
      errorMessageClass: 'error-message',
      ...config
    };
    
    // Track validation state
    this.validationState = new Map();
    
    // Bind methods
    this.validateField = this.validateField.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    
    // Event subscriptions
    this.unsubscribers = [];
  }
  
  /**
   * Initialize the service - called by the module loader
   */
  init() {
    console.log('Initializing FormValidationService');
    
    // Subscribe to events
    this.unsubscribers.push(
      eventBus.subscribe('form.field.change', this.handleFieldChange),
      eventBus.subscribe('form.submit', this.handleFormSubmit)
    );
    
    // Attach validation listeners to form fields
    if (this.config.validateOnChange || this.config.validateOnBlur) {
      document.querySelectorAll('input, select, textarea').forEach(field => {
        const id = field.id || field.name;
        if (!id) return;
        
        if (this.config.validateOnChange) {
          field.addEventListener('input', () => {
            this.validateField(field);
          });
        }
        
        if (this.config.validateOnBlur) {
          field.addEventListener('blur', () => {
            this.validateField(field);
          });
        }
      });
    }
    
    return this;
  }
  
  /**
   * Clean up resources when the service is destroyed
   */
  destroy() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
  }
  
  /**
   * Handle field changes
   * @param {Object} data - Field change event data
   */
  handleFieldChange(data) {
    const field = data.field || document.getElementById(data.fieldId);
    if (field) {
      this.validateField(field);
    }
  }
  
  /**
   * Handle form submission
   * @param {Object} data - Form submit event data
   */
  handleFormSubmit(data) {
    const form = data.event.target;
    const isValid = this.validateForm(form);
    
    // Publish validation result
    eventBus.publish('form.validated', {
      form,
      isValid,
      validationState: this.getValidationState(form)
    });
    
    // Prevent form submission if invalid
    if (!isValid) {
      data.event.preventDefault();
      
      // Focus the first invalid field
      const firstInvalidField = form.querySelector(`.${this.config.errorClass}`);
      if (firstInvalidField) {
        firstInvalidField.focus();
      }
      
      // Scroll to the first error
      const firstError = form.querySelector(`.${this.config.errorMessageClass}`);
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
  
  /**
   * Validate a single form field
   * @param {HTMLElement} field - The field to validate
   * @returns {boolean} - Whether the field is valid
   */
  validateField(field) {
    const id = field.id || field.name;
    if (!id) return true;
    
    // Get validation rules based on HTML attributes
    const rules = this.getFieldRules(field);
    
    // Check if empty and required
    const isEmpty = !field.value.trim();
    if (rules.required && isEmpty) {
      this.setFieldInvalid(field, 'This field is required');
      return false;
    }
    
    // Skip other validations if empty and not required
    if (isEmpty) {
      this.setFieldValid(field);
      return true;
    }
    
    // Email validation
    if (rules.type === 'email' && !this.isValidEmail(field.value)) {
      this.setFieldInvalid(field, 'Please enter a valid email address');
      return false;
    }
    
    // Phone number validation
    if (rules.type === 'tel' && !this.isValidPhone(field.value)) {
      this.setFieldInvalid(field, 'Please enter a valid phone number');
      return false;
    }
    
    // Min length validation
    if (rules.minLength && field.value.length < rules.minLength) {
      this.setFieldInvalid(field, `Must be at least ${rules.minLength} characters`);
      return false;
    }
    
    // Max length validation
    if (rules.maxLength && field.value.length > rules.maxLength) {
      this.setFieldInvalid(field, `Must not exceed ${rules.maxLength} characters`);
      return false;
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(field.value)) {
      this.setFieldInvalid(field, rules.patternMessage || 'Please match the requested format');
      return false;
    }
    
    // Custom validation if provided
    if (rules.customValidator && !rules.customValidator(field.value, field)) {
      this.setFieldInvalid(field, rules.customMessage || 'Invalid input');
      return false;
    }
    
    // Field is valid
    this.setFieldValid(field);
    return true;
  }
  
  /**
   * Validate an entire form
   * @param {HTMLFormElement} form - The form to validate
   * @returns {boolean} - Whether the form is valid
   */
  validateForm(form) {
    let isFormValid = true;
    
    // Validate each field
    form.querySelectorAll('input, select, textarea').forEach(field => {
      const fieldValid = this.validateField(field);
      if (!fieldValid) {
        isFormValid = false;
      }
    });
    
    return isFormValid;
  }
  
  /**
   * Get validation rules from field attributes
   * @param {HTMLElement} field - The form field
   * @returns {Object} - The validation rules
   */
  getFieldRules(field) {
    return {
      required: field.hasAttribute('required'),
      type: field.getAttribute('type'),
      minLength: field.getAttribute('minlength') ? parseInt(field.getAttribute('minlength')) : null,
      maxLength: field.getAttribute('maxlength') ? parseInt(field.getAttribute('maxlength')) : null,
      pattern: field.getAttribute('pattern') ? new RegExp(field.getAttribute('pattern')) : null,
      patternMessage: field.getAttribute('data-pattern-message'),
      customValidator: field.getAttribute('data-validator-fn') ? 
        window[field.getAttribute('data-validator-fn')] : null,
      customMessage: field.getAttribute('data-error-message')
    };
  }
  
  /**
   * Mark a field as invalid
   * @param {HTMLElement} field - The form field
   * @param {string} message - The error message
   */
  setFieldInvalid(field, message) {
    const id = field.id || field.name;
    
    // Add error class
    field.classList.add(this.config.errorClass);
    field.classList.remove(this.config.validClass);
    
    // Set ARIA attributes
    field.setAttribute('aria-invalid', 'true');
    
    // Display error message if enabled
    if (this.config.showValidationMessages) {
      // Look for an error container
      let errorContainer = document.getElementById(`${id}-error`);
      
      // If no dedicated error container, create one
      if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = `${id}-error`;
        errorContainer.className = this.config.errorMessageClass;
        errorContainer.setAttribute('aria-live', 'polite');
        
        field.parentNode.insertBefore(errorContainer, field.nextSibling);
      }
      
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
      field.setAttribute('aria-describedby', errorContainer.id);
    }
    
    // Update validation state
    this.validationState.set(id, {
      valid: false,
      message,
      field
    });
    
    // Publish field validation event
    eventBus.publish('form.field.validated', {
      field,
      id,
      valid: false,
      message
    });
  }
  
  /**
   * Mark a field as valid
   * @param {HTMLElement} field - The form field
   */
  setFieldValid(field) {
    const id = field.id || field.name;
    
    // Update classes
    field.classList.remove(this.config.errorClass);
    field.classList.add(this.config.validClass);
    
    // Update ARIA attributes
    field.setAttribute('aria-invalid', 'false');
    
    // Hide error message
    const errorContainer = document.getElementById(`${id}-error`);
    if (errorContainer) {
      errorContainer.style.display = 'none';
      errorContainer.textContent = '';
    }
    
    // Remove aria-describedby if it was pointing to the error
    if (field.getAttribute('aria-describedby') === `${id}-error`) {
      field.removeAttribute('aria-describedby');
    }
    
    // Update validation state
    this.validationState.set(id, {
      valid: true,
      field
    });
    
    // Publish field validation event
    eventBus.publish('form.field.validated', {
      field,
      id,
      valid: true
    });
  }
  
  /**
   * Get the current validation state for a form
   * @param {HTMLFormElement} form - The form to get state for
   * @returns {Object} - The validation state
   */
  getValidationState(form) {
    const state = {
      valid: true,
      fields: {}
    };
    
    // Collect state for each field in the form
    form.querySelectorAll('input, select, textarea').forEach(field => {
      const id = field.id || field.name;
      if (!id) return;
      
      const fieldState = this.validationState.get(id) || { valid: true };
      state.fields[id] = fieldState;
      
      if (!fieldState.valid) {
        state.valid = false;
      }
    });
    
    return state;
  }
  
  // Validation helper methods
  
  /**
   * Check if an email address is valid
   * @param {string} email - The email to validate
   * @returns {boolean} - Whether the email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
  
  /**
   * Check if a phone number is valid
   * @param {string} phone - The phone number to validate
   * @returns {boolean} - Whether the phone number is valid
   */
  isValidPhone(phone) {
    // Accept a variety of formats, with or without country code
    // Removes spaces, dashes, parentheses before testing
    const normalized = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+?[0-9]{1,3})?[0-9]{10,14}$/;
    return phoneRegex.test(normalized);
  }
}

export default FormValidationService;
