// dashboard.js - COMPLETE VERSION with DashboardInitializer integration
console.log("🚀 Dashboard.js module loading...");
console.log("🧪 Testing: Module execution at", new Date().toISOString());

// ========================================
// CORE IMPORTS (Keep these)
// ========================================
import eventBus from './src/core/EventBus.js';
import DOMManager from './src/core/DOMManager.js';
import EventDefinitions from './src/core/EventDefinitions.js';
import { DashboardInitializer } from './core/DashboardInitializer.js';

// Legacy form events (will be migrated to EventDefinitions)
import { FORM_EVENTS, createSubmissionData, createSubmissionError } from './src/core/FormEvents.js';

// Error handling utilities
import { showGlobalError, clearGlobalError, emitError, emitClearError, emitGlobalError, emitClearAllErrors } from './errorHandling.js';

// Form validation utilities
import { forceLocationValidation } from './formValidation.js';

// Auto-initializing modules
import './validation-listeners.js';
import './maps.js';

// Make available globally
window.MiamiEvents = EventDefinitions;
window.eventBus = eventBus;
window.DOMManager = DOMManager;
window.forceLocationValidation = forceLocationValidation;

// Global dashboard initializer instance
let dashboardInitializer = null;

// ========================================
// RESTORE ESSENTIAL FUNCTIONALITY
// ========================================

/**
 * Vehicle Selection Management - RESTORED
 */
function initializeVehicleSelection() {
  console.log('🚗 Dashboard: Initializing vehicle selection...');
  
  // Handle vehicle radio button changes
  const vehicleRadios = DOMManager.querySelectorAll('input[name^="vehicle_type_"]');
  
  vehicleRadios.forEach(radio => {
    DOMManager.addEventListener(radio, 'change', function() {
      if (this.checked) {
        const vehicleType = DOMManager.getValue(this);
        const tabType = DOMManager.getAttribute(this, 'name').replace('vehicle_type_', '');
        
        console.log(`🚗 Vehicle selected: ${vehicleType} in ${tabType} tab`);
        
        // Emit standardized vehicle selection event
        eventBus.emit(EventDefinitions.EVENTS.VEHICLE.SELECTED, 
          EventDefinitions.createVehiclePayload({
            vehicleType,
            vehicleId: vehicleType,
            tabType,
            source: 'user-selection',
            timestamp: Date.now()
          })
        );
        
        // Update vehicle visibility logic
        checkVehicleVisibility();
      }
    });
  });
  
  console.log(`✅ Dashboard: ${vehicleRadios.length} vehicle radios initialized`);
}

/**
 * Vehicle Visibility Logic - RESTORED
 */
function checkVehicleVisibility() {
  console.log('👁️ Dashboard: Checking vehicle visibility...');
  
  // Get current active tab
  const activeTabButton = DOMManager.querySelector('.tab-button[aria-selected="true"]');
  const currentTab = activeTabButton ? DOMManager.getAttribute(activeTabButton, 'id') : 'oneway';
  
  // Vehicle container visibility logic
  const vehicleContainers = {
    'oneway': DOMManager.getElementById('vehicle-selection-oneway'),
    'roundtrip': DOMManager.getElementById('vehicle-selection-roundtrip'),
    'experiencePlus': DOMManager.getElementById('vehicle-selection-experience-plus')
  };
  
  // Hide all containers first
  Object.values(vehicleContainers).forEach(container => {
    if (container) {
      DOMManager.addClass(container, 'hidden');
    }
  });
  
  // Show the appropriate container
  if (vehicleContainers[currentTab]) {
    DOMManager.removeClass(vehicleContainers[currentTab], 'hidden');
    console.log(`✅ Dashboard: Showing vehicle container for ${currentTab}`);
    
    // Emit visibility change event
    eventBus.emit(EventDefinitions.EVENTS.UI.VEHICLE_CONTAINER_SHOWN, {
      currentTab,
      containerId: `vehicle-selection-${currentTab}`,
      timestamp: Date.now()
    });
  }
}

