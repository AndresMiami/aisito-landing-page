// dashboard.js
console.log("🚀 Dashboard.js module loading...");
console.log("🧪 Testing: Module execution at", new Date().toISOString());

// This script handles the dynamic behavior and form submissions
// for the luxury vehicle booking dashboard page, including tab switching,
// form validation, Google Maps Autocomplete integration, and orchestrating
// the use of modularized components for element references,
// error handling, validation, and submission.
// It aims to provide a responsive and user-friendly booking experience.
//
// NOTE: This script is tightly coupled with the booking dashboard's HTML structure and relies on
// external dependencies like Google Maps API (Places library) and Flatpickr.
// Ensure these are correctly included and the necessary HTML elements with matching IDs exist
// for the script to function correctly.

// ========================================
// UPDATED IMPORTS WITH FULL ARCHITECTURE
// ========================================

// Core architecture imports
import eventBus from './src/core/EventBus.js';
import DOMManager from './src/core/DOMManager.js';
import EventDefinitions from './src/core/EventDefinitions.js';

// Legacy form events (will be migrated to EventDefinitions)
import { FORM_EVENTS, createSubmissionData, createSubmissionError } from './src/core/FormEvents.js';

// Error handling utilities
import { showGlobalError, clearGlobalError, emitError, emitClearError, emitGlobalError, emitClearAllErrors } from './errorHandling.js';

// Form validation utilities
import { forceLocationValidation } from './formValidation.js';

// Auto-initializing modules
import './validation-listeners.js'; // This will auto-initialize the validation listeners
import './maps.js';

// Make EventDefinitions available globally for debugging
window.MiamiEvents = EventDefinitions;
window.eventBus = eventBus;
window.DOMManager = DOMManager;

// Make forceLocationValidation available globally for debug controls
window.forceLocationValidation = forceLocationValidation;

// Variable declarations for imported functions - FIXED
let TabNavigationClass, createTabNavigationFunc;  // ✅ Changed variable names
let tabNavigationInstance = null;

// Import other dependencies
let initAutocomplete, getCurrentLocation;
let showError, clearError, clearAllErrors;
let validateForm;
let processFormData, sendFormData;

// ========================================
// ENHANCED FUNCTIONS WITH DOMMANAGER
// ========================================

// Enhanced import function with better error handling
async function importDependencies() {
  try {
    console.log("📦 Dashboard: Importing dependencies...");
    
    // Import the refactored TabNavigationComponent
    try {
      const tabModule = await import('./core/TabNavigationComponent.js');
      TabNavigationClass = tabModule.TabNavigationComponent;
      createTabNavigationFunc = tabModule.default;
      console.log('✅ Dashboard: Enhanced TabNavigation component imported successfully');
    } catch (error) {
      console.warn('⚠️ Dashboard: Enhanced TabNavigation component not available:', error);
      TabNavigationClass = null;
      createTabNavigationFunc = null;
    }
    
    console.log("✅ Dashboard: All dependencies imported");
    return true;
    
  } catch (error) {
    console.error("❌ Dashboard: Error importing dependencies:", error);
    return false;
  }
}

// Enhanced tab navigation initialization with ComponentRegistry
async function initializeTabNavigation() {
  try {
    console.log('🎯 Dashboard: Initializing enhanced tab navigation...');
    
    if (TabNavigationClass) {
      // Use ComponentRegistry to create and manage the tab navigation
      ComponentRegistry.register('tab-navigation', TabNavigationClass, [], {
        containerSelector: '#tab-navigation',
        defaultTab: 'oneway',
        animateTransitions: true,
        saveState: true
      });
      
      // Initialize the component
      tabNavigationInstance = ComponentRegistry.get('tab-navigation');
      
      if (tabNavigationInstance) {
        console.log('✅ Dashboard: Enhanced tab navigation initialized successfully');
        
        // Listen for tab changes to update other components
        eventBus.on(EventDefinitions.EVENTS.UI.TAB_CHANGED, (data) => {
          console.log(`🔄 Tab changed: ${data.previousTab} → ${data.targetPanelId}`);
          
          // Update form validation context
          checkVehicleVisibility();
          
          // Emit dashboard state change
          eventBus.emit(EventDefinitions.EVENTS.SYSTEM.STATE_CHANGED, {
            component: 'dashboard',
            change: 'tab-switch',
            data: data,
            timestamp: Date.now()
          });
        });
        
        return true;
      }
    }
    
    // Fallback to simple tab navigation
    console.log('🔄 Dashboard: Falling back to simple tab navigation...');
    return initializeFallbackTabs();
    
  } catch (error) {
    console.error('❌ Dashboard: Tab navigation initialization failed:', error);
    return initializeFallbackTabs();
  }
}

// Enhanced fallback tab handling with DOMManager
function initializeFallbackTabs() {
  console.log('🔄 Dashboard: Initializing fallback tab handling...');
  
  const tabButtons = DOMManager.querySelectorAll('.tab-button');
  
  if (tabButtons.length === 0) {
    console.warn('⚠️ Dashboard: No tab buttons found for fallback');
    return false;
  }
  
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
      handleFallbackTabSwitch(button, targetPanelId);
    });
    
    console.log(`🔗 Dashboard: Bound fallback events to tab ${index + 1}`);
  });
  
  console.log('✅ Dashboard: Fallback tab handling initialized');
  return true;
}

