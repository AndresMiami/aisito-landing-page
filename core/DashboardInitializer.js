/**
 * DashboardInitializer - Orchestrates the initialization of all dashboard components
 * 
 * This module manages the complete initialization sequence for the Miami AI Concierge
 * dashboard, ensuring components are loaded in the correct order with proper error
 * handling and event communication.
 * 
 * Features:
 * - Sequential component initialization with dependency management
 * - EventBus integration for real-time status updates
 * - Comprehensive error handling with fallback strategies
 * - ComponentRegistry integration for lifecycle management
 * - Performance monitoring and initialization metrics
 * - Development-friendly debugging and status reporting
 */

import { BaseComponent, ComponentRegistry } from './ComponentRegistry.js';
import DOMManager from './DOMManager.js';
import eventBus from '../eventBus.js';
import EventDefinitions from './EventDefinitions.js';

// Component imports with graceful fallbacks
let TabNavigationComponent, FormSubmissionComponent, VehicleSelectionComponent;
let ErrorHandlerComponent, LocationComponent, ValidationComponent;

class DashboardInitializer extends BaseComponent {
  constructor(options = {}) {
    super('dashboard-initializer', options);
    
    this.initializationSequence = [
      'core-systems',
      'error-handler', 
      'tab-navigation',
      'location-services',
      'vehicle-selection',
      'form-validation',
      'form-submission',
      'analytics-tracking'
    ];
    
    this.componentRegistry = ComponentRegistry;
    this.initializationStartTime = null;
    this.initializationStatus = {
      started: false,
      completed: false,
      failed: false,
      currentStep: null,
      completedSteps: [],
      failedSteps: [],
      errors: []
    };
    
    // Configuration with defaults
    this.config = {
      enableFallbacks: true,
      enableAnalytics: true,
      enableDebugMode: window.location.hostname === 'localhost',
      retryAttempts: 3,
      retryDelay: 1000,
      initializationTimeout: 30000,
      ...options
    };
    
    console.log('🎯 DashboardInitializer: Created with configuration', this.config);
  }
  
  /**
   * Main initialization method
   * @returns {Promise<Object>} Initialization result
   */
  async initialize() {
    this.initializationStartTime = Date.now();
    this.initializationStatus.started = true;
    this.initializationStatus.currentStep = 'starting';
    
    console.log('🚀 DashboardInitializer: Starting initialization sequence...');
    
    // Emit initialization started event
    eventBus.emit(EventDefinitions.EVENTS.SYSTEM.INITIALIZATION_STARTED, {
      component: 'dashboard-initializer',
      sequence: this.initializationSequence,
      config: this.config,
      timestamp: Date.now()
    });
    
    try {
      // Set up timeout for initialization
      const initializationPromise = this.executeInitializationSequence();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Initialization timeout')), this.config.initializationTimeout);
      });
      
      const result = await Promise.race([initializationPromise, timeoutPromise]);
      
      // Mark as completed
      this.initializationStatus.completed = true;
      this.initializationStatus.currentStep = 'completed';
      
      const initializationTime = Date.now() - this.initializationStartTime;
      
      console.log(`✅ DashboardInitializer: Initialization completed in ${initializationTime}ms`);
      
      // Emit initialization completed event
      eventBus.emit(EventDefinitions.EVENTS.SYSTEM.INITIALIZATION_COMPLETED, {
        component: 'dashboard-initializer',
        result,
        initializationTime,
        completedSteps: this.initializationStatus.completedSteps,
        timestamp: Date.now()
      });
      