/**
 * Form Field Management - RESTORED
 */
function initializeFormFields() {
  console.log('📝 Dashboard: Initializing form fields...');
  
  // Location fields
  const locationFields = ['from-location', 'to-address', 'from-location-exp'];
  
  locationFields.forEach(fieldId => {
    const field = DOMManager.getElementById(fieldId);
    if (field) {
      // Real-time field change events
      DOMManager.addEventListener(field, 'input', (event) => {
        const value = DOMManager.getValue(field);
        
        eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_CHANGED,
          EventDefinitions.createFormPayload(fieldId, value, {
            fieldType: 'text',
            source: 'user-input'
          })
        );
      });
      
      // Validation on blur
      DOMManager.addEventListener(field, 'blur', (event) => {
        const value = DOMManager.getValue(field);
        const isValid = value.trim().length > 0;
        
        eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_VALIDATED, {
          fieldId,
          value,
          isValid,
          errors: isValid ? [] : ['This field is required'],
          timestamp: Date.now()
        });
      });
    }
  });
  
  console.log(`✅ Dashboard: ${locationFields.length} form fields initialized`);
}

/**
 * Reset Functionality - RESTORED
 */
function initializeResetFunctionality() {
  console.log('🔄 Dashboard: Initializing reset functionality...');
  
  const resetButton = DOMManager.getElementById('reset-button');
  
  if (resetButton) {
    DOMManager.addEventListener(resetButton, 'click', (event) => {
      event.preventDefault();
      
      console.log('🔄 Dashboard: Reset button clicked');
      
      // Emit reset requested event
      eventBus.emit(EventDefinitions.EVENTS.FORM.RESET_REQUESTED, {
        formId: 'booking-form',
        source: 'reset-button',
        component: 'dashboard',
        timestamp: Date.now()
      });
      
      // Perform reset actions
      performFormReset();
    });
  }
}

/**
 * Perform Form Reset - RESTORED
 */
function performFormReset() {
  console.log('🧹 Dashboard: Performing form reset...');
  
  try {
    // Clear all form fields
    const form = DOMManager.getElementById('booking-form');
    if (form) {
      form.reset();
    }
    
    // Clear location fields specifically
    const locationFields = ['from-location', 'to-address', 'from-location-exp'];
    locationFields.forEach(fieldId => {
      const field = DOMManager.getElementById(fieldId);
      if (field) {
        DOMManager.setValue(field, '');
      }
    });
    
    // Reset vehicle selections
    const vehicleRadios = DOMManager.querySelectorAll('input[name^="vehicle_type_"]');
    vehicleRadios.forEach(radio => {
      radio.checked = false;
    });
    
    // Reset to default tab
    const onewayTab = DOMManager.getElementById('oneway');
    if (onewayTab) {
      onewayTab.click();
    }
    
    // Clear all errors
    eventBus.emit(EventDefinitions.EVENTS.ERROR.CLEAR_ALL, {
      source: 'form-reset',
      timestamp: Date.now()
    });
    
    // Emit reset completed event
    eventBus.emit(EventDefinitions.EVENTS.FORM.RESET_COMPLETED, {
      formId: 'booking-form',
      source: 'dashboard',
      timestamp: Date.now()
    });
    
    console.log('✅ Dashboard: Form reset completed');
    
  } catch (error) {
    console.error('❌ Dashboard: Reset failed:', error);
    
    eventBus.emit(EventDefinitions.EVENTS.ERROR.SYSTEM, {
      component: 'dashboard',
      operation: 'form-reset',
      error: error.message,
      timestamp: Date.now()
    });
  }
}

/**
 * Tab Navigation Event Handlers - RESTORED
 */