// Helper function for fallback tab switching
function handleFallbackTabSwitch(activeButton, targetPanelId) {
  // Update button states
  const allButtons = DOMManager.querySelectorAll('.tab-button');
  allButtons.forEach(btn => {
    DOMManager.setAttribute(btn, 'aria-selected', 'false');
  });
  DOMManager.setAttribute(activeButton, 'aria-selected', 'true');
  
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

// Main initialization function - Enhanced with EventDefinitions
async function initializeDashboard() {
  try {
    console.log('🚀 Dashboard: Starting main initialization...');
    
    // Emit system initialization started
    eventBus.emit(EventDefinitions.EVENTS.SYSTEM.INITIALIZED, {
      component: 'dashboard',
      timestamp: Date.now()
    });
    
    // Import dependencies first
    const importSuccess = await importDependencies();
    if (!importSuccess) {
      console.warn('⚠️ Dashboard: Some dependencies failed to import, continuing with available features');
    }
    
    // Wait for SimpleBridge to be ready
    let simpleBridgeReady = false;
    if (window.SimpleBridge) {
      try {
        await window.SimpleBridge.init();
        simpleBridgeReady = true;
        console.log('🌉 Dashboard: SimpleBridge ready');
      } catch (error) {
        console.warn('⚠️ Dashboard: SimpleBridge initialization failed:', error);
        
        // Emit error event
        eventBus.emit(EventDefinitions.EVENTS.ERROR.SYSTEM, {
          error: error.message,
          component: 'SimpleBridge',
          operation: 'initialization'
        });
      }
    } else {
      console.warn('⚠️ Dashboard: SimpleBridge not available');
    }
    
    // Initialize tab navigation (with component integration or fallback)
    const tabSuccess = await initializeTabNavigation();
    const formSubmissionSuccess = await initializeFormSubmission();
    
    console.log('✅ Dashboard: Full initialization complete');
    
    // Emit system ready event
    eventBus.emit(EventDefinitions.EVENTS.SYSTEM.READY, {
      component: 'dashboard',
      tabNavigationSuccess: tabSuccess,
      formSubmissionSuccess: formSubmissionSuccess,
      simpleBridgeReady: simpleBridgeReady,
      timestamp: Date.now()
    });
    
    // Emit for monitoring (backward compatibility)
    if (window.SimpleBridge?.eventBus) {
      window.SimpleBridge.eventBus.emit('dashboard:ready', {
        tabNavigationSuccess: tabSuccess,
        simpleBridgeReady: simpleBridgeReady,
        timestamp: Date.now()
      });
    }
    
    return {
      success: true,
      tabNavigation: tabSuccess,
      formSubmission: formSubmissionSuccess,
      simpleBridge: simpleBridgeReady
    };
    
  } catch (error) {
    console.error('❌ Dashboard: Main initialization failed:', error);
    
    // Emit system error
    eventBus.emit(EventDefinitions.EVENTS.ERROR.SYSTEM, {
      error: error.message,
      component: 'dashboard',
      operation: 'main_initialization'
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Enhanced form submission initialization with full DOMManager integration
 */
async function initializeFormSubmission() {
  try {
    console.log('📝 Dashboard: Initializing enhanced form submission...');
    
    // Try to use FormSubmissionComponent first
    if (ComponentRegistry) {
      try {
        ComponentRegistry.register('form-submission', FormSubmissionComponent, [], {
          formId: 'booking-form',
          submitButtonId: 'submit-booking',
          apiEndpoint: '/api/bookings',
          timeout: 30000,
          retryAttempts: 3,
          validateBeforeSubmit: true
        });
        
        const formSubmissionInstance = ComponentRegistry.get('form-submission');
        
        if (formSubmissionInstance) {
          console.log('✅ Dashboard: FormSubmissionComponent initialized successfully');
          return true;
        }
      } catch (componentError) {
        console.warn('⚠️ Dashboard: FormSubmissionComponent failed, using enhanced fallback:', componentError);
      }
    }
    
    // Fallback to enhanced form submission
    console.log('🔄 Dashboard: Using enhanced form submission fallback...');
    return setupEnhancedFormSubmission();
    
  } catch (error) {
    console.error('❌ Dashboard: Form submission initialization failed:', error);
    
    // Final fallback to basic form submission
    console.log('🔄 Dashboard: Using basic form submission fallback...');
    return initializeFallbackFormSubmission();
  }
}

/**
 * Fallback form submission for backward compatibility
 */
function initializeFallbackFormSubmission() {
  console.log('🔄 Dashboard: Initializing fallback form submission...');
  
  const form = DOMManager.getElementById('booking-form');
  
  if (!form) {
    console.warn('⚠️ Dashboard: No booking form found for fallback');
    return false;
  }
  
  DOMManager.addEventListener(form, 'submit', async (event) => {
    event.preventDefault();
    
    // Emit event even in fallback mode
    eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_REQUESTED, {
      formId: 'booking-form',
      source: 'fallback-submit',
      timestamp: Date.now()
    });
    
    // Simple fallback submission logic
    try {
      const formData = new FormData(form);
      const dataObject = Object.fromEntries(formData.entries());
      
      console.log('📤 Fallback: Submitting form data:', dataObject);
      
      // You can add basic submission logic here
      // For now, just emit success event
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
  
  console.log('✅ Dashboard: Fallback form submission initialized');
  return true;
}

// ========================================
// UPDATED EVENT HANDLERS WITH EVENTDEFINITIONS
// ========================================

// Update location validation functions to use EventDefinitions
function handlePlaceSelection(autocomplete, fieldId) {
  const place = autocomplete.getPlace();
  
  if (!place.place_id) {
    eventBus.emit(EventDefinitions.EVENTS.LOCATION.SELECTED, 
      EventDefinitions.createLocationPayload({
        fieldId,
        place,
        isValid: false,
        address: place.name || '',
        locationType: 'autocomplete'
      })
    );
    return false;
  }
  
  if (!place.geometry) {
    eventBus.emit(EventDefinitions.EVENTS.ERROR.VALIDATION, 
      EventDefinitions.createFieldError(
        fieldId, 
        'Selected location details are incomplete. Please try another location.',
        EventDefinitions.ERROR_SEVERITY.ERROR
      )
    );
    return false;
  }
  
  // Location is valid
  eventBus.emit(EventDefinitions.EVENTS.LOCATION.SELECTED, 
    EventDefinitions.createLocationPayload({
      fieldId,
      place,
      isValid: true,
      address: place.formatted_address || place.name,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      placeId: place.place_id,
      locationType: 'autocomplete'
    })
  );
  
  return true;
}

// Update vehicle selection handlers with EventDefinitions
function handleVehicleSelection(vehicleType, tabType) {
  console.log(`Vehicle selected: ${vehicleType} for ${tabType}`);
  
  // Emit vehicle selection event using EventDefinitions
  eventBus.emit(EventDefinitions.EVENTS.VEHICLE.SELECTED, 
    EventDefinitions.createVehiclePayload({
      vehicleType,
      vehicleId: vehicleType,
      tabType,
      source: 'user-selection'
    })
  );
  
  // Also emit field change for real-time validation
  eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_CHANGED, 
    EventDefinitions.createFormPayload(
      `vehicle_type_${tabType}`,
      vehicleType,
      { 
        rules: ['vehicleSelected'],
        params: { vehicleSelected: [`vehicle_type_${tabType}`] },
        tabType
      }
    )
  );
}

// Enhanced form submission handler with EventDefinitions
async function handleFormSubmission(event) {
  event.preventDefault();
  
  console.log('🚀 Form submission started');
  
  // Emit form submission started
  eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_STARTED, {
    formId: 'booking-form',
    timestamp: Date.now(),
    source: 'user-submission'
  });
  
  // Get form elements using DOMManager
  const elements = {
    bookingForm: DOMManager.getElementById('booking-form'),
    tabNavigationContainer: DOMManager.getElementById('tab-navigation'),
    serviceDropdown: DOMManager.getElementById('experience-dropdown'),
    submitButton: DOMManager.getElementById('submit-button'),
    confirmationMessage: DOMManager.getElementById('confirmation-message')
  };
  
  // Process form data using the new module
  const formData = processFormData(elements);
  
  if (!formData) {
    console.log('❌ Form validation failed');
    
    // Emit validation failure
    eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_FAILED, 
      EventDefinitions.createFormPayload(null, null, {
        error: 'Form validation failed',
        elements: Object.keys(elements)
      })
    );
    return;
  }
  
  // Send form data using the new module
  const config = {
    FORM_ENDPOINT: 'YOUR_FORMSPREE_ENDPOINT' // Replace with your actual endpoint
  };
  
  try {
    await sendFormData(formData, elements, config);
    
    // Emit submission success
    eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_SUCCEEDED, 
      EventDefinitions.createFormPayload(null, null, formData)
    );
    
  } catch (error) {
    console.error('❌ Form submission error:', error);
    
    // Emit submission failure
    eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_FAILED, 
      EventDefinitions.createFormPayload(null, null, {
        error: error.message,
        formData
      })
    );
  }
}

// ENHANCED VEHICLE VISIBILITY CHECKS WITH DOMMANAGER
// ========================================

/**
 * Enhanced vehicle visibility checks using DOMManager and EventBus
 * Replaces direct DOM manipulation with standardized patterns
 */
function setupVehicleVisibilityChecks() {
  console.log('👁️ Dashboard: Setting up enhanced vehicle visibility checks...');
  
  // Get all vehicle radio buttons using DOMManager instead of direct DOM query
  const vehicleRadios = DOMManager.querySelectorAll('input[name^="vehicle_type_"]');
  
  if (vehicleRadios.length === 0) {
    console.warn('⚠️ No vehicle radio buttons found for visibility checks');
    return;
  }
  
  vehicleRadios.forEach((radio, index) => {
    // Use DOMManager for event binding instead of direct addEventListener
    DOMManager.addEventListener(radio, 'change', function(event) {
      const vehicleName = DOMManager.getAttribute(this, 'name');
      const vehicleValue = DOMManager.getValue(this);
      const isChecked = this.checked;
      
      console.log(`🚗 Vehicle visibility check: ${vehicleName} = ${vehicleValue} (checked: ${isChecked})`);
      
      if (isChecked) {
        // Emit vehicle visibility event using EventBus
        eventBus.emit(EventDefinitions.EVENTS.VEHICLE.SELECTED, 
          EventDefinitions.createVehiclePayload({
            vehicleType: vehicleValue,
            vehicleId: DOMManager.getAttribute(this, 'id'),
            tabType: vehicleName.replace('vehicle_type_', ''),
            source: 'visibility-check',
            selectionMethod: 'radio-change'
          })
        );
        
        // Trigger overall form validation check
        setTimeout(() => {
          checkOverallFormValidity();
          checkVehicleVisibility();
        }, 100);
      }
    });
    
    console.log(`🔗 Bound visibility check to vehicle radio ${index + 1}: ${DOMManager.getAttribute(radio, 'name')}`);
  });
  
  // Set up form field listeners that affect vehicle visibility
  setupVehicleVisibilityFormListeners();
  
  console.log(`✅ Enhanced vehicle visibility checks setup complete - ${vehicleRadios.length} radios bound`);
}

/**
 * Setup form field listeners that affect vehicle visibility
 */
function setupVehicleVisibilityFormListeners() {
  console.log('🔍 Setting up form listeners for vehicle visibility...');
  
  // Location fields that affect vehicle visibility
  const locationFields = ['from-location', 'to-address'];
  locationFields.forEach(fieldId => {
    const field = DOMManager.getElementById(fieldId);
    if (field) {
      // Use DOMManager for event binding
      DOMManager.addEventListener(field, 'input', function() {
        // Debounce the visibility check
        clearTimeout(this._visibilityTimeout);
        this._visibilityTimeout = setTimeout(() => {
          checkVehicleVisibility();
        }, 300);
      });
      
      DOMManager.addEventListener(field, 'blur', function() {
        // Immediate check on blur
        checkVehicleVisibility();
      });
    }
  });
  
  // Booking time buttons that affect vehicle visibility
  const timeButtons = DOMManager.querySelectorAll('.booking-time-button');
  timeButtons.forEach(button => {
    DOMManager.addEventListener(button, 'click', function() {
      // Add selected state using DOMManager
      const allTimeButtons = DOMManager.querySelectorAll('.booking-time-button');
      allTimeButtons.forEach(btn => {
        DOMManager.removeClass(btn, 'selected');
        DOMManager.setAttribute(btn, 'aria-selected', 'false');
      });
      
      DOMManager.addClass(this, 'selected');
      DOMManager.setAttribute(this, 'aria-selected', 'true');
      
      // Emit time selection event
      eventBus.emit(EventDefinitions.EVENTS.BOOKING.TIME_SELECTED, {
        timeSlot: DOMManager.getText(this),
        buttonId: DOMManager.getAttribute(this, 'id'),
        timestamp: Date.now()
      });
      
      // Check vehicle visibility
      setTimeout(checkVehicleVisibility, 100);
    });
  });
  
  // Experience dropdown that might affect vehicle visibility
  const experienceDropdown = DOMManager.getElementById('experience-dropdown');
  if (experienceDropdown) {
    DOMManager.addEventListener(experienceDropdown, 'change', function() {
      const selectedExperience = DOMManager.getValue(this);
      
      // Emit experience change event
      eventBus.emit(EventDefinitions.EVENTS.BOOKING.EXPERIENCE_SELECTED, {
        experienceType: selectedExperience,
        timestamp: Date.now()
      });
      
      // Check vehicle visibility based on experience type
      setTimeout(checkVehicleVisibility, 100);
    });
  }
  
  console.log('✅ Vehicle visibility form listeners setup complete');
}

/**
 * Enhanced checkVehicleVisibility function using DOMManager
 * This function is already partially updated but let's make it fully compliant
 */
function checkVehicleVisibility() {
  console.log('🔍 Checking vehicle visibility with DOMManager...');
  
  // Get form elements using DOMManager
  const fromLocation = DOMManager.getElementById('from-location');
  const toAddress = DOMManager.getElementById('to-address');
  const experienceDropdown = DOMManager.getElementById('experience-dropdown');
  
  // Check validation states using DOMManager
  const fromValid = fromLocation && DOMManager.getValue(fromLocation).trim() !== '';
  const toValid = toAddress && DOMManager.getValue(toAddress).trim() !== '';
  const experienceSelected = experienceDropdown && DOMManager.getValue(experienceDropdown) !== '';
  
  // Check if booking time is selected using DOMManager
  const bookingTimeSelected = DOMManager.querySelector('.booking-time-button.selected');
  
  // Get all vehicle containers using DOMManager
  const vehicleContainers = DOMManager.querySelectorAll('[id*="vehicle-selection"]');
  
  vehicleContainers.forEach(container => {
    const containerId = DOMManager.getAttribute(container, 'id');
    const tabType = containerId.replace('vehicle-selection-', '');
    
    // Determine visibility conditions based on tab type
    let shouldShow = false;
    
    switch (tabType) {
      case 'oneway':
      case 'roundtrip':
        shouldShow = fromValid && toValid && bookingTimeSelected;
        break;
        
      case 'experience-plus':
        shouldShow = experienceSelected && fromValid;
        break;
        
      case 'hourly_chauffeur':
        shouldShow = fromValid && bookingTimeSelected;
        break;
        
      default:
        shouldShow = fromValid && toValid;
    }
    
    // Get current visibility state using DOMManager
    const isCurrentlyHidden = DOMManager.hasClass(container, 'hidden');
    
    if (shouldShow && isCurrentlyHidden) {
      // Show vehicle container with animation
      showVehicleContainer(container, containerId, tabType, {
        fromValid, toValid, experienceSelected, bookingTimeSelected: !!bookingTimeSelected
      });
      
    } else if (!shouldShow && !isCurrentlyHidden) {
      // Hide vehicle container with animation
      hideVehicleContainer(container, containerId, tabType, {
        fromValid, toValid, experienceSelected, bookingTimeSelected: !!bookingTimeSelected
      });
    }
  });
}

/**
 * Show vehicle container with DOMManager and EventBus
 * @param {HTMLElement} container - Vehicle container element
 * @param {string} containerId - Container ID
 * @param {string} tabType - Tab type
 * @param {Object} conditions - Visibility conditions
 */
function showVehicleContainer(container, containerId, tabType, conditions) {
  console.log(`✅ Showing vehicle container: ${containerId}`);
  
  // Remove hidden class using DOMManager
  DOMManager.removeClass(container, 'hidden');
  
  // Add show animation
  setTimeout(() => {
    DOMManager.addClass(container, 'show');
    DOMManager.removeClass(container, 'hiding');
  }, 50);
  
  // Emit vehicle container visibility event using EventBus
  eventBus.emit(EventDefinitions.EVENTS.UI.VEHICLE_CONTAINER_SHOWN, {
    containerId,
    tabType,
    trigger: 'form-validation',
    conditions,
    timestamp: Date.now()
  });
  
  // Emit analytics event
  eventBus.emit(EventDefinitions.EVENTS.ANALYTICS.TRACK, {
    event: 'vehicle_container_shown',
    properties: {
      container_id: containerId,
      tab_type: tabType,
      conditions
    },
    timestamp: Date.now()
  });
}

/**
 * Hide vehicle container with DOMManager and EventBus
 * @param {HTMLElement} container - Vehicle container element
 * @param {string} containerId - Container ID
 * @param {string} tabType - Tab type
 * @param {Object} conditions - Visibility conditions
 */
function hideVehicleContainer(container, containerId, tabType, conditions) {
  console.log(`❌ Hiding vehicle container: ${containerId}`);
  
  // Add hiding animation using DOMManager
  DOMManager.removeClass(container, 'show');
  DOMManager.addClass(container, 'hiding');
  
  // Hide after animation
  setTimeout(() => {
    DOMManager.addClass(container, 'hidden');
    DOMManager.removeClass(container, 'hiding');
  }, 400);
  
  // Clear any selected vehicles in this container
  clearVehicleSelectionInContainer(container, tabType);
  
  // Emit vehicle container hidden event using EventBus
  eventBus.emit(EventDefinitions.EVENTS.UI.VEHICLE_CONTAINER_HIDDEN, {
    containerId,
    tabType,
    trigger: 'form-validation',
    conditions,
    timestamp: Date.now()
  });
  
  // Emit analytics event
  eventBus.emit(EventDefinitions.EVENTS.ANALYTICS.TRACK, {
    event: 'vehicle_container_hidden',
    properties: {
      container_id: containerId,
      tab_type: tabType,
      conditions
    },
    timestamp: Date.now()
  });
}

/**
 * Clear vehicle selection in a container using DOMManager
 * @param {HTMLElement} container - Vehicle container element
 * @param {string} tabType - Tab type
 */
function clearVehicleSelectionInContainer(container, tabType) {
  // Get all radio buttons in this container using DOMManager
  const radioButtons = DOMManager.querySelectorAll(`input[name="vehicle_type_${tabType}"]`, container);
  
  radioButtons.forEach(radio => {
    if (radio.checked) {
      const vehicleId = DOMManager.getAttribute(radio, 'id');
      const vehicleType = DOMManager.getValue(radio);
      
      // Uncheck the radio button
      radio.checked = false;
      
      // Remove visual selection state from vehicle card
      const vehicleCard = DOMManager.querySelector(`label[for="${vehicleId}"]`);
      if (vehicleCard) {
        DOMManager.removeClass(vehicleCard, 'selected', 'ring-2', 'ring-blue-500', 'bg-blue-50');
        DOMManager.setAttribute(vehicleCard, 'aria-selected', 'false');
      }
      
      // Emit vehicle deselection event
      eventBus.emit(EventDefinitions.EVENTS.VEHICLE.DESELECTED, {
        vehicleId,
        vehicleType,
        tabType,
        reason: 'container-hidden',
        timestamp: Date.now()
      });
      
      console.log(`🚗 Cleared vehicle selection: ${vehicleType} in ${tabType}`);
    }
  });
}

// ========================================
// OTHER FUNCTIONS THAT NEED DOMMANAGER UPDATES
// ========================================

/**
 * Enhanced reset button functionality using DOMManager and EventBus
 * Replaces direct DOM manipulation with standardized event-driven patterns
 */
function initializeResetButton() {
  console.log('🔄 Setting up enhanced reset button with DOMManager and EventBus...');
  
  // Get reset button using DOMManager
  const resetButton = DOMManager.getElementById('reset-button');
  
  if (!resetButton) {
    console.warn('⚠️ Reset button not found');
    
    // Emit UI error event
    eventBus.emit(EventDefinitions.EVENTS.ERROR.UI_ERROR, {
      component: 'ResetButton',
      message: 'Reset button element not found',
      elementId: 'reset-button',
      operation: 'initialization',
      timestamp: Date.now()
    });
    
    return false;
  }
  
  // Bind click event using DOMManager
  DOMManager.addEventListener(resetButton, 'click', function(event) {
    event.preventDefault();
    
    console.log('🔄 Reset button clicked by user');
    
    // Emit reset requested event using EventDefinitions
    eventBus.emit(EventDefinitions.EVENTS.FORM.RESET_REQUESTED, 
      EventDefinitions.createFormPayload('booking-form', null, {
        source: 'reset-button',
        component: 'ResetButton',
        trigger: 'user-click',
        timestamp: Date.now()
      })
    );
  });
  
  // Set up EventBus listeners for reset workflow
  setupResetEventListeners();
  
  console.log('✅ Enhanced reset button initialized with DOMManager and EventBus');
  return true;
}

/**
 * Setup EventBus listeners for the reset workflow
 */
function setupResetEventListeners() {
  console.log('🎧 Setting up reset EventBus listeners...');
  
  // Listen for reset requests
  eventBus.on(EventDefinitions.EVENTS.FORM.RESET_REQUESTED, handleResetRequest);
  
  // Listen for reset completion confirmations
  eventBus.on(EventDefinitions.EVENTS.FORM.RESET_COMPLETED, handleResetCompleted);
  
  // Listen for individual component reset confirmations
  eventBus.on(EventDefinitions.EVENTS.VEHICLE.SELECTION_RESET, handleVehicleSelectionReset);
  eventBus.on(EventDefinitions.EVENTS.ERROR.ALL_CLEARED, handleErrorsCleared);
  
  console.log('✅ Reset EventBus listeners setup complete');
}

/**
 * Handle reset request from EventBus
 * @param {Object} data - Reset request event data
 */
function handleResetRequest(data) {
  const { formId, source, component } = data;
  
  console.log(`🔄 Processing reset request for ${formId} from ${source}`);
  
  try {
    // Emit reset started event
    eventBus.emit(EventDefinitions.EVENTS.FORM.RESET_STARTED, {
      formId,
      source,
      component,
      timestamp: Date.now()
    });
    
    // Show loading state on reset button
    setResetButtonLoadingState(true);
    
    // Perform the reset operations
    resetFormFields(formId);
    resetErrorStates();
    resetVehicleSelection();
    resetUIStates();
    resetComponentStates();
    
    // Emit reset completed event
    eventBus.emit(EventDefinitions.EVENTS.FORM.RESET_COMPLETED, {
      formId,
      source,
      component,
      resetOperations: ['form-fields', 'error-states', 'vehicle-selection', 'ui-states', 'component-states'],
      timestamp: Date.now()
    });
    
    console.log('✅ Reset operations completed successfully');
    
  } catch (error) {
    console.error('❌ Reset operation failed:', error);
    
    // Emit reset error event
    eventBus.emit(EventDefinitions.EVENTS.ERROR.SYSTEM, {
      error: error.message,
      component: 'ResetButton',
      operation: 'form-reset',
      formId,
      source
    });
  } finally {
    // Hide loading state on reset button
    setTimeout(() => {
      setResetButtonLoadingState(false);
    }, 500); // Brief delay to show completion
  }
}

/**
 * Reset form fields using DOMManager
 * @param {string} formId - Form ID to reset
 */
function resetFormFields(formId) {
  console.log(`📝 Resetting form fields for ${formId}`);
  
  // Get form using DOMManager
  const form = DOMManager.getElementById(formId);
  
  if (!form) {
    console.warn(`⚠️ Form not found: ${formId}`);
    
    eventBus.emit(EventDefinitions.EVENTS.ERROR.UI_ERROR, {
      component: 'FormReset',
      message: `Form element not found: ${formId}`,
      elementId: formId,
      operation: 'field-reset'
    });
    return false;
  }
  
  // Reset native form
  form.reset();
  
  // Clear all input values using DOMManager
  const allInputs = DOMManager.querySelectorAll('input, select, textarea', form);
  allInputs.forEach(input => {
    const inputType = DOMManager.getAttribute(input, 'type');
    const tagName = input.tagName.toLowerCase();
    
    if (inputType === 'radio' || inputType === 'checkbox') {
      input.checked = false;
    } else if (tagName === 'select') {
      input.selectedIndex = 0;
    } else {
      DOMManager.setValue(input, '');
    }
    
    // Clear any custom properties
    if (input.place) {
      input.place = null;
    }
  });
  
  // Reset Google Maps autocomplete if present
  resetGoogleMapsInputs();
  
  // Emit form data reset event
  eventBus.emit(EventDefinitions.EVENTS.FORM.DATA_RESET, {
    formId,
    fieldsReset: allInputs.length,
    timestamp: Date.now()
  });
  
  console.log(`✅ Form fields reset complete - ${allInputs.length} fields cleared`);
  return true;
}

/**
 * Reset error states using DOMManager
 */
function resetErrorStates() {
  console.log('🧹 Clearing all error states...');
  
  // Clear global error
  eventBus.emit(EventDefinitions.EVENTS.ERROR.CLEAR_GLOBAL, {
    source: 'reset-operation',
    timestamp: Date.now()
  });
  
  // Clear all field error messages using DOMManager
  const errorElements = DOMManager.querySelectorAll('[id$="-error"], .field-error, .error-message');
  errorElements.forEach(element => {
    DOMManager.setHTML(element, '');
    DOMManager.addClass(element, 'hidden');
  });
  
  // Remove error classes from all form fields using DOMManager
  const formFields = DOMManager.querySelectorAll('input, select, textarea');
  formFields.forEach(field => {
    DOMManager.removeClass(field, 'error', 'border-red-500', 'border-red-400', 'ring-red-500');
    DOMManager.setAttribute(field, 'aria-invalid', 'false');
    DOMManager.removeAttribute(field, 'aria-describedby');
  });
  
  // Remove error classes from fieldsets using DOMManager
  const fieldsets = DOMManager.querySelectorAll('fieldset');
  fieldsets.forEach(fieldset => {
    DOMManager.removeClass(fieldset, 'error', 'border-red-500');
    DOMManager.removeAttribute(fieldset, 'aria-describedby');
  });
  
  // Emit all errors cleared event
  eventBus.emit(EventDefinitions.EVENTS.ERROR.ALL_CLEARED, {
    source: 'reset-operation',
    errorElementsCleared: errorElements.length,
    formFieldsCleared: formFields.length,
    timestamp: Date.now()
  });
  
  console.log(`🧹 Error states cleared - ${errorElements.length} error elements and ${formFields.length} form fields`);
}

/**
 * Reset vehicle selection using DOMManager
 */
function resetVehicleSelection() {
  console.log('🚗 Resetting vehicle selection...');
  
  // Uncheck all vehicle radio buttons using DOMManager
  const vehicleRadios = DOMManager.querySelectorAll('input[name^="vehicle_type_"]');
  vehicleRadios.forEach(radio => {
    radio.checked = false;
    
    // Remove selection styling from associated cards
    const vehicleId = DOMManager.getAttribute(radio, 'id');
    const vehicleCard = DOMManager.querySelector(`label[for="${vehicleId}"]`);
    if (vehicleCard) {
      DOMManager.removeClass(vehicleCard, 'selected', 'ring-2', 'ring-blue-500', 'bg-blue-50');
      DOMManager.setAttribute(vehicleCard, 'aria-selected', 'false');
    }
  });
  
  // Hide all vehicle containers using DOMManager
  const vehicleContainers = DOMManager.querySelectorAll('[id*="vehicle-selection"]');
  vehicleContainers.forEach(container => {
    DOMManager.addClass(container, 'hidden');
    DOMManager.removeClass(container, 'show', 'visible');
  });
  
  // Reset any vehicle-specific UI elements
  const vehicleCards = DOMManager.querySelectorAll('.vehicle-card');
  vehicleCards.forEach(card => {
    DOMManager.removeClass(card, 'selected', 'highlighted', 'active');
  });
  
  // Emit vehicle selection reset event
  eventBus.emit(EventDefinitions.EVENTS.VEHICLE.SELECTION_RESET, {
    vehicleRadiosReset: vehicleRadios.length,
    vehicleContainersHidden: vehicleContainers.length,
    vehicleCardsReset: vehicleCards.length,
    timestamp: Date.now()
  });
  
  console.log(`🚗 Vehicle selection reset - ${vehicleRadios.length} radios, ${vehicleContainers.length} containers`);
}

/**
 * Reset UI states using DOMManager
 */
function resetUIStates() {
  console.log('🎨 Resetting UI states...');
  
  // Reset tab navigation to default state
  const tabButtons = DOMManager.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    DOMManager.setAttribute(button, 'aria-selected', 'false');
    DOMManager.removeClass(button, 'active', 'selected');
  });
  
  // Set first tab as active
  if (tabButtons.length > 0) {
    DOMManager.setAttribute(tabButtons[0], 'aria-selected', 'true');
    DOMManager.addClass(tabButtons[0], 'active');
  }
  
  // Reset tab panels
  const tabPanels = DOMManager.querySelectorAll('.tab-panel');
  tabPanels.forEach(panel => {
    DOMManager.addClass(panel, 'hidden');
  });
  
  // Show first tab panel
  if (tabPanels.length > 0) {
    DOMManager.removeClass(tabPanels[0], 'hidden');
  }
  
  // Reset booking time selections using DOMManager
  const timeButtons = DOMManager.querySelectorAll('.booking-time-button');
  timeButtons.forEach(button => {
    DOMManager.removeClass(button, 'selected', 'active');
    DOMManager.setAttribute(button, 'aria-selected', 'false');
  });
  
  // Hide all experience-specific containers
  const experienceContainers = DOMManager.querySelectorAll('[id*="container"], [id*="options"]');
  experienceContainers.forEach(container => {
    if (container.id.includes('duration') || 
        container.id.includes('water') || 
        container.id.includes('wynwood') || 
        container.id.includes('relocation')) {
      DOMManager.addClass(container, 'hidden');
    }
  });
  
  // Reset experience dropdown to default
  const experienceDropdown = DOMManager.getElementById('experience-dropdown');
  if (experienceDropdown) {
    experienceDropdown.selectedIndex = 0;
  }
  
  // Emit UI states reset event
  eventBus.emit(EventDefinitions.EVENTS.UI.STATES_RESET, {
    tabsReset: tabButtons.length,
    timeButtonsReset: timeButtons.length,
    experienceContainersHidden: experienceContainers.length,
    timestamp: Date.now()
  });
  
  console.log('🎨 UI states reset complete');
}

