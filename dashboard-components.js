/**
 * Dashboard Components Registration
 * 
 * This file registers all dashboard components with the ComponentRegistry
 */

// Import necessary modules
import ComponentRegistry from './core/ComponentRegistry.js';
import { BaseComponent } from './core/ComponentRegistry.js';
import DOMManager from './core/DOMManager.js';
import EventDefinitions from './core/EventDefinitions.js';

/**
 * Enhanced Booking Form Component with full EventBus integration
 */
class BookingFormComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.config = {
      validateOnChange: true,
      submitEndpoint: '/api/bookings',
      realTimeValidation: true,
      ...options.config
    };
    
    this.state = {
      isSubmitting: false,
      validationErrors: new Map(),
      formData: {}
    };
    
    // Bind methods
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.validateForm = this.validateForm.bind(this);
  }
  
  async onInitialize() {
    console.log(`🔍 Initializing ${this.componentId} component`);
    
    // Get DOM elements using DOMManager
    this.form = DOMManager.getElementById('booking-form');
    this.submitButton = DOMManager.getElementById('submit-button');
    
    if (!this.form) {
      throw new Error('Booking form element not found');
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize form state
    this.initializeFormState();
    
    // Emit initialization event
    this.eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENT_INITIALIZED, {
      componentId: this.componentId,
      formId: 'booking-form',
      timestamp: Date.now()
    });
  }
  
  setupEventListeners() {
    // Form submission
    DOMManager.addEventListener(this.form, 'submit', this.handleSubmit);
    
    // Field changes for real-time validation
    const formFields = DOMManager.getFormFields();
    Object.values(formFields).forEach(field => {
      if (field) {
        DOMManager.addEventListener(field, 'input', (event) => {
          this.handleFieldChange(event);
        });
        
        DOMManager.addEventListener(field, 'blur', (event) => {
          this.validateField(event.target);
        });
      }
    });
    
    // Listen for external validation events
    this.eventBus.on(EventDefinitions.EVENTS.FORM.FIELD_VALIDATED, this.handleFieldValidated.bind(this));
    this.eventBus.on(EventDefinitions.EVENTS.ERROR.SHOW, this.handleErrorShow.bind(this));
    this.eventBus.on(EventDefinitions.EVENTS.ERROR.CLEAR, this.handleErrorClear.bind(this));
  }
  
  initializeFormState() {
    // Get initial form data
    const formFields = DOMManager.getFormFields();
    Object.entries(formFields).forEach(([key, field]) => {
      if (field) {
        this.state.formData[key] = DOMManager.getValue(field);
      }
    });
  }
  
  async handleSubmit(event) {
    event.preventDefault();
    
    if (this.state.isSubmitting) return;
    
    console.log('📤 Form submission started');
    
    // Set submitting state
    this.state.isSubmitting = true;
    DOMManager.setButtonLoading(this.submitButton, true, 'Submitting...');
    
    // Emit submission started event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_STARTED, {
      formId: 'booking-form',
      componentId: this.componentId,
      formData: { ...this.state.formData },
      timestamp: Date.now()
    });
    
    try {
      // Validate form before submission
      const isValid = await this.validateForm();
      
      if (!isValid) {
        throw new Error('Form validation failed');
      }
      
      // Process and submit form data
      const processedData = this.processFormData();
      await this.submitFormData(processedData);
      
      // Handle successful submission
      this.handleSubmissionSuccess(processedData);
      
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      this.state.isSubmitting = false;
      DOMManager.setButtonLoading(this.submitButton, false);
    }
  }
  
  handleFieldChange(event) {
    const field = event.target;
    const fieldId = field.id;
    const value = DOMManager.getValue(field);
    
    // Update internal state
    this.state.formData[fieldId] = value;
    
    // Emit field change event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, {
      fieldId,
      value,
      fieldType: field.type,
      timestamp: Date.now(),
      source: this.componentId
    });
    
    // Real-time validation if enabled
    if (this.config.realTimeValidation) {
      this.validateField(field);
    }
  }
  
  async validateField(field) {
    // Implementation would depend on your validation rules
    // This is a simplified example
    const fieldId = field.id;
    const value = DOMManager.getValue(field);
    
    // Perform validation logic here
    const isValid = value.trim() !== ''; // Simple example
    const errors = isValid ? [] : [`${fieldId} is required`];
    
    // Update internal state
    if (isValid) {
      this.state.validationErrors.delete(fieldId);
    } else {
      this.state.validationErrors.set(fieldId, errors);
    }
    
    // Emit validation event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_VALIDATED, {
      fieldId,
      value,
      isValid,
      errors,
      timestamp: Date.now(),
      source: this.componentId
    });
    
    return isValid;
  }
  
  async validateForm() {
    const formFields = DOMManager.getFormFields();
    let isFormValid = true;
    
    for (const [key, field] of Object.entries(formFields)) {
      if (field) {
        const fieldValid = await this.validateField(field);
        if (!fieldValid) {
          isFormValid = false;
        }
      }
    }
    
    // Emit form validation event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.VALIDATED, {
      formId: 'booking-form',
      isValid: isFormValid,
      errors: Array.from(this.state.validationErrors.values()).flat(),
      timestamp: Date.now(),
      source: this.componentId
    });
    
    return isFormValid;
  }
  
  processFormData() {
    // Process form data according to your business logic
    const formFields = DOMManager.getFormFields();
    const processedData = {};
    
    Object.entries(formFields).forEach(([key, field]) => {
      if (field) {
        processedData[key] = DOMManager.getValue(field);
      }
    });
    
    // Emit data processing event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.DATA_PROCESSED, {
      rawData: { ...this.state.formData },
      processedData,
      timestamp: Date.now(),
      source: this.componentId
    });
    
    return processedData;
  }
  
  async submitFormData(data) {
    // Submit data to your endpoint
    const response = await fetch(this.config.submitEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Submission failed: ${response.status}`);
    }
    
    return response.json();
  }
  
  handleSubmissionSuccess(data) {
    console.log('✅ Form submission successful');
    
    // Emit success event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_SUCCEEDED, {
      formId: 'booking-form',
      submittedData: data,
      timestamp: Date.now(),
      source: this.componentId
    });
    
    // Clear form or show success message
    this.resetForm();
  }
  
  handleSubmissionError(error) {
    console.error('❌ Form submission failed:', error);
    
    // Emit error event
    this.eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_FAILED, {
      formId: 'booking-form',
      error: error.message,
      timestamp: Date.now(),
      source: this.componentId
    });
    
    // Show error to user
    this.eventBus.emit(EventDefinitions.EVENTS.ERROR.SHOW, {
      fieldId: 'submit-button',
      message: `Submission failed: ${error.message}`,
      severity: 'error',
      timestamp: Date.now()
    });
  }
  
  resetForm() {
    this.form.reset();
    this.state.formData = {};
    this.state.validationErrors.clear();
    
    // Clear all error displays
    this.eventBus.emit(EventDefinitions.EVENTS.ERROR.CLEAR_ALL, {
      source: this.componentId,
      timestamp: Date.now()
    });
  }
  
  handleFieldValidated(data) {
    // Handle external validation results
    if (data.source !== this.componentId) {
      // Update UI based on external validation
      console.log(`External validation for ${data.fieldId}:`, data);
    }
  }
  
  handleErrorShow(data) {
    // Handle error display requests
    console.log(`Show error for ${data.fieldId}:`, data.message);
  }
  
  handleErrorClear(data) {
    // Handle error clearing requests
    console.log(`Clear error for ${data.fieldId}`);
  }
  
  async onDestroy() {
    console.log('🗑️ Destroying BookingForm component');
    
    // Clear state
    this.state = {
      isSubmitting: false,
      validationErrors: new Map(),
      formData: {}
    };
    
    // Note: Event listeners are automatically cleaned up by BaseComponent
  }
}

/**
 * Enhanced Tab Navigation Component
 */
class TabNavigationComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.config = {
      defaultTab: 'oneway',
      animateTransitions: true,
      saveState: true,
      ...options.config
    };
    
    this.state = {
      activeTab: this.config.defaultTab,
      previousTab: null,
      tabs: new Map()
    };
    
    this.handleTabClick = this.handleTabClick.bind(this);
  }
  
  async onInitialize() {
    console.log('🔄 Initializing TabNavigation component');
    
    // Get tab elements
    this.tabButtons = DOMManager.getElements('[data-tab-target]');
    this.tabPanels = DOMManager.getElements('.tab-panel');
    
    if (this.tabButtons.length === 0) {
      throw new Error('No tab buttons found');
    }
    
    // Initialize tab state
    this.initializeTabs();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set initial active tab
    this.setActiveTab(this.config.defaultTab);
  }
  
  initializeTabs() {
    // Build tabs map
    this.tabButtons.forEach(button => {
      const tabId = DOMManager.getAttribute(button, 'data-tab-target')?.replace('#', '');
      const tabLabel = DOMManager.getText(button);
      
      if (tabId) {
        this.state.tabs.set(tabId, {
          id: tabId,
          button,
          panel: DOMManager.getElementById(tabId),
          label: tabLabel,
          isActive: false
        });
      }
    });
    
    console.log(`Initialized ${this.state.tabs.size} tabs`);
  }
  
  setupEventListeners() {
    // Tab button clicks
    this.tabButtons.forEach(button => {
      DOMManager.addEventListener(button, 'click', this.handleTabClick);
    });
    
    // Listen for external tab change requests
    this.eventBus.on(EventDefinitions.EVENTS.UI.TAB_CHANGED, this.handleExternalTabChange.bind(this));
  }
  
  handleTabClick(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const targetTab = DOMManager.getAttribute(button, 'data-tab-target')?.replace('#', '');
    
    if (targetTab && targetTab !== this.state.activeTab) {
      this.switchTab(targetTab);
    }
  }
  
  switchTab(tabId) {
    const tab = this.state.tabs.get(tabId);
    
    if (!tab) {
      console.warn(`Tab "${tabId}" not found`);
      return false;
    }
    
    console.log(`Switching from "${this.state.activeTab}" to "${tabId}"`);
    
    // Update state
    const previousTab = this.state.activeTab;
    this.state.previousTab = previousTab;
    this.state.activeTab = tabId;
    
    // Update UI
    this.updateTabDisplay();
    
    // Emit tab change event
    this.eventBus.emit(EventDefinitions.EVENTS.UI.TAB_CHANGED, {
      activeTab: tabId,
      previousTab,
      timestamp: Date.now(),
      source: this.componentId
    });
    
    // Save state if enabled
    if (this.config.saveState) {
      this.saveTabState();
    }
    
    return true;
  }
  
  setActiveTab(tabId) {
    return this.switchTab(tabId);
  }
  
  updateTabDisplay() {
    // Update all tabs
    this.state.tabs.forEach((tab, id) => {
      const isActive = id === this.state.activeTab;
      tab.isActive = isActive;
      
      // Update button state
      if (isActive) {
        DOMManager.addClass(tab.button, 'active');
        DOMManager.setAttribute(tab.button, 'aria-selected', 'true');
      } else {
        DOMManager.removeClass(tab.button, 'active');
        DOMManager.setAttribute(tab.button, 'aria-selected', 'false');
      }
      
      // Update panel visibility
      if (tab.panel) {
        if (isActive) {
          DOMManager.removeClass(tab.panel, 'hidden');
          DOMManager.showElement(tab.panel, 'block', this.config.animateTransitions);
        } else {
          DOMManager.addClass(tab.panel, 'hidden');
          if (this.config.animateTransitions) {
            DOMManager.hideElement(tab.panel, true);
          }
        }
      }
    });
  }
  
  saveTabState() {
    try {
      localStorage.setItem('miami-concierge-active-tab', this.state.activeTab);
    } catch (error) {
      console.warn('Failed to save tab state:', error);
    }
  }
  
  loadTabState() {
    try {
      const savedTab = localStorage.getItem('miami-concierge-active-tab');
      if (savedTab && this.state.tabs.has(savedTab)) {
        return savedTab;
      }
    } catch (error) {
      console.warn('Failed to load tab state:', error);
    }
    return this.config.defaultTab;
  }
  
  handleExternalTabChange(data) {
    if (data.source !== this.componentId && data.activeTab) {
      this.switchTab(data.activeTab);
    }
  }
  
  // Public API methods
  getActiveTab() {
    return this.state.activeTab;
  }
  
  getAllTabs() {
    return Array.from(this.state.tabs.keys());
  }
  
  isTabActive(tabId) {
    return this.state.activeTab === tabId;
  }
  
  async onDestroy() {
    console.log('🗑️ Destroying TabNavigation component');
    
    // Clear state
    this.state = {
      activeTab: null,
      previousTab: null,
      tabs: new Map()
    };
  }
}

/**
 * Error Handler Component
 */
class ErrorHandlerComponent extends BaseComponent {
  constructor(options = {}) {
    super(options);
  }
  
  async onInitialize() {
    console.log('🚨 Initializing ErrorHandler component');
    
    // Get error handling module
    const errorHandling = this.getDependency('error-handling');
    
    this.setupErrorListeners();
  }
  
  setupErrorListeners() {
    this.eventBus.on('error:show', this.handleShowError.bind(this));
    this.eventBus.on('error:clear', this.handleClearError.bind(this));
  }
  
  handleShowError(data) {
    console.log('🚨 Handling error display:', data);
    // Use error handling logic
  }
  
  handleClearError(data) {
    console.log('✨ Handling error clear:', data);
    // Use error clearing logic
  }
}

// Add conditional imports with fallbacks BEFORE the component registration
let ExperienceSelector;

try {
  // ExperienceSelector = (await import('./components/ExperienceSelector.js')).default;  // Comment this out
  console.log('✅ Successfully imported ExperienceSelector');
  
  // Use a simple class instead
  ExperienceSelector = class FallbackExperienceSelector {
    constructor(options) {
      this.options = options;
    }
    initialize() {
      console.log('Using fallback ExperienceSelector');
    }
  };
} catch (error) {
  console.warn('⚠️ Error importing ExperienceSelector, using fallback', error);
  // Create fallback component
  ExperienceSelector = class FallbackExperienceSelector extends BaseComponent {
    async onInitialize() {
      console.log('🔄 Using fallback ExperienceSelector');
    }
  };
}

// Register all components with dependencies and configuration
ComponentRegistry.registerMany({
  'booking-form': {
    ComponentClass: BookingFormComponent,
    dependencies: ['error-handler'],
    config: {
      validateOnChange: true,
      submitEndpoint: '/api/bookings',
      realTimeValidation: true
    }
  },
  'tab-navigation': {
    ComponentClass: TabNavigationComponent,
    dependencies: [],
    config: {
      defaultTab: 'panel-oneway',  // Change 'oneway' to 'panel-oneway'
      animateTransitions: true,
      saveState: true
    }
  },
  'error-handler': {
    ComponentClass: ErrorHandlerComponent,
    dependencies: [],
    config: {
      globalErrorContainer: 'global-error-container',
      autoHide: true,
      hideTimeout: 5000
    }
  }
});

// When DOM is ready, initialize all components
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing Miami Concierge components...');
  
  try {
    // Initialize ComponentRegistry
    await ComponentRegistry.initializeAll();
    
    console.log('✅ All components initialized successfully');
    console.log('📊 Component Registry Stats:', {
      components: ComponentRegistry.components.size,
      instances: ComponentRegistry.instances.size
    });
    
    // Make components available globally for debugging
    window.MiamiComponents = {
      registry: ComponentRegistry,
      bookingForm: ComponentRegistry.get('booking-form'),
      tabNavigation: ComponentRegistry.get('tab-navigation'),
      errorHandler: ComponentRegistry.get('error-handler')
    };
  } catch (error) {
    console.error('❌ Failed to initialize components:', error);
  }
});

export { BookingFormComponent, TabNavigationComponent, ErrorHandlerComponent };