function initializeTabEventHandlers() {
  console.log('🏷️ Dashboard: Initializing tab event handlers...');
  
  // Listen for tab change events
  eventBus.on(EventDefinitions.EVENTS.UI.TAB_CHANGED, (data) => {
    console.log(`🔄 Dashboard: Tab changed from ${data.previousTab} to ${data.currentTab}`);
    
    // Update vehicle visibility
    checkVehicleVisibility();
    
    // Update form validation context
    updateFormContext(data.currentTab);
  });
  
  console.log('✅ Dashboard: Tab event handlers initialized');
}

/**
 * Update Form Context - RESTORED
 */
function updateFormContext(currentTab) {
  console.log(`📝 Dashboard: Updating form context for ${currentTab}`);
  
  // Show/hide form fields based on tab
  const experienceFields = DOMManager.getElementById('from-location-exp');
  
  if (currentTab === 'experiencePlus') {
    if (experienceFields) {
      DOMManager.removeClass(experienceFields.parentElement, 'hidden');
    }
  } else {
    if (experienceFields) {
      DOMManager.addClass(experienceFields.parentElement, 'hidden');
    }
  }
  
  // Emit form context change event
  eventBus.emit(EventDefinitions.EVENTS.FORM.CONTEXT_CHANGED, {
    currentTab,
    timestamp: Date.now()
  });
}

/**
 * Form Submission - RESTORED
 */
function initializeFormSubmission() {
  console.log('📤 Dashboard: Initializing form submission...');
  
  const form = DOMManager.getElementById('booking-form');
  
  if (form) {
    DOMManager.addEventListener(form, 'submit', async (event) => {
      event.preventDefault();
      
      console.log('📤 Dashboard: Form submission requested');
      
      // Emit submission requested event
      eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_REQUESTED, {
        formId: 'booking-form',
        source: 'form-submit',
        timestamp: Date.now()
      });
      
      try {
        // Validate form before submission
        const isValid = await validateFormData();
        
        if (!isValid) {
          console.warn('⚠️ Dashboard: Form validation failed');
          return;
        }
        
        // Collect form data
        const formData = collectFormData();
        
        // Emit submission started
        eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_STARTED, {
          formId: 'booking-form',
          data: formData,
          timestamp: Date.now()
        });
        
        // Simulate submission (replace with actual API call)
        setTimeout(() => {
          eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_SUCCEEDED, {
            formId: 'booking-form',
            data: formData,
            result: { bookingId: 'BK' + Date.now() },
            timestamp: Date.now()
          });
        }, 1000);
        
      } catch (error) {
        console.error('❌ Dashboard: Form submission failed:', error);
        
        eventBus.emit(EventDefinitions.EVENTS.FORM.SUBMISSION_FAILED, {
          formId: 'booking-form',
          error: error.message,
          timestamp: Date.now()
        });
      }
    });
  }
}

/**
 * Validate Form Data - RESTORED
 */
async function validateFormData() {
  console.log('✅ Dashboard: Validating form data...');
  
  const requiredFields = ['from-location', 'to-address'];
  let isValid = true;
  
  for (const fieldId of requiredFields) {
    const field = DOMManager.getElementById(fieldId);
    const value = field ? DOMManager.getValue(field) : '';
    
    if (!value || value.trim().length === 0) {
      isValid = false;
      
      eventBus.emit(EventDefinitions.EVENTS.ERROR.VALIDATION, {
        fieldId,
        message: 'This field is required',
        timestamp: Date.now()
      });
    }
  }
  
  // Check vehicle selection
  const selectedVehicle = DOMManager.querySelector('input[name^="vehicle_type_"]:checked');
  if (!selectedVehicle) {
    isValid = false;
    
    eventBus.emit(EventDefinitions.EVENTS.ERROR.VALIDATION, {
      fieldId: 'vehicle-selection',
      message: 'Please select a vehicle',
      timestamp: Date.now()
    });
  }
  
  return isValid;
}

/**
 * Collect Form Data - RESTORED
 */