/**
 * Reset component states
 */
function resetComponentStates() {
  console.log('🔧 Resetting component states...');
  
  // Reset form field states if they exist
  if (window.formFieldStates) {
    window.formFieldStates = {};
  }
  
  // Reset any cached validation states
  if (window.validationCache) {
    window.validationCache.clear();
  }
  
  // Emit component reset requests to registered components
  eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENT_RESET_REQUESTED, {
    source: 'form-reset',
    timestamp: Date.now()
  });
  
  console.log('🔧 Component states reset');
}

/**
 * Reset Google Maps inputs
 */
function resetGoogleMapsInputs() {
  console.log('🗺️ Resetting Google Maps inputs...');
  
  // Reset location fields that might have Google Places autocomplete
  const locationFields = ['from-location', 'to-address', 'from-location-exp'];
  locationFields.forEach(fieldId => {
    const field = DOMManager.getElementById(fieldId);
    if (field) {
      // Clear the place property if it exists
      if (field.place) {
        field.place = null;
      }
      
      // Clear autocomplete value
      DOMManager.setValue(field, '');
      
      // Clear any Google Places styling
      DOMManager.removeClass(field, 'pac-target-input');
    }
  });
  
  console.log('🗺️ Google Maps inputs reset');
}

/**
 * Set loading state for reset button
 * @param {boolean} isLoading - Loading state
 */