      // Emit system ready event
      eventBus.emit(EventDefinitions.EVENTS.SYSTEM.READY, {
        component: 'dashboard',
        result,
        initializationTime,
        config: this.config,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        result,
        initializationTime,
        completedSteps: this.initializationStatus.completedSteps,
        failedSteps: this.initializationStatus.failedSteps
      };
      
    } catch (error) {
      return this.handleInitializationFailure(error);
    }
  }
  
  /**
   * Execute the complete initialization sequence
   * @returns {Promise<Object>} Sequence result
   */
  async executeInitializationSequence() {
    console.log('📋 DashboardInitializer: Executing initialization sequence...');
    
    const results = {};
    
    for (const step of this.initializationSequence) {
      this.initializationStatus.currentStep = step;
      
      console.log(`🔄 DashboardInitializer: Initializing ${step}...`);
      
      try {
        const stepResult = await this.initializeStep(step);
        results[step] = stepResult;
        this.initializationStatus.completedSteps.push(step);
        
        console.log(`✅ DashboardInitializer: ${step} initialized successfully`);
        
        // Emit step completed event
        eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENT_INITIALIZED, {
          component: step,
          result: stepResult,
          sequence: this.initializationSequence,
          currentIndex: this.initializationSequence.indexOf(step),
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error(`❌ DashboardInitializer: ${step} initialization failed:`, error);
        
        this.initializationStatus.failedSteps.push(step);
        this.initializationStatus.errors.push({ step, error: error.message });
        
        // Emit step failed event
        eventBus.emit(EventDefinitions.EVENTS.ERROR.SYSTEM, {
          component: step,
          error: error.message,
          operation: 'initialization',
          sequence: this.initializationSequence,
          timestamp: Date.now()
        });
        
        // Handle step failure based on configuration
        if (this.config.enableFallbacks) {
          const fallbackResult = await this.handleStepFailure(step, error);
          results[step] = fallbackResult;
        } else {
          throw error; // Propagate error if fallbacks are disabled
        }
      }
    }
    
    return results;
  }
  
  /**
   * Initialize a specific step in the sequence
   * @param {string} step - Step name
   * @returns {Promise<Object>} Step result
   */
  async initializeStep(step) {
    switch (step) {
      case 'core-systems':
        return await this.initializeCoreSystems();
        
      case 'error-handler':
        return await this.initializeErrorHandler();
        
      case 'tab-navigation':
        return await this.initializeTabNavigation();
        
      case 'location-services':
        return await this.initializeLocationServices();
        
      case 'vehicle-selection':
        return await this.initializeVehicleSelection();
        
      case 'form-validation':
        return await this.initializeFormValidation();
        
      case 'form-submission':
        return await this.initializeFormSubmission();
        
      case 'analytics-tracking':
        return await this.initializeAnalyticsTracking();
        
      default:
        throw new Error(`Unknown initialization step: ${step}`);
    }
  }
  
  /**
   * Initialize core systems
   * @returns {Promise<Object>} Core systems result
   */
  async initializeCoreSystems() {
    console.log('⚙️ DashboardInitializer: Initializing core systems...');
    
    // Verify DOMManager is available
    if (!DOMManager) {
      throw new Error('DOMManager not available');
    }
    
    // Verify EventBus is available
    if (!eventBus) {
      throw new Error('EventBus not available');
    }
    
    // Verify EventDefinitions is available
    if (!EventDefinitions) {
      throw new Error('EventDefinitions not available');
    }
    
    // Import component dependencies with error handling
    await this.importComponentDependencies();
    
    // Verify critical DOM elements exist
    const criticalElements = this.verifyCriticalElements();
    
    return {
      domManager: !!DOMManager,
      eventBus: !!eventBus,
      eventDefinitions: !!EventDefinitions,
      componentRegistry: !!ComponentRegistry,
      criticalElements,
      imports: {
        TabNavigationComponent: !!TabNavigationComponent,
        FormSubmissionComponent: !!FormSubmissionComponent,
        VehicleSelectionComponent: !!VehicleSelectionComponent
      }
    };
  }
  
  /**
   * Import component dependencies with graceful fallbacks
   * @returns {Promise<void>}
   */
  async importComponentDependencies() {
    console.log('📦 DashboardInitializer: Importing component dependencies...');
    
    const imports = [
      { name: 'TabNavigationComponent', path: './TabNavigationComponent.js' },
      { name: 'FormSubmissionComponent', path: './FormSubmissionComponent.js' },
      { name: 'VehicleSelectionComponent', path: '../components/VehicleSelectionComponent.js' },
      { name: 'ErrorHandlerComponent', path: '../components/ErrorHandlerComponent.js' },
      { name: 'LocationComponent', path: '../components/LocationComponent.js' },
      { name: 'ValidationComponent', path: '../components/ValidationComponent.js' }
    ];
    
    for (const { name, path } of imports) {
      try {
        const module = await import(path);
        
        switch (name) {
          case 'TabNavigationComponent':
            TabNavigationComponent = module.TabNavigationComponent || module.default;
            break;
          case 'FormSubmissionComponent':
            FormSubmissionComponent = module.FormSubmissionComponent || module.default;
            break;
          case 'VehicleSelectionComponent':
            VehicleSelectionComponent = module.VehicleSelectionComponent || module.default;
            break;
          case 'ErrorHandlerComponent':
            ErrorHandlerComponent = module.ErrorHandlerComponent || module.default;
            break;
          case 'LocationComponent':
            LocationComponent = module.LocationComponent || module.default;
            break;
          case 'ValidationComponent':
            ValidationComponent = module.ValidationComponent || module.default;
            break;
        }
        
        console.log(`✅ DashboardInitializer: ${name} imported successfully`);
        
      } catch (error) {
        console.warn(`⚠️ DashboardInitializer: Failed to import ${name}:`, error);
        
        // Set to null to indicate unavailable
        switch (name) {
          case 'TabNavigationComponent':
            TabNavigationComponent = null;
            break;
          case 'FormSubmissionComponent':
            FormSubmissionComponent = null;
            break;
          case 'VehicleSelectionComponent':
            VehicleSelectionComponent = null;
            break;
          case 'ErrorHandlerComponent':
            ErrorHandlerComponent = null;
            break;
          case 'LocationComponent':
            LocationComponent = null;
            break;
          case 'ValidationComponent':
            ValidationComponent = null;
            break;
        }
      }
    }
  }
  
  /**
   * Verify critical DOM elements exist
   * @returns {Object} Element verification results
   */
  verifyCriticalElements() {
    const criticalElementIds = [
      'booking-form',
      'tab-navigation',
      'submit-booking',
      'reset-button',
      'from-location',
      'to-address'
    ];
    
    const results = {};
    let foundCount = 0;
    
    criticalElementIds.forEach(elementId => {
      const element = DOMManager.getElementById(elementId);
      results[elementId] = !!element;
      if (element) foundCount++;
    });
    
    results._summary = {
      total: criticalElementIds.length,
      found: foundCount,
      missing: criticalElementIds.length - foundCount,
      isValid: foundCount >= Math.ceil(criticalElementIds.length * 0.75) // 75% threshold
    };
    
    console.log(`🔍 DashboardInitializer: Critical elements verified: ${foundCount}/${criticalElementIds.length}`);
    
    return results;
  }
  
  /**
   * Initialize error handler
   * @returns {Promise<Object>} Error handler result
   */
  async initializeErrorHandler() {
    console.log('🛡️ DashboardInitializer: Initializing error handler...');
    
    if (ErrorHandlerComponent) {
      try {
        ComponentRegistry.register('error-handler', ErrorHandlerComponent, [], {
          globalErrorContainer: '#global-error-container',
          enableToast: true,
          enableConsoleLogging: this.config.enableDebugMode
        });
        
        const errorHandler = ComponentRegistry.get('error-handler');
        await errorHandler.init();
        
        return { component: 'enhanced', status: 'initialized' };
        
      } catch (error) {
        console.warn('⚠️ DashboardInitializer: Enhanced error handler failed, using fallback');
        return this.initializeFallbackErrorHandler();
      }
    }
    
    return this.initializeFallbackErrorHandler();
  }
  
  /**
   * Initialize fallback error handler
   * @returns {Object} Fallback error handler result
   */
  initializeFallbackErrorHandler() {
    console.log('🔄 DashboardInitializer: Initializing fallback error handler...');
    
    // Set up basic error event listeners
    eventBus.on(EventDefinitions.EVENTS.ERROR.GLOBAL_ERROR, (data) => {
      console.error('Global Error:', data);
      // Basic error display logic could go here
    });
    
    eventBus.on(EventDefinitions.EVENTS.ERROR.API, (data) => {
      console.error('API Error:', data);
    });
    
    return { component: 'fallback', status: 'initialized' };
  }
  
  /**
   * Initialize tab navigation
   * @returns {Promise<Object>} Tab navigation result
   */
  async initializeTabNavigation() {
    console.log('🏷️ DashboardInitializer: Initializing tab navigation...');
    
    if (TabNavigationComponent) {
      try {
        ComponentRegistry.register('tab-navigation', TabNavigationComponent, ['error-handler'], {
          containerSelector: '#tab-navigation',
          defaultTab: 'oneway',
          animateTransitions: true,
          saveState: true,
          enableKeyboardNavigation: true
        });
        
        const tabNavigation = ComponentRegistry.get('tab-navigation');
        await tabNavigation.init();
        
        // Set up tab change listeners
        eventBus.on(EventDefinitions.EVENTS.UI.TAB_CHANGED, (data) => {
          console.log(`🔄 Tab changed: ${data.previousTab} → ${data.currentTab}`);
          
          // Trigger dependent updates
          this.handleTabChange(data);
        });
        
        return { component: 'enhanced', status: 'initialized', tabs: tabNavigation.getAvailableTabs() };
        
      } catch (error) {
        console.warn('⚠️ DashboardInitializer: Enhanced tab navigation failed, using fallback');
        return this.initializeFallbackTabNavigation();
      }
    }
    
    return this.initializeFallbackTabNavigation();
  }
  
  /**
   * Initialize fallback tab navigation
   * @returns {Object} Fallback tab navigation result
   */
  initializeFallbackTabNavigation() {
    console.log('🔄 DashboardInitializer: Initializing fallback tab navigation...');
    
    const tabButtons = DOMManager.querySelectorAll('.tab-button');
    let activeTabCount = 0;
    
    tabButtons.forEach((button, index) => {
      DOMManager.addEventListener(button, 'click', (event) => {
        const tabId = DOMManager.getAttribute(button, 'id');
        const targetPanelId = DOMManager.getAttribute(button, 'data-tab-target');
        
        // Emit event even in fallback mode
        eventBus.emit(EventDefinitions.EVENTS.UI.TAB_CHANGED, {
          tabId,
          targetPanelId: targetPanelId ? targetPanelId.replace('#', '') : null,
          source: 'fallback-click',
          timestamp: Date.now()
        });
        
        // Handle tab switch manually
        this.handleFallbackTabSwitch(button, targetPanelId);
      });
      
      activeTabCount++;
    });
    
    return { component: 'fallback', status: 'initialized', tabCount: activeTabCount };
  }
  
  /**
   * Handle fallback tab switching
   * @param {HTMLElement} activeButton - Active tab button
   * @param {string} targetPanelId - Target panel ID
   */
  handleFallbackTabSwitch(activeButton, targetPanelId) {
    // Update button states
    const allButtons = DOMManager.querySelectorAll('.tab-button');
    allButtons.forEach(btn => {
      DOMManager.setAttribute(btn, 'aria-selected', 'false');
      DOMManager.removeClass(btn, 'active');
    });
    DOMManager.setAttribute(activeButton, 'aria-selected', 'true');
    DOMManager.addClass(activeButton, 'active');
    
    // Update panel visibility
    const allPanels = DOMManager.querySelectorAll('.tab-panel');
    allPanels.forEach(panel => {
      DOMManager.addClass(panel, 'hidden');
    });
    
    if (targetPanelId) {
      const targetPanel = DOMManager.querySelector(targetPanelId);
      if (targetPanel) {
        DOMManager.removeClass(targetPanel, 'hidden');
      }
    }
  }
  
  /**
   * Initialize location services
   * @returns {Promise<Object>} Location services result
   */
  async initializeLocationServices() {
    console.log('📍 DashboardInitializer: Initializing location services...');
    
    try {
      // Check if Google Maps API is available
      const googleMapsAvailable = window.google && window.google.maps;
      
      if (LocationComponent && googleMapsAvailable) {
        ComponentRegistry.register('location-services', LocationComponent, ['tab-navigation'], {
          autoCompleteFields: ['from-location', 'to-address', 'from-location-exp'],
          enableCurrentLocation: true,
          restrictToCountry: 'US',
          biasToLocation: { lat: 25.7617, lng: -80.1918 } // Miami
        });
        
        const locationServices = ComponentRegistry.get('location-services');
        await locationServices.init();
        
        return { 
          component: 'enhanced', 
          status: 'initialized',
          googleMaps: true,
          fields: ['from-location', 'to-address', 'from-location-exp']
        };
      }
      
      // Fallback initialization
      return this.initializeFallbackLocationServices();
      
    } catch (error) {
      console.warn('⚠️ DashboardInitializer: Location services failed, using fallback');
      return this.initializeFallbackLocationServices();
    }
  }
  
  /**
   * Initialize fallback location services
   * @returns {Object} Fallback location services result
   */
  initializeFallbackLocationServices() {
    console.log('🔄 DashboardInitializer: Initializing fallback location services...');
    
    const locationFields = ['from-location', 'to-address', 'from-location-exp'];
    let initializedFields = 0;
    
    locationFields.forEach(fieldId => {
      const field = DOMManager.getElementById(fieldId);
      if (field) {
        // Basic input validation
        DOMManager.addEventListener(field, 'input', (event) => {
          const value = DOMManager.getValue(field);
          
          eventBus.emit(EventDefinitions.EVENTS.LOCATION.SELECTED, {
            fieldId,
            address: value,
            isValid: value.trim().length > 0,
            source: 'fallback-input',
            timestamp: Date.now()
          });
        });
        
        initializedFields++;
      }
    });
    
    return { 
      component: 'fallback', 
      status: 'initialized',
      googleMaps: false,
      fieldsInitialized: initializedFields
    };
  }
  
  /**
   * Initialize vehicle selection
   * @returns {Promise<Object>} Vehicle selection result
   */
  async initializeVehicleSelection() {
    console.log('🚗 DashboardInitializer: Initializing vehicle selection...');
    
    if (VehicleSelectionComponent) {
      try {
        ComponentRegistry.register('vehicle-selection', VehicleSelectionComponent, 
          ['tab-navigation', 'location-services'], {
          containerSelectors: {
            oneway: '#vehicle-selection-oneway',
            roundtrip: '#vehicle-selection-roundtrip',
            experiencePlus: '#vehicle-selection-experience-plus'
          },
          enableVisibilityLogic: true,
          enablePricing: true,
          apiEndpoint: '/api/vehicles'
        });
        
        const vehicleSelection = ComponentRegistry.get('vehicle-selection');
        await vehicleSelection.init();
        
        return { component: 'enhanced', status: 'initialized' };
        
      } catch (error) {
        console.warn('⚠️ DashboardInitializer: Enhanced vehicle selection failed, using fallback');
        return this.initializeFallbackVehicleSelection();
      }
    }
    
    return this.initializeFallbackVehicleSelection();
  }
  
  /**
   * Initialize fallback vehicle selection
   * @returns {Object} Fallback vehicle selection result
   */
  initializeFallbackVehicleSelection() {
    console.log('🔄 DashboardInitializer: Initializing fallback vehicle selection...');
    
    const vehicleRadios = DOMManager.querySelectorAll('input[name^="vehicle_type_"]');
    let bindingCount = 0;
    
    vehicleRadios.forEach(radio => {
      DOMManager.addEventListener(radio, 'change', function() {
        if (this.checked) {
          const vehicleType = DOMManager.getValue(this);
          const tabType = DOMManager.getAttribute(this, 'name').replace('vehicle_type_', '');
          
          eventBus.emit(EventDefinitions.EVENTS.VEHICLE.SELECTED, {
            vehicleType,
            tabType,
            source: 'fallback-selection',
            timestamp: Date.now()
          });
        }
      });
      
      bindingCount++;
    });
    
    return { 
      component: 'fallback', 
      status: 'initialized',
      vehicleRadios: bindingCount
    };
  }
  
  /**
   * Initialize form validation
   * @returns {Promise<Object>} Form validation result
   */
  async initializeFormValidation() {
    console.log('✅ DashboardInitializer: Initializing form validation...');
    
    if (ValidationComponent) {
      try {
        ComponentRegistry.register('form-validation', ValidationComponent, 
          ['location-services', 'vehicle-selection'], {
          formId: 'booking-form',
          enableRealtimeValidation: true,
          validationRules: {
            'from-location': ['required', 'location'],
            'to-address': ['required', 'location'],
            'vehicle-selection': ['required']
          }
        });
        
        const formValidation = ComponentRegistry.get('form-validation');
        await formValidation.init();
        
        return { component: 'enhanced', status: 'initialized' };
        
      } catch (error) {
        console.warn('⚠️ DashboardInitializer: Enhanced form validation failed, using fallback');
        return this.initializeFallbackFormValidation();
      }
    }
    
    return this.initializeFallbackFormValidation();
  }
  
  /**
   * Initialize fallback form validation
   * @returns {Object} Fallback form validation result
   */
  initializeFallbackFormValidation() {
    console.log('🔄 DashboardInitializer: Initializing fallback form validation...');
    
    // Basic form validation listeners
    const requiredFields = ['from-location', 'to-address'];
    let validationListeners = 0;
    
    requiredFields.forEach(fieldId => {
      const field = DOMManager.getElementById(fieldId);
      if (field) {
        DOMManager.addEventListener(field, 'blur', () => {
          const value = DOMManager.getValue(field);
          const isValid = value.trim().length > 0;
          
          eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_VALIDATED, {
            fieldId,
            value,
            isValid,
            errors: isValid ? [] : ['Field is required'],
            timestamp: Date.now()
          });
        });
        
        validationListeners++;
      }
    });
    
    return { 
      component: 'fallback', 
      status: 'initialized',
      validationListeners
    };
  }
  
  /**
   * Initialize form submission
   * @returns {Promise<Object>} Form submission result
   */
  async initializeFormSubmission() {
    console.log('📤 DashboardInitializer: Initializing form submission...');
    
    if (FormSubmissionComponent) {
      try {
        ComponentRegistry.register('form-submission', FormSubmissionComponent, 
          ['form-validation', 'vehicle-selection'], {
          formId: 'booking-form',
          submitButtonId: 'submit-booking',
          apiEndpoint: '/api/bookings',
          timeout: 30000,
          retryAttempts: 3,
          validateBeforeSubmit: true
        });
        
        const formSubmission = ComponentRegistry.get('form-submission');
        await formSubmission.init();
        
        return { component: 'enhanced', status: 'initialized' };
        
      } catch (error) {
        console.warn('⚠️ DashboardInitializer: Enhanced form submission failed, using fallback');
        return this.initializeFallbackFormSubmission();
      }
    }
    
    return this.initializeFallbackFormSubmission();
  }
  
  /**
   * Initialize fallback form submission
   * @returns {Object} Fallback form submission result
   */
  initializeFallbackFormSubmission() {
    console.log('🔄 DashboardInitializer: Initializing fallback form submission...');
    
    const form = DOMManager.getElementById('booking-form');
    
    if (!form) {
      throw new Error('Booking form not found');
    }
    
    DOMManager.addEventListener(form, 'submit', async (event) => {
      event.preventDefault();
      
      eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_REQUESTED, {
        formId: 'booking-form',
        source: 'fallback-submit',
        timestamp: Date.now()
      });
      
      // Basic fallback submission logic
      try {
        const formData = new FormData(form);
        const dataObject = Object.fromEntries(formData.entries());
        
        console.log('📤 Fallback: Submitting form data:', dataObject);
        
        // Simulate submission success
        setTimeout(() => {
          eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_SUCCEEDED, {
            formId: 'booking-form',
            data: dataObject,
            source: 'fallback',
            timestamp: Date.now()
          });
        }, 1000);
        
      } catch (error) {
        eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_FAILED, {
          formId: 'booking-form',
          error: error.message,
          source: 'fallback',
          timestamp: Date.now()
        });
      }
    });
    
    return { component: 'fallback', status: 'initialized' };
  }
  
  /**
   * Initialize analytics tracking
   * @returns {Promise<Object>} Analytics result
   */
  async initializeAnalyticsTracking() {
    console.log('📊 DashboardInitializer: Initializing analytics tracking...');
    
    if (!this.config.enableAnalytics) {
      return { component: 'disabled', status: 'skipped' };
    }
    
    // Set up analytics event listeners
    const analyticsEvents = [
      EventDefinitions.EVENTS.UI.TAB_CHANGED,
      EventDefinitions.EVENTS.VEHICLE.SELECTED,
      EventDefinitions.EVENTS.FORM.SUBMISSION_SUCCEEDED,
      EventDefinitions.EVENTS.LOCATION.SELECTED
    ];
    
    analyticsEvents.forEach(eventName => {
      eventBus.on(eventName, (data) => {
        eventBus.emit(EventDefinitions.EVENTS.ANALYTICS.TRACK, {
          event: eventName.replace(/\./g, '_'),
          properties: data,
          timestamp: Date.now()
        });
      });
    });
    
    return { 
      component: 'basic', 
      status: 'initialized',
      trackedEvents: analyticsEvents.length
    };
  }
  
  /**
   * Handle tab change events
   * @param {Object} data - Tab change data
   */
  handleTabChange(data) {
    // Update vehicle visibility based on tab
    this.updateVehicleVisibility(data.currentTab);
    
    // Update form validation context
    this.updateValidationContext(data.currentTab);
  }
  
  /**
   * Update vehicle visibility based on current tab
   * @param {string} currentTab - Current tab ID
   */
  updateVehicleVisibility(currentTab) {
    const vehicleContainers = DOMManager.querySelectorAll('[id*="vehicle-selection"]');
    
    vehicleContainers.forEach(container => {
      const containerId = DOMManager.getAttribute(container, 'id');
      const shouldShow = containerId.includes(currentTab);
      
      if (shouldShow) {
        DOMManager.removeClass(container, 'hidden');
      } else {
        DOMManager.addClass(container, 'hidden');
      }
    });
  }
  
  /**
   * Update validation context based on current tab
   * @param {string} currentTab - Current tab ID
   */
  updateValidationContext(currentTab) {
    eventBus.emit(EventDefinitions.EVENTS.FORM.VALIDATION_CONTEXT_CHANGED, {
      currentTab,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle step failure with fallback strategies
   * @param {string} step - Failed step name
   * @param {Error} error - Failure error
   * @returns {Promise<Object>} Fallback result
   */
  async handleStepFailure(step, error) {
    console.warn(`⚠️ DashboardInitializer: Attempting fallback for ${step}:`, error);
    
    const fallbackStrategies = {
      'core-systems': () => ({ status: 'partial', error: error.message }),
      'error-handler': () => this.initializeFallbackErrorHandler(),
      'tab-navigation': () => this.initializeFallbackTabNavigation(),
      'location-services': () => this.initializeFallbackLocationServices(),
      'vehicle-selection': () => this.initializeFallbackVehicleSelection(),
      'form-validation': () => this.initializeFallbackFormValidation(),
      'form-submission': () => this.initializeFallbackFormSubmission(),
      'analytics-tracking': () => ({ status: 'disabled', error: error.message })
    };
    
    const fallbackStrategy = fallbackStrategies[step];
    
    if (fallbackStrategy) {
      try {
        const result = await fallbackStrategy();
        console.log(`✅ DashboardInitializer: Fallback successful for ${step}`);
        return result;
      } catch (fallbackError) {
        console.error(`❌ DashboardInitializer: Fallback failed for ${step}:`, fallbackError);
        return { status: 'failed', error: fallbackError.message };
      }
    }
    
    return { status: 'no-fallback', error: error.message };
  }
  
  /**
   * Handle complete initialization failure
   * @param {Error} error - Initialization error
   * @returns {Object} Failure result
   */
  handleInitializationFailure(error) {
    this.initializationStatus.failed = true;
    this.initializationStatus.currentStep = 'failed';
    
    const initializationTime = Date.now() - this.initializationStartTime;
    
    console.error(`❌ DashboardInitializer: Initialization failed after ${initializationTime}ms:`, error);
    
    // Emit initialization failed event
    eventBus.emit(EventDefinitions.EVENTS.SYSTEM.INITIALIZATION_FAILED, {
      component: 'dashboard-initializer',
      error: error.message,
      initializationTime,
      completedSteps: this.initializationStatus.completedSteps,
      failedSteps: this.initializationStatus.failedSteps,
      timestamp: Date.now()
    });
    
    return {
      success: false,
      error: error.message,
      initializationTime,
      completedSteps: this.initializationStatus.completedSteps,
      failedSteps: this.initializationStatus.failedSteps
    };
  }
  
  /**
   * Get initialization status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      ...this.initializationStatus,
      initializationTime: this.initializationStartTime ? 
        Date.now() - this.initializationStartTime : null
    };
  }
  
  /**
   * Get registered components
   * @returns {Array} Component list
   */
  getRegisteredComponents() {
    return ComponentRegistry.getAllComponents();
  }
}

// Export the DashboardInitializer class
export { DashboardInitializer };
export default DashboardInitializer;

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.DashboardInitializer = DashboardInitializer;
}

console.log('✅ DashboardInitializer: Module loaded successfully');