function collectFormData() {
  const form = DOMManager.getElementById('booking-form');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  // Add additional context
  const activeTab = DOMManager.querySelector('.tab-button[aria-selected="true"]');
  data.bookingType = activeTab ? DOMManager.getAttribute(activeTab, 'id') : 'oneway';
  data.timestamp = Date.now();
  
  return data;
}

// ========================================
// ENHANCED INITIALIZATION WITH DASHBOARDINITIALIZER
// ========================================

/**
 * Initialize Dashboard Legacy Functions
 */
async function initializeLegacyFunctions() {
  console.log('🔧 Dashboard: Initializing legacy functions...');
  
  try {
    // Initialize all restored functionality
    initializeVehicleSelection();
    initializeFormFields();
    initializeResetFunctionality();
    initializeTabEventHandlers();
    initializeFormSubmission();
    
    // Set up initial vehicle visibility
    checkVehicleVisibility();
    
    console.log('✅ Dashboard: All legacy functions initialized');
    return true;
    
  } catch (error) {
    console.error('❌ Dashboard: Legacy function initialization failed:', error);
    return false;
  }
}

// ========================================
// MAIN INITIALIZATION - HYBRID APPROACH
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 Dashboard: Starting hybrid initialization...');
    
    // Step 1: Initialize DashboardInitializer for core architecture
    dashboardInitializer = new DashboardInitializer({
      enableFallbacks: true,
      enableAnalytics: true,
      enableDebugMode: window.location.hostname === 'localhost',
      retryAttempts: 3,
      initializationTimeout: 30000
    });
    
    // Step 2: Initialize the core architecture
    const result = await dashboardInitializer.initialize();
    
    // Step 3: Initialize legacy functionality regardless of DashboardInitializer result
    const legacyResult = await initializeLegacyFunctions();
    
    if (result.success || legacyResult) {
      console.log('✅ Dashboard: Hybrid initialization completed successfully');
      
      // Make available globally for debugging
      window.dashboardResult = result;
      window.dashboardInitializer = dashboardInitializer;
      window.legacyFunctionsActive = legacyResult;
      
      // Emit comprehensive ready event
      eventBus.emit(EventDefinitions.EVENTS.SYSTEM.READY, {
        component: 'dashboard-hybrid',
        architectureInitialized: result.success,
        legacyFunctionsActive: legacyResult,
        timestamp: Date.now()
      });
      
    } else {
      console.error('❌ Dashboard: Both architecture and legacy initialization failed');
      
      // Show user-friendly error message
      eventBus.emit(EventDefinitions.EVENTS.ERROR.GLOBAL_ERROR, {
        message: 'Dashboard initialization failed. Please refresh the page.',
        severity: 'error',
        dismissible: true
      });
    }
    
  } catch (error) {
    console.error('❌ Dashboard: Critical initialization error:', error);
    
    // Try to initialize at least the legacy functions
    try {
      const emergencyResult = await initializeLegacyFunctions();
      if (emergencyResult) {
        console.log('🚑 Dashboard: Emergency fallback successful - basic functionality available');
      }
    } catch (emergencyError) {
      console.error('💥 Dashboard: Emergency fallback also failed:', emergencyError);
    }
    
    // Show critical error message
    eventBus.emit(EventDefinitions.EVENTS.ERROR.GLOBAL_ERROR, {
      message: 'Critical system error. Some features may not work properly.',
      severity: 'critical',
      dismissible: false
    });
  }
});

// ========================================
// EXPORTS AND DEBUGGING
// ========================================

// Export for testing
window.dashboardModuleFunctions = {
  getDashboardInitializer: () => dashboardInitializer,
  getInitializationStatus: () => dashboardInitializer?.getStatus(),
  getRegisteredComponents: () => dashboardInitializer?.getRegisteredComponents(),
  
  // Legacy function access
  checkVehicleVisibility,
  performFormReset,
  validateFormData,
  collectFormData,
  updateFormContext
};

console.log('✅ Dashboard.js: Hybrid module loaded successfully with both architecture and legacy functions');