function setResetButtonLoadingState(isLoading) {
  const resetButton = DOMManager.getElementById('reset-button');
  
  if (!resetButton) return;
  
  if (isLoading) {
    // Set loading state using DOMManager
    DOMManager.setAttribute(resetButton, 'disabled', 'disabled');
    DOMManager.addClass(resetButton, 'loading');
    
    // Update button text
    const buttonText = DOMManager.querySelector('.button-text', resetButton) || resetButton;
    DOMManager.setHTML(buttonText, '<span class="spinner"></span> Resetting...');
    
    // Emit loading started event
    eventBus.emit(EventDefinitions.EVENTS.UI.LOADING_STARTED, {
      elementId: 'reset-button',
      operation: 'form-reset',
      timestamp: Date.now()
    });
    
  } else {
    // Clear loading state using DOMManager
    DOMManager.removeAttribute(resetButton, 'disabled');
    DOMManager.removeClass(resetButton, 'loading');
    
    // Restore button text
    const buttonText = DOMManager.querySelector('.button-text', resetButton) || resetButton;
    DOMManager.setHTML(buttonText, 'Reset Form');
    
    // Emit loading completed event
    eventBus.emit(EventDefinitions.EVENTS.UI.LOADING_COMPLETED, {
      elementId: 'reset-button',
      operation: 'form-reset',
      timestamp: Date.now()
    });
  }
}

