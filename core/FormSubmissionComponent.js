/**
 * FormSubmissionComponent - Enhanced form submission with EventBus integration
 * Handles form data collection, validation, and submission using the EventBus architecture
 */
import { BaseComponent } from './ComponentRegistry.js';
import DOMManager from './DOMManager.js';
import EventDefinitions from './EventDefinitions.js';

export class FormSubmissionComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.config = {
      formId: 'booking-form',
      submitButtonId: 'submit-booking',
      apiEndpoint: '/api/bookings',
      timeout: 30000,
      retryAttempts: 3,
      validateBeforeSubmit: true,
      ...options.config
    };
    
    this.state = {
      isSubmitting: false,
      formData: {},
      validationErrors: {},
      submitAttempts: 0
    };
    
    // Bind methods
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.processFormSubmission = this.processFormSubmission.bind(this);
    this.validateFormData = this.validateFormData.bind(this);
    this.submitFormData = this.submitFormData.bind(this);
  }
  
  async onInitialize() {
    console.log('📝 Initializing FormSubmissionComponent');
    
    // Get form element using DOMManager
    this.form = DOMManager.getElementById(this.config.formId);
    this.submitButton = DOMManager.getElementById(this.config.submitButtonId);
    
    if (!this.form) {
      this.eventBus.emit(EventDefinitions.EVENTS.ERROR.UI_ERROR, {
        component: this.componentId,
        message: 'Booking form not found',
        elementId: this.config.formId,
        timestamp: Date.now()
      });
      return;
    }
    
    // Set up form submission listener
    this.setupFormSubmissionListener();
    
    // Set up EventBus listeners
    this.setupEventBusListeners();
    
    console.log('✅ FormSubmissionComponent initialized successfully');
  }
  
  /**
   * Set up form submission event listener
   */
  setupFormSubmissionListener() {
    DOMManager.addEventListener(this.form, 'submit', this.handleFormSubmit);
    
    // Also listen for programmatic submission events
    this.eventBus.on(EventDefinitions.EVENTS.FORM.SUBMIT, this.processFormSubmission);
    
    console.log('🔗 Form submission listener bound');
  }
  
  /**
   * Set up EventBus event listeners
   */
  setupEventBusListeners() {
    // Listen for form submission requests
    this.eventBus.on(EventDefinitions.EVENTS.FORM.SUBMISSION_REQUESTED, 
                     this.processFormSubmission);
    
    // Listen for form reset requests
    this.eventBus.on(EventDefinitions.EVENTS.FORM.RESET, 
                     this.handleFormReset.bind(this));
    
    // Listen for loading state changes
    this.eventBus.on(EventDefinitions.EVENTS.UI.LOADING_SHOW, 
                     this.handleLoadingStateChange.bind(this));
    this.eventBus.on(EventDefinitions.EVENTS.UI.LOADING_HIDE, 
                     this.handleLoadingStateChange.bind(this));
    
    // Listen for validation events
    this.eventBus.on(EventDefinitions.EVENTS.FORM.VALIDATION_REQUESTED, 
                     this.handleValidationRequest.bind(this));
    
    console.log('🎧 EventBus listeners set up for form submission');
  }
  
  /**
   * Handle form submit event from DOM
   * @param {Event} event - Form submit event
   */
  handleFormSubmit(event) {
    event.preventDefault();
    
    console.log('📝 Form submission initiated by user');
    
    // Emit form submission event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_REQUESTED, 
      EventDefinitions.createFormPayload(this.config.formId, null, {
        source: 'user-submit',
        component: this.componentId
      })
    );
  }
  
  /**
   * Process form submission
   * @param {Object} data - Submission event data
   */
  async processFormSubmission(data = {}) {
    if (this.state.isSubmitting) {
      console.warn('⚠️ Form submission already in progress');
      return;
    }
    
    console.log('🔄 Processing form submission...', data);
    
    try {
      // Set submitting state
      this.state.isSubmitting = true;
      this.state.submitAttempts++;
      
      // Emit submission started event
      this.eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_STARTED, 
        EventDefinitions.createFormPayload(this.config.formId, null, {
          source: data.source || 'manual',
          attempt: this.state.submitAttempts,
          component: this.componentId
        })
      );
      
      // Show loading state
      this.setLoadingState(true);
      
      // Collect form data
      const formData = this.collectFormData();
      this.state.formData = formData;
      
      // Emit data collected event
      this.eventBus.emit(EventDefinitions.EVENTS.FORM.DATA_PROCESSED, {
        formId: this.config.formId,
        data: formData,
        fieldCount: Object.keys(formData).length,
        timestamp: Date.now()
      });
      
      // Validate form data if enabled
      if (this.config.validateBeforeSubmit) {
        const validationResult = this.validateFormData(formData);
        
        if (!validationResult.isValid) {
          this.handleValidationFailure(validationResult);
          return;
        }
      }
      
      // Submit form data
      const submissionResult = await this.submitFormData(formData);
      
      // Handle successful submission
      this.handleSubmissionSuccess(submissionResult);
      
    } catch (error) {
      // Handle submission failure
      this.handleSubmissionFailure(error);
    } finally {
      // Reset submitting state
      this.state.isSubmitting = false;
      this.setLoadingState(false);
    }
  }
  
  /**
   * Collect form data from DOM using DOMManager
   * @returns {Object} Collected form data
   */
  collectFormData() {
    console.log('📋 Collecting form data...');
    
    const formData = {};
    
    // Get form fields using DOMManager
    const formFieldsConfig = {
      'from-location': { required: true, type: 'location' },
      'to-address': { required: true, type: 'location' },
      'booking-datetime': { required: true, type: 'datetime' },
      'experience-dropdown': { required: false, type: 'select' },
      'passenger-count': { required: false, type: 'number' },
      'contact-email': { required: false, type: 'email' },
      'contact-phone': { required: false, type: 'phone' },
      'special-notes': { required: false, type: 'text' }
    };
    
    // Collect standard form fields
    Object.entries(formFieldsConfig).forEach(([fieldId, config]) => {
      const element = DOMManager.getElementById(fieldId);
      if (element) {
        const value = DOMManager.getValue(element);
        if (value || config.required) {
          formData[fieldId] = value;
        }
      }
    });
    
    // Collect vehicle selection
    const vehicleElement = DOMManager.querySelector('input[name^="vehicle_type_"]:checked');
    if (vehicleElement) {
      formData.vehicleType = DOMManager.getValue(vehicleElement);
      formData.vehicleCategory = DOMManager.getAttribute(vehicleElement, 'name').replace('vehicle_type_', '');
    }
    
    // Collect additional dynamic fields based on experience type
    const experienceType = formData['experience-dropdown'];
    if (experienceType) {
      formData.experienceFields = this.collectExperienceSpecificFields(experienceType);
    }
    
    // Add metadata
    formData._metadata = {
      submissionTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      formVersion: '1.0',
      componentId: this.componentId
    };
    
    console.log(`✅ Collected form data with ${Object.keys(formData).length} fields`);
    return formData;
  }
  
  /**
   * Collect experience-specific fields
   * @param {string} experienceType - Type of experience
   * @returns {Object} Experience-specific data
   */
  collectExperienceSpecificFields(experienceType) {
    const experienceData = {};
    
    switch (experienceType) {
      case 'hourly_chauffeur':
        const duration = DOMManager.getValue(DOMManager.getElementById('duration-hours'));
        if (duration) experienceData.duration = duration;
        break;
        
      case 'water_sky':
        const waterOptions = DOMManager.querySelectorAll('#water-sky-options input:checked');
        experienceData.waterOptions = Array.from(waterOptions).map(el => DOMManager.getValue(el));
        break;
        
      case 'tours_excursions':
        const tourOptions = DOMManager.querySelectorAll('#wynwood-night-options input:checked');
        experienceData.tourOptions = Array.from(tourOptions).map(el => DOMManager.getValue(el));
        break;
        
      case 'miami_relocation':
        const relocationNotes = DOMManager.getValue(DOMManager.getElementById('relocation-notes'));
        if (relocationNotes) experienceData.relocationNotes = relocationNotes;
        break;
    }
    
    return experienceData;
  }
  
  /**
   * Validate form data
   * @param {Object} formData - Form data to validate
   * @returns {Object} Validation result
   */
  validateFormData(formData) {
    console.log('🔍 Validating form data...');
    
    const errors = {};
    const warnings = [];
    
    // Required field validation
    if (!formData['from-location']) {
      errors.fromLocation = 'Pickup location is required';
    }
    
    if (!formData['to-address']) {
      errors.toAddress = 'Destination is required';
    }
    
    if (!formData['booking-datetime']) {
      errors.dateTime = 'Date and time are required';
    }
    
    if (!formData.vehicleType) {
      errors.vehicleType = 'Please select a vehicle';
    }
    
    // Business rule validation
    if (formData['from-location'] && formData['to-address']) {
      if (formData['from-location'] === formData['to-address']) {
        errors.locations = 'Pickup and destination cannot be the same';
      }
    }
    
    // DateTime validation
    if (formData['booking-datetime']) {
      const bookingDate = new Date(formData['booking-datetime']);
      const now = new Date();
      
      if (bookingDate <= now) {
        errors.dateTime = 'Booking time must be in the future';
      }
      
      if (bookingDate.getTime() - now.getTime() < 2 * 60 * 60 * 1000) {
        warnings.push('Bookings with less than 2 hours notice may incur additional fees');
      }
    }
    
    // Email validation
    if (formData['contact-email']) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData['contact-email'])) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    // Phone validation
    if (formData['contact-phone']) {
      const phoneRegex = /^\+?[\d\s()-]{10,20}$/;
      if (!phoneRegex.test(formData['contact-phone'])) {
        errors.phone = 'Please enter a valid phone number';
      }
    }
    
    const isValid = Object.keys(errors).length === 0;
    
    // Store validation errors in state
    this.state.validationErrors = errors;
    
    const validationResult = {
      isValid,
      errors,
      warnings,
      fieldCount: Object.keys(formData).length,
      errorCount: Object.keys(errors).length,
      warningCount: warnings.length
    };
    
    // Emit validation result event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.VALIDATED, 
      EventDefinitions.createValidationPayload(
        this.config.formId,
        isValid,
        Object.values(errors),
        'form-submission'
      )
    );
    
    console.log(`🔍 Validation complete: ${isValid ? 'PASSED' : 'FAILED'} (${Object.keys(errors).length} errors)`);
    return validationResult;
  }
  
  /**
   * Submit form data to the API
   * @param {Object} formData - Form data to submit
   * @returns {Promise<Object>} API response
   */
  async submitFormData(formData) {
    console.log('📤 Submitting form data to API...');
    
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formData),
        signal: AbortSignal.timeout(this.config.timeout)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `API Error: ${response.status} ${response.statusText}`);
      }
      
      console.log('✅ Form submitted successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Form submission failed:', error);
      
      // Emit API error event
      this.eventBus.emit(EventDefinitions.EVENTS.ERROR.API, {
        endpoint: this.config.apiEndpoint,
        error: error.message,
        formData: { ...formData, _metadata: undefined }, // Exclude metadata
        component: this.componentId,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  /**
   * Handle validation failure
   * @param {Object} validationResult - Validation result
   */
  handleValidationFailure(validationResult) {
    console.warn('⚠️ Form validation failed:', validationResult);
    
    // Emit validation failure event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_FAILED, 
      EventDefinitions.createFormPayload(this.config.formId, validationResult, {
        reason: 'validation-failed',
        component: this.componentId
      })
    );
    
    // Show validation errors
    Object.entries(validationResult.errors).forEach(([field, message]) => {
      this.eventBus.emit(EventDefinitions.EVENTS.ERROR.SHOW, {
        fieldId: this.mapValidationFieldToDOM(field),
        message,
        severity: 'error',
        source: this.componentId,
        timestamp: Date.now()
      });
    });
    
    // Show warnings if any
    validationResult.warnings.forEach(warning => {
      this.eventBus.emit(EventDefinitions.EVENTS.UI.WARNING_MESSAGE, {
        message: warning,
        dismissible: true,
        duration: 5000,
        timestamp: Date.now()
      });
    });
  }
  
  /**
   * Handle successful submission
   * @param {Object} result - API response
   */
  handleSubmissionSuccess(result) {
    console.log('🎉 Form submission successful:', result);
    
    // Emit submission success event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_SUCCEEDED, 
      EventDefinitions.createFormPayload(this.config.formId, result, {
        component: this.componentId,
        attempt: this.state.submitAttempts
      })
    );
    
    // Show success message
    this.eventBus.emit(EventDefinitions.EVENTS.UI.SUCCESS_MESSAGE, {
      message: result.message || 'Booking confirmed successfully!',
      duration: 8000,
      timestamp: Date.now()
    });
    
    // Request form reset
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.RESET, {
      formId: this.config.formId,
      source: 'submission-success',
      preserveData: false,
      timestamp: Date.now()
    });
    
    // Track successful submission
    this.eventBus.emit(EventDefinitions.EVENTS.ANALYTICS.TRACK, {
      event: 'booking_submitted',
      properties: {
        vehicle_type: this.state.formData.vehicleType,
        experience_type: this.state.formData['experience-dropdown'],
        submission_attempt: this.state.submitAttempts,
        form_completion_time: Date.now() - (this.state.formData._metadata?.submissionTime || Date.now())
      },
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle submission failure
   * @param {Error} error - Submission error
   */
  handleSubmissionFailure(error) {
    console.error('❌ Form submission failed:', error);
    
    // Emit submission failure event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_FAILED, 
      EventDefinitions.createFormPayload(this.config.formId, { error: error.message }, {
        reason: 'api-error',
        component: this.componentId,
        attempt: this.state.submitAttempts
      })
    );
    
    // Show error message
    this.eventBus.emit(EventDefinitions.EVENTS.ERROR.SHOW, {
      fieldId: 'submit-button',
      message: `Submission failed: ${error.message}`,
      severity: 'error',
      source: this.componentId,
      timestamp: Date.now()
    });
    
    // Show retry option if within retry limits
    if (this.state.submitAttempts < this.config.retryAttempts) {
      this.eventBus.emit(EventDefinitions.EVENTS.UI.RETRY_OPTION, {
        message: `Attempt ${this.state.submitAttempts} of ${this.config.retryAttempts} failed. Would you like to retry?`,
        retryAction: () => this.processFormSubmission({ source: 'retry' }),
        timestamp: Date.now()
      });
    }
    
    // Track failed submission
    this.eventBus.emit(EventDefinitions.EVENTS.ANALYTICS.TRACK, {
      event: 'booking_submission_failed',
      properties: {
        error_message: error.message,
        submission_attempt: this.state.submitAttempts,
        form_data_complete: Object.keys(this.state.formData).length > 0
      },
      timestamp: Date.now()
    });
  }
  
  /**
   * Set loading state for submit button
   * @param {boolean} isLoading - Loading state
   */
  setLoadingState(isLoading) {
    if (!this.submitButton) return;
    
    if (isLoading) {
      DOMManager.setAttribute(this.submitButton, 'disabled', 'disabled');
      DOMManager.setHTML(this.submitButton, '<span class="spinner"></span> Processing...');
      DOMManager.addClass(this.submitButton, 'loading');
    } else {
      DOMManager.removeAttribute(this.submitButton, 'disabled');
      DOMManager.setHTML(this.submitButton, 'Submit Booking');
      DOMManager.removeClass(this.submitButton, 'loading');
    }
    
    // Emit loading state event
    this.eventBus.emit(EventDefinitions.EVENTS.UI.LOADING_STARTED + (isLoading ? '' : '_ENDED'), {
      elementId: this.config.submitButtonId,
      isLoading,
      component: this.componentId,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle form reset request
   * @param {Object} data - Reset event data
   */
  handleFormReset(data) {
    if (data.formId !== this.config.formId) return;
    
    console.log('🔄 Resetting form...', data);
    
    // Reset form using DOMManager
    if (this.form) {
      this.form.reset();
    }
    
    // Clear state
    this.state.formData = {};
    this.state.validationErrors = {};
    this.state.submitAttempts = 0;
    
    // Clear all errors
    this.eventBus.emit(EventDefinitions.EVENTS.ERROR.CLEAR_ALL, {
      source: this.componentId,
      timestamp: Date.now()
    });
    
    console.log('✅ Form reset complete');
  }
  
  /**
   * Handle loading state change events
   * @param {Object} data - Loading state data
   */
  handleLoadingStateChange(data) {
    if (data.elementId === this.config.submitButtonId) {
      // Loading state is handled by setLoadingState method
      return;
    }
  }
  
  /**
   * Handle validation requests
   * @param {Object} data - Validation request data
   */
  handleValidationRequest(data) {
    if (data.formId === this.config.formId) {
      const formData = this.collectFormData();
      this.validateFormData(formData);
    }
  }
  
  /**
   * Map validation field names to DOM element IDs
   * @param {string} validationField - Validation field name
   * @returns {string} DOM element ID
   */
  mapValidationFieldToDOM(validationField) {
    const fieldMapping = {
      fromLocation: 'from-location',
      toAddress: 'to-address',
      dateTime: 'booking-datetime',
      vehicleType: 'vehicle-selection',
      email: 'contact-email',
      phone: 'contact-phone',
      locations: 'from-location' // Show on first location field for location conflicts
    };
    
    return fieldMapping[validationField] || validationField;
  }
  
  /**
   * Get current form state
   * @returns {Object} Current state
   */
  getState() {
    return {
      isSubmitting: this.state.isSubmitting,
      hasData: Object.keys(this.state.formData).length > 0,
      hasErrors: Object.keys(this.state.validationErrors).length > 0,
      submitAttempts: this.state.submitAttempts,
      lastFormData: { ...this.state.formData }
    };
  }
  
  /**
   * Clean up resources when component is destroyed
   */
  async onDestroy() {
    // Remove DOM event listeners
    if (this.form) {
      DOMManager.removeEventListener(this.form, 'submit', this.handleFormSubmit);
    }
    
    // Remove EventBus listeners
    this.eventBus.off(EventDefinitions.EVENTS.FORM.SUBMISSION_REQUESTED, this.processFormSubmission);
    this.eventBus.off(EventDefinitions.EVENTS.FORM.RESET, this.handleFormReset);
    
    // Clear state
    this.state = {
      isSubmitting: false,
      formData: {},
      validationErrors: {},
      submitAttempts: 0
    };
    
    console.log('🗑️ FormSubmissionComponent destroyed');
  }
}

export default FormSubmissionComponent;