/**
 * Handle reset completion
 * @param {Object} data - Reset completion event data
 */
function handleResetCompleted(data) {
  const { formId, source, resetOperations } = data;
  
  console.log(`✅ Reset completed for ${formId} from ${source}`);
  console.log(`📋 Operations performed: ${resetOperations.join(', ')}`);
  
  // Show success message briefly
  eventBus.emit(EventDefinitions.EVENTS.UI.SUCCESS_MESSAGE, {
    message: 'Form reset successfully',
    duration: 2000,
    timestamp: Date.now()
  });
  
  // Track reset action
  eventBus.emit(EventDefinitions.EVENTS.ANALYTICS.TRACK, {
    event: 'form_reset',
    properties: {
      form_id: formId,
      source: source,
      operations_count: resetOperations.length,
      timestamp: Date.now()
    }
  });
}

/**
 * Handle vehicle selection reset confirmation
 * @param {Object} data - Vehicle selection reset event data
 */
function handleVehicleSelectionReset(data) {
  const { vehicleRadiosReset, vehicleContainersHidden } = data;
  
  console.log(`🚗 Vehicle selection reset confirmed: ${vehicleRadiosReset} radios, ${vehicleContainersHidden} containers`);
}

/**
 * Handle errors cleared confirmation
 * @param {Object} data - Errors cleared event data
 */
function handleErrorsCleared(data) {
  const { errorElementsCleared, formFieldsCleared } = data;
  
  console.log(`🧹 Errors cleared confirmed: ${errorElementsCleared} error elements, ${formFieldsCleared} form fields`);
}

// Update your existing resetFormData function to use the enhanced version
function resetFormData() {
  console.log('🔄 Legacy resetFormData called - delegating to enhanced reset system');
  
  // Emit reset request using the enhanced system
  eventBus.emit(EventDefinitions.EVENTS.FORM.RESET_REQUESTED, {
    formId: 'booking-form',
    source: 'legacy-function',
    component: 'ResetButton',
    timestamp: Date.now()
  });
}

// Update your DOM ready handler to include the enhanced reset button
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard: DOM ready - initializing enhanced reset functionality...');
  
  try {
    // Emit DOM ready event
    eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENT_INITIALIZED, {
      component: 'dashboard',
      phase: 'dom-ready',
      timestamp: Date.now()
    });
    
    // 1. Initialize enhanced reset functionality FIRST
    initializeResetButton();
    
    // 2. Set up enhanced real-time validation (already includes form field listeners)
    setupRealtimeValidation();
    
    // 3. Set up enhanced vehicle visibility checks (NOW FULLY WITH DOMMANAGER)
    setupVehicleVisibilityChecks();
    
    // 4. Set up enhanced form submission (REPLACE EXISTING)
    setupEnhancedFormSubmission();
    
    // 5. Initialize dashboard components
    initializeDashboard();
    
    // 6. Set up enhanced vehicle selection handlers (ALREADY IMPLEMENTED)
    setupVehicleSelectionHandlers();
    
    // 7. Initialize maps for location fields
    if (typeof initAutocomplete !== 'undefined') {
      initAutocomplete(['from-location', 'to-address', 'from-location-exp']);
    }
    
    console.log('✅ Dashboard: Enhanced reset functionality initialized successfully');
    
  } catch (error) {
    console.error('❌ Dashboard: Enhanced reset initialization failed:', error);
  }
});

// Initialize when DOM is ready (for safety)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  // DOM already loaded, initialize immediately
  initializeDashboard();
}

// ========================================
// EVENT LISTENERS FOR DEBUGGING AND MONITORING
// ========================================

// Listen to all system events for debugging
Object.values(EventDefinitions.EVENTS.SYSTEM).forEach(eventName => {
  eventBus.on(eventName, (data) => {
    console.log(`⚙️ System Event: ${eventName}`, data);
  });
});

// Listen to all form events for debugging
Object.values(EventDefinitions.EVENTS.FORM).forEach(eventName => {
  eventBus.on(eventName, (data) => {
    console.log(`📝 Form Event: ${eventName}`, data);
  });
});

// Listen to all UI events for debugging
Object.values(EventDefinitions.EVENTS.UI).forEach(eventName => {
  eventBus.on(eventName, (data) => {
    console.log(`🎨 UI Event: ${eventName}`, data);
  });
});

// Export functions for testing
window.dashboardModuleFunctions = {
  initializeTabNavigation,
  initializeFallbackTabs,
  initializeDashboard,
  handleFormSubmission,
  checkVehicleVisibility,
  setupRealtimeValidation,
  setupVehicleVisibilityChecks,
  initializeResetButton,
  resetFormData
};

// ========================================
// LEGACY COMPATIBILITY AND TEST EVENTS
// ========================================

// Test event emissions for verification
setTimeout(() => {
  // Test map event
  eventBus.emit(EventDefinitions.EVENTS.MAP.CURRENT_LOCATION_REQUESTED, 
    EventDefinitions.createLocationPayload({
      fieldId: 'from-location',
      locationType: 'current-position'
    })
  );
  
  // Test analytics event
  eventBus.emit(EventDefinitions.EVENTS.ANALYTICS.TRACK, 
    EventDefinitions.createAnalyticsPayload('dashboard_loaded', {
      loadTime: Date.now(),
      userAgent: navigator.userAgent
    })
  );
}, 1000);

console.log("✅ Dashboard.js module loaded successfully with full EventBus architecture");

// ========================================
// ENHANCED FORM SUBMISSION WITH DOMMANAGER AND EVENTBUS
// ========================================

/**
 * Setup enhanced form submission using DOMManager and EventBus
 * Replaces direct DOM manipulation with standardized event-driven patterns
 */
function setupEnhancedFormSubmission() {
  console.log('📝 Setting up enhanced form submission with DOMManager and EventBus...');
  
  const form = DOMManager.getElementById('booking-form');
  
  if (!form) {
    console.error('❌ Booking form not found');
    eventBus.emit(EventDefinitions.EVENTS.ERROR.UI_ERROR, {
      component: 'FormSubmission',
      message: 'Booking form not found',
      elementId: 'booking-form',
      timestamp: Date.now()
    });
    return false;
  }
  
  // Set up form submission listener using DOMManager
  DOMManager.addEventListener(form, 'submit', function(event) {
    event.preventDefault();
    
    console.log('📝 Form submission initiated by user');
    
    // Emit form submission event using EventDefinitions
    eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_REQUESTED, 
      EventDefinitions.createFormPayload(
        DOMManager.getAttribute(form, 'id'), 
        null, 
        {
          source: 'user-submit',
          component: 'enhanced-form-submission',
          timestamp: Date.now()
        }
      )
    );
  });
  
  // Set up EventBus listeners for form submission flow
  setupFormSubmissionEventListeners();
  
  console.log('✅ Enhanced form submission setup complete');
  return true;
}

/**
 * Setup EventBus listeners for the form submission workflow
 */
function setupFormSubmissionEventListeners() {
  console.log('🎧 Setting up form submission EventBus listeners...');
  
  // Listen for form submission requests
  eventBus.on(EventDefinitions.EVENTS.FORM.SUBMISSION_REQUESTED, async (data) => {
    await processEnhancedFormSubmission(data);
  });
  
  // Listen for loading state changes
  eventBus.on(EventDefinitions.EVENTS.UI.LOADING_STATE, (data) => {
    handleLoadingStateChange(data);
  });
  
  // Listen for validation failure events
  eventBus.on(EventDefinitions.EVENTS.FORM.VALIDATION_FAILED, (data) => {
    handleValidationFailure(data);
  });
  
  // Listen for submission success events
  eventBus.on(EventDefinitions.EVENTS.FORM.SUBMISSION_SUCCEEDED, (data) => {
    handleSubmissionSuccess(data);
  });
  
  // Listen for submission failure events
  eventBus.on(EventDefinitions.EVENTS.FORM.SUBMISSION_FAILED, (data) => {
    handleSubmissionFailure(data);
  });
  
  // Listen for form reset requests
  eventBus.on(EventDefinitions.EVENTS.FORM.RESET_REQUESTED, (data) => {
    handleFormResetRequest(data);
  });
  
  console.log('✅ Form submission EventBus listeners setup complete');
}

/**
 * Process form submission using DOMManager and EventBus
 * @param {Object} data - Submission event data
 */
async function processEnhancedFormSubmission(data) {
  const { formId, source } = data;
  
  console.log(`🔄 Processing enhanced form submission for ${formId} from ${source}`);
  
  try {
    // Emit submission started event
    eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_STARTED, {
      formId,
      source,
      timestamp: Date.now()
    });
    
    // Show loading state
    setSubmissionLoadingState(true);
    
    // Collect form data using DOMManager
    const formData = collectEnhancedFormData();
    
    // Emit data collected event
    eventBus.emit(EventDefinitions.EVENTS.FORM.DATA_COLLECTED, {
      formId,
      data: formData,
      fieldCount: Object.keys(formData).length,
      timestamp: Date.now()
    });
    
    // Validate form data
    const validationResult = validateEnhancedFormData(formData);
    
    if (!validationResult.isValid) {
      // Emit validation failed event
      eventBus.emit(EventDefinitions.EVENTS.FORM.VALIDATION_FAILED, {
        formId,
        errors: validationResult.errors,
        errorCount: Object.keys(validationResult.errors).length,
        timestamp: Date.now()
      });
      return;
    }
    
    // Submit form data
    const submissionResult = await submitEnhancedFormData(formData);
    
    // Emit submission success event
    eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_SUCCEEDED, {
      formId,
      result: submissionResult,
      formData,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Enhanced form submission failed:', error);
    
    // Emit submission failed event
    eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_FAILED, {
      formId,
      error: error.message,
      source,
      timestamp: Date.now()
    });
    
  } finally {
    // Hide loading state
    setSubmissionLoadingState(false);
  }
}

/**
 * Collect form data using DOMManager
 * @returns {Object} Collected form data
 */
function collectEnhancedFormData() {
  console.log('📋 Collecting enhanced form data using DOMManager...');
  
  const formData = {};
  
  // Collect standard form fields using DOMManager
  const fieldMappings = {
    'from-location': 'fromLocation',
    'to-address': 'toAddress',
    'booking-datetime': 'dateTime',
    'passenger-count': 'passengerCount',
    'contact-email': 'contactEmail',
    'contact-phone': 'contactPhone',
    'special-notes': 'specialNotes',
    'experience-dropdown': 'experience'
  };
  
  Object.entries(fieldMappings).forEach(([fieldId, dataKey]) => {
    const field = DOMManager.getElementById(fieldId);
    if (field) {
      const value = DOMManager.getValue(field);
      if (value && value.trim() !== '') {
        formData[dataKey] = value.trim();
      }
    }
  });
  
  // Collect vehicle selection using DOMManager
  const vehicleElement = DOMManager.querySelector('input[name^="vehicle_type_"]:checked');
  if (vehicleElement) {
    formData.vehicleType = DOMManager.getValue(vehicleElement);
    formData.vehicleCategory = DOMManager.getAttribute(vehicleElement, 'name').replace('vehicle_type_', '');
  }
  
  // Collect active tab using DOMManager
  const activeTabButton = DOMManager.querySelector('.tab-button[aria-selected="true"]');
  if (activeTabButton) {
    formData.serviceType = DOMManager.getAttribute(activeTabButton, 'data-tab-target')?.replace('#', '');
  }
  
  // Collect experience-specific fields
  if (formData.experience) {
    formData.experienceFields = collectExperienceSpecificData(formData.experience);
  }
  
  // Add metadata
  formData._metadata = {
    submissionTime: new Date().toISOString(),
    userAgent: navigator.userAgent,
    formVersion: '2.0-enhanced',
    collectionMethod: 'DOMManager'
  };
  
  console.log(`✅ Collected ${Object.keys(formData).length} form fields using DOMManager`);
  return formData;
}

/**
 * Collect experience-specific data using DOMManager
 * @param {string} experienceType - Type of experience
 * @returns {Object} Experience-specific data
 */
function collectExperienceSpecificData(experienceType) {
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
 * Validate enhanced form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result
 */
function validateEnhancedFormData(formData) {
  console.log('🔍 Validating enhanced form data...');
  
  const errors = {};
  const warnings = [];
  
  // Required field validation
  if (!formData.fromLocation) {
    errors.fromLocation = 'Pickup location is required';
  }
  
  if (!formData.toAddress) {
    errors.toAddress = 'Destination is required';
  }
  
  if (!formData.dateTime) {
    errors.dateTime = 'Date and time are required';
  }
  
  if (!formData.vehicleType) {
    errors.vehicleType = 'Please select a vehicle';
  }
  
  // Business logic validation
  if (formData.fromLocation && formData.toAddress) {
    if (formData.fromLocation === formData.toAddress) {
      errors.locations = 'Pickup and destination cannot be the same';
    }
  }
  
  // DateTime validation
  if (formData.dateTime) {
    const bookingDate = new Date(formData.dateTime);
    const now = new Date();
    
    if (bookingDate <= now) {
      errors.dateTime = 'Booking time must be in the future';
    }
    
    // Add warning for short notice bookings
    if (bookingDate.getTime() - now.getTime() < 2 * 60 * 60 * 1000) {
      warnings.push('Bookings with less than 2 hours notice may incur additional fees');
    }
  }
  
  // Email validation if provided
  if (formData.contactEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }
  }
  
  // Phone validation if provided
  if (formData.contactPhone) {
    const phoneRegex = /^\+?[\d\s()-]{10,20}$/;
    if (!formData.contactPhone.match(phoneRegex)) {
      errors.contactPhone = 'Please enter a valid phone number';
    }
  }
  
  const isValid = Object.keys(errors).length === 0;
  
  // Add global error if no specific errors but form is invalid
  if (!isValid && Object.keys(errors).length === 0) {
    errors.global = 'Please fill in all required fields';
  }
  
  const validationResult = {
    isValid,
    errors,
    warnings,
    fieldCount: Object.keys(formData).length,
    errorCount: Object.keys(errors).length,
    warningCount: warnings.length
  };
  
  console.log(`🔍 Validation complete: ${isValid ? 'PASSED' : 'FAILED'} (${Object.keys(errors).length} errors)`);
  return validationResult;
}

/**
 * Submit enhanced form data
 * @param {Object} formData - Form data to submit
 * @returns {Promise<Object>} Submission result
 */
async function submitEnhancedFormData(formData) {
  console.log('📤 Submitting enhanced form data...');
  
  const apiEndpoint = '/api/bookings';
  const timeout = 30000; // 30 seconds
  
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(formData),
      signal: AbortSignal.timeout(timeout)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `API Error: ${response.status} ${response.statusText}`);
    }
    
    console.log('✅ Enhanced form submitted successfully:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Enhanced form submission failed:', error);
    
    // Emit API error event
    eventBus.emit(EventDefinitions.EVENTS.ERROR.API, {
      endpoint: apiEndpoint,
      error: error.message,
      formData: { ...formData, _metadata: undefined }, // Exclude metadata
      method: 'POST',
      timestamp: Date.now()
    });
    
    throw error;
  }
}

/**
 * Set submission loading state using DOMManager
 * @param {boolean} isLoading - Loading state
 */
function setSubmissionLoadingState(isLoading) {
  const submitButton = DOMManager.getElementById('submit-booking');
  
  if (!submitButton) {
    console.warn('⚠️ Submit button not found');
    return;
  }
  
  if (isLoading) {
    DOMManager.setAttribute(submitButton, 'disabled', 'disabled');
    DOMManager.setHTML(submitButton, '<span class="spinner"></span> Processing...');
    DOMManager.addClass(submitButton, 'loading');
  } else {
    DOMManager.removeAttribute(submitButton, 'disabled');
    DOMManager.setHTML(submitButton, 'Submit Booking');
    DOMManager.removeClass(submitButton, 'loading');
  }
  
  // Emit loading state event
  eventBus.emit(EventDefinitions.EVENTS.UI.LOADING_STATE, {
    elementId: 'submit-booking',
    isLoading,
    timestamp: Date.now()
  });
}

/**
 * Handle loading state changes
 * @param {Object} data - Loading state data
 */
function handleLoadingStateChange(data) {
  const { elementId, isLoading } = data;
  
  if (elementId !== 'submit-booking') return;
  
  const element = DOMManager.getElementById(elementId);
  if (!element) return;
  
  if (isLoading) {
    DOMManager.setAttribute(element, 'disabled', 'disabled');
    DOMManager.setHTML(element, '<span class="spinner"></span> Processing...');
  } else {
    DOMManager.removeAttribute(element, 'disabled');
    DOMManager.setHTML(element, 'Submit Booking');
  }
}

/**
 * Handle validation failure
 * @param {Object} data - Validation failure data
 */
function handleValidationFailure(data) {
  const { errors, errorCount } = data;
  
  console.warn(`⚠️ Form validation failed with ${errorCount} errors:`, errors);
  
  // Show field-specific errors using DOMManager
  Object.entries(errors).forEach(([field, message]) => {
    const fieldId = mapValidationFieldToElementId(field);
    if (fieldId) {
      showFieldError(fieldId, message);
    }
  });
  
  // Show global error if present
  if (errors.global) {
    eventBus.emit(EventDefinitions.EVENTS.ERROR.GLOBAL_ERROR, {
      message: errors.global,
      severity: 'error',
      dismissible: true,
      timestamp: Date.now()
    });
  }
}

/**
 * Handle submission success
 * @param {Object} data - Submission success data
 */
function handleSubmissionSuccess(data) {
  const { result, formData } = data;
  
  console.log('🎉 Enhanced form submission successful:', result);
  
  // Show success message
  eventBus.emit(EventDefinitions.EVENTS.UI.SUCCESS_MESSAGE, {
    message: result.message || 'Booking confirmed successfully!',
    duration: 8000,
    timestamp: Date.now()
  });
  
  // Request form reset
  eventBus.emit(EventDefinitions.EVENTS.FORM.RESET_REQUESTED, {
    formId: 'booking-form',
    source: 'submission-success',
    timestamp: Date.now()
  });
  
  // Track successful submission
  eventBus.emit(EventDefinitions.EVENTS.ANALYTICS.TRACK, {
    event: 'enhanced_booking_submitted',
    properties: {
      vehicle_type: formData.vehicleType,
      service_type: formData.serviceType,
      experience_type: formData.experience,
      has_contact_info: !!(formData.contactEmail || formData.contactPhone)
    },
    timestamp: Date.now()
  });
}

/**
 * Handle submission failure
 * @param {Object} data - Submission failure data
 */
function handleSubmissionFailure(data) {
  const { error, formId } = data;
  
  console.error('❌ Enhanced form submission failed:', error);
  
  // Show error message
  eventBus.emit(EventDefinitions.EVENTS.ERROR.GLOBAL_ERROR, {
    message: `Submission failed: ${error}`,
    severity: 'error',
    dismissible: true,
    timestamp: Date.now()
  });
  
  // Track failed submission
  eventBus.emit(EventDefinitions.EVENTS.ANALYTICS.TRACK, {
    event: 'enhanced_booking_submission_failed',
    properties: {
      error_message: error,
      form_id: formId
    },
    timestamp: Date.now()
  });
}

/**
 * Handle form reset request
 * @param {Object} data - Reset request data
 */
function handleFormResetRequest(data) {
  const { formId, source } = data;
  
  console.log(`🔄 Handling form reset request for ${formId} from ${source}`);
  
  const form = DOMManager.getElementById(formId);
  if (form) {
    // Reset form using native method
    form.reset();
    
    // Clear any custom states using DOMManager
    const allInputs = DOMManager.querySelectorAll('input, select, textarea', form);
    allInputs.forEach(input => {
      DOMManager.removeClass(input, 'error', 'border-red-500');
      DOMManager.setAttribute(input, 'aria-invalid', 'false');
    });
    
    // Clear error messages
    const errorElements = DOMManager.querySelectorAll('[id$="-error"]');
    errorElements.forEach(errorEl => {
      DOMManager.setHTML(errorEl, '');
      DOMManager.addClass(errorEl, 'hidden');
    });
    
    // Clear vehicle selections
    const vehicleCards = DOMManager.querySelectorAll('.vehicle-card');
    vehicleCards.forEach(card => {
      DOMManager.removeClass(card, 'selected', 'ring-2', 'ring-blue-500', 'bg-blue-50');
    });
    
    console.log('✅ Form reset complete');
  }
}

/**
 * Show field error using DOMManager
 * @param {string} fieldId - Field ID
 * @param {string} message - Error message
 */
function showFieldError(fieldId, message) {
  const field = DOMManager.getElementById(fieldId);
  const errorElement = DOMManager.getElementById(`${fieldId}-error`);
  
  if (field) {
    DOMManager.addClass(field, 'error', 'border-red-500');
    DOMManager.setAttribute(field, 'aria-invalid', 'true');
  }
  
  if (errorElement) {
    DOMManager.setHTML(errorElement, message);
    DOMManager.removeClass(errorElement, 'hidden');
  }
}

/**
 * Map validation field names to element IDs
 * @param {string} validationField - Validation field name
 * @returns {string} Element ID
 */
function mapValidationFieldToElementId(validationField) {
  const fieldMapping = {
    fromLocation: 'from-location',
    toAddress: 'to-address',
    dateTime: 'booking-datetime',
    vehicleType: 'vehicle-selection',
    contactEmail: 'contact-email',
    contactPhone: 'contact-phone',
    locations: 'from-location' // Show location conflict on first field
  };
  
  return fieldMapping[validationField] || validationField;
}