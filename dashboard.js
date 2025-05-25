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

// Variable declarations for imported functions - FIXED
let TabNavigationClass, createTabNavigationFunc;  // ✅ Changed variable names
let tabNavigationInstance = null;

// Import other dependencies
let initAutocomplete, getCurrentLocation;
let showError, clearError, clearAllErrors, emitError, emitClearError, emitGlobalError, emitClearAllErrors;
let validateForm;
let processFormData, sendFormData;

import eventBus from './src/core/EventBus.js';
import { FORM_EVENTS, createSubmissionData, createSubmissionError } from './src/core/FormEvents.js';
import { showGlobalError, clearGlobalError, emitError, emitClearError, emitGlobalError, emitClearAllErrors } from './errorHandling.js';
import { forceLocationValidation } from './formValidation.js';
import './validation-listeners.js'; // This will auto-initialize the validation listeners
import './maps.js';

// Make forceLocationValidation available globally for debug controls
window.forceLocationValidation = forceLocationValidation;

// Enhanced import function
async function importDependencies() {
  try {
    console.log("📦 Dashboard: Importing dependencies...");
    
    // 🔧 Import TabNavigation component safely with FIXED variable names
    try {
      const tabNavigationModule = await import('./tab-navigation.js');
      TabNavigationClass = tabNavigationModule.TabNavigation;  // ✅ Fixed
      createTabNavigationFunc = tabNavigationModule.createTabNavigation;  // ✅ Fixed
      console.log('✅ Dashboard: TabNavigation component imported successfully');
    } catch (error) {
      console.warn('⚠️ Dashboard: TabNavigation component not available:', error);
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

// Initialize TabNavigation with SimpleBridge integration
async function initializeTabNavigation() {
  try {
    console.log('🎯 Dashboard: Attempting to initialize TabNavigation component...');
    
    // Check if SimpleBridge is available
    if (!window.SimpleBridge?.eventBus) {
      console.warn('⚠️ Dashboard: SimpleBridge not available, using fallback');
      return initializeFallbackTabs();
    }
    
    // Check if TabNavigation component is available - FIXED variable name
    if (!createTabNavigationFunc) {
      console.warn('⚠️ Dashboard: TabNavigation component not imported, using fallback');
      return initializeFallbackTabs();
    }
    
    // Find tab container
    const tabContainer = document.getElementById('tab-navigation');
    if (!tabContainer) {
      console.warn('⚠️ Dashboard: Tab container not found, using fallback');
      return initializeFallbackTabs();
    }
    
    // Create TabNavigation instance - FIXED function name
    tabNavigationInstance = createTabNavigationFunc(tabContainer, {
      eventBus: window.SimpleBridge.eventBus,
      tabButtonSelector: '.tab-button',
      tabPanelSelector: '.tab-panel',
      onTabChange: (tab, panel) => {
        console.log('🎯 TabNavigation: Tab changed to', panel.id);
        
        // Emit event for SimpleBridge monitoring
        window.SimpleBridge.eventBus.emit('dashboard:tab-changed', {
          fromTab: 'unknown',
          toTab: panel.id,
          targetPanelId: `#${panel.id}`,
          source: 'TabNavigation',
          timestamp: Date.now()
        });
      }
    });
    
    // Initialize the component
    const initialized = tabNavigationInstance?.init();
    
    if (initialized) {
      console.log('✅ Dashboard: TabNavigation component successfully integrated');
      window.dashboardTabNavigation = tabNavigationInstance;
      return true;
    } else {
      console.warn('⚠️ Dashboard: TabNavigation initialization failed, using fallback');
      return initializeFallbackTabs();
    }
    
  } catch (error) {
    console.error('❌ Dashboard: TabNavigation integration error:', error);
    return initializeFallbackTabs();
  }
}

// Fallback tab handling - ESSENTIAL for when component fails
function initializeFallbackTabs() {
  console.log('🔄 Dashboard: Initializing fallback tab handling...');
  
  const tabButtons = document.querySelectorAll('.tab-button');
  
  if (tabButtons.length === 0) {
    console.warn('⚠️ Dashboard: No tab buttons found');
    return false;
  }
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      
      console.log('🔄 Dashboard: Using fallback tab switching for', this.textContent);
      
      // Update ARIA attributes
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.setAttribute('aria-selected', 'false');
      });
      this.setAttribute('aria-selected', 'true');
      
      // Show/hide panels
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.add('hidden');
      });
      
      const targetPanelId = this.getAttribute('data-tab-target');
      const targetPanel = document.querySelector(targetPanelId);
      if (targetPanel) {
        targetPanel.classList.remove('hidden');
        
        // Emit event for SimpleBridge monitoring
        if (window.SimpleBridge?.eventBus) {
          window.SimpleBridge.eventBus.emit('dashboard:tab-changed', {
            fromTab: 'unknown',
            toTab: targetPanelId.replace('#', ''),
            targetPanelId: targetPanelId,
            source: 'fallback',
            timestamp: Date.now()
          });
        }
      }
    });
  });
  
  console.log('✅ Dashboard: Fallback tab handling initialized');
  return true;
}

// Main initialization function
async function initializeDashboard() {
  try {
    console.log('🚀 Dashboard: Starting main initialization...');
    
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
      }
    } else {
      console.warn('⚠️ Dashboard: SimpleBridge not available');
    }
    
    // Initialize tab navigation (with component integration or fallback)
    const tabSuccess = await initializeTabNavigation();
    
    console.log('✅ Dashboard: Full initialization complete');
    
    // Emit ready event for monitoring
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
      simpleBridge: simpleBridgeReady
    };
    
  } catch (error) {
    console.error('❌ Dashboard: Main initialization failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Update your location validation functions to use EventBus
function handlePlaceSelection(autocomplete, fieldId) {
  const place = autocomplete.getPlace();
  
  if (!place.place_id) {
    eventBus.emit('location:selected', {
      fieldId,
      place,
      isValid: false
    });
    return false;
  }
  
  if (!place.geometry) {
    emitError(fieldId, 'Selected location details are incomplete. Please try another location.', 'error', 'google-maps');
    return false;
  }
  
  // Location is valid
  eventBus.emit('location:selected', {
    fieldId,
    place,
    isValid: true
  });
  
  return true;
}

// Update your vehicle selection handlers
function handleVehicleSelection(vehicleType, tabType) {
  console.log(`Vehicle selected: ${vehicleType} for ${tabType}`);
  
  // Emit vehicle selection event
  eventBus.emit('vehicle:selected', {
    vehicleType,
    tabType
  });
  
  // Also emit field change for real-time validation
  eventBus.emit('form:field:changed', {
    fieldId: `vehicle_type_${tabType}`,
    value: vehicleType,
    rules: ['vehicleSelected'],
    params: { vehicleSelected: [`vehicle_type_${tabType}`] }
  });
}

// Update your form submission handler
async function handleFormSubmission(event) {
  event.preventDefault();
  
  console.log('🚀 Form submission started');
  
  // Get form elements
  const elements = {
    bookingForm: document.getElementById('booking-form'),
    tabNavigationContainer: document.getElementById('tab-navigation'),
    serviceDropdown: document.getElementById('experience-dropdown'),
    submitButton: document.getElementById('submit-button'),
    confirmationMessage: document.getElementById('confirmation-message')
  };
  
  // Process form data using the new module
  const formData = processFormData(elements);
  
  if (!formData) {
    console.log('❌ Form validation failed');
    return;
  }
  
  // Send form data using the new module
  const config = {
    FORM_ENDPOINT: 'YOUR_FORMSPREE_ENDPOINT' // Replace with your actual endpoint
  };
  
  sendFormData(formData, elements, config);
}

// Update your vehicle visibility functions
function checkVehicleVisibility() {
  const fromLocation = document.getElementById('from-location');
  const toAddress = document.getElementById('to-address');
  const vehicleContainer = document.getElementById('vehicle-selection-oneway');
  
  if (!vehicleContainer) return;
  
  const fromValid = fromLocation && fromLocation.value.trim() !== '';
  const toValid = toAddress && toAddress.value.trim() !== '';
  const bookingTimeSelected = document.querySelector('.booking-time-button.selected');
  
  const shouldShow = fromValid && toValid && bookingTimeSelected;
  
  if (shouldShow && vehicleContainer.classList.contains('hidden')) {
    // Show vehicle container
    vehicleContainer.classList.remove('hidden');
    setTimeout(() => {
      vehicleContainer.classList.add('show');
    }, 50);
    console.log('✅ Vehicle container shown');
  } else if (!shouldShow && !vehicleContainer.classList.contains('hidden')) {
    // Hide vehicle container
    vehicleContainer.classList.remove('show');
    vehicleContainer.classList.add('hiding');
    setTimeout(() => {
      vehicleContainer.classList.add('hidden');
      vehicleContainer.classList.remove('hiding');
    }, 400);
    console.log('❌ Vehicle container hidden');
  }
}

// Add real-time validation to input fields
function setupRealtimeValidation() {
  // Location fields
  const locationFields = ['from-location', 'to-address', 'from-location-exp'];
  locationFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', (e) => {
        eventBus.emit('form:field:changed', {
          fieldId,
          value: e.target.value,
          rules: ['required', 'locationSelected'],
          params: { locationSelected: [fieldId] }
        });
      });
    }
  });
  
  // Experience dropdown
  const experienceDropdown = document.getElementById('experience-dropdown');
  if (experienceDropdown) {
    experienceDropdown.addEventListener('change', (e) => {
      eventBus.emit('form:field:changed', {
        fieldId: 'experience-dropdown',
        value: e.target.value,
        rules: ['required']
      });
    });
  }
  
  // Vehicle radio buttons
  const vehicleRadios = document.querySelectorAll('input[name^="vehicle_type_"]');
  vehicleRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        const tabType = e.target.name.replace('vehicle_type_', '');
        handleVehicleSelection(e.target.value, tabType);
      }
    });
  });
}

// Add event listeners to trigger vehicle visibility checks
function setupVehicleVisibilityChecks() {
  const fromLocation = document.getElementById('from-location');
  const toAddress = document.getElementById('to-address');
  const bookingButtons = document.querySelectorAll('.booking-time-button');
  
  [fromLocation, toAddress].forEach(field => {
    if (field) {
      field.addEventListener('input', checkVehicleVisibility);
      field.addEventListener('change', checkVehicleVisibility);
    }
  });
  
  bookingButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Add selection state
      document.querySelectorAll('.booking-time-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      button.classList.add('selected');
      
      // Check vehicle visibility
      setTimeout(checkVehicleVisibility, 100);
    });
  });
}

// Initialize the validation system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard: DOM ready - initializing all features...');
  
  try {
    // 1. Initialize reset functionality
    initializeResetButton();
    
    // 2. Set up real-time validation
    setupRealtimeValidation();
    
    // 3. Set up vehicle visibility checks
    setupVehicleVisibilityChecks();
    
    // 4. Add form submission handler
    const form = document.getElementById('booking-form');
    if (form) {
      form.addEventListener('submit', handleFormSubmission);
    }
    
    // 5. Initialize dashboard components
    initializeDashboard();
    
    // Initialize maps for location fields
    if (typeof initAutocomplete !== 'undefined') {
      initAutocomplete(['from-location', 'to-address', 'from-location-exp']);
    }
    
    console.log('✅ Dashboard: All features initialized successfully');
    
  } catch (error) {
    console.error('❌ Dashboard: Initialization error:', error);
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  // DOM already loaded, initialize immediately
  initializeDashboard();
}

// Export functions for testing
window.dashboardModuleFunctions = {
  initializeTabNavigation,
  initializeFallbackTabs,
  initializeDashboard
};

// Replace the existing initializeResetButton function
function initializeResetButton() {
  console.log('🔄 Dashboard: Initializing reset functionality...');
  
  const resetButton = document.getElementById('reset-button');
  
  if (!resetButton) {
    console.warn('⚠️ Dashboard: Reset button not found');
    return;
  }

  // Remove any existing event listeners
  resetButton.replaceWith(resetButton.cloneNode(true));
  const newResetButton = document.getElementById('reset-button');
  
  newResetButton.addEventListener('click', async (e) => {
    e.preventDefault();
    console.log('🧹 Reset button clicked');
    
    try {
      // Emit reset started event using FormEvents
      eventBus.emit(FORM_EVENTS.FORM_RESET, {
        timestamp: Date.now(),
        source: 'reset-button'
      });
      
      // 1. Add reset animation to button
      newResetButton.classList.add('resetting');
      
      // 2. Clear all errors first
      if (window.eventBus) {
        emitClearAllErrors('reset-workflow');
      } else {
        // Fallback: clear errors manually
        document.querySelectorAll('[id$="-error"]').forEach(errorEl => {
          errorEl.classList.add('hidden');
          errorEl.textContent = '';
        });
      }
      
      // 3. Animate vehicle container out if visible
      const vehicleContainer = document.getElementById('vehicle-selection-oneway');
      const vehicleCards = document.querySelectorAll('.vehicle-card');
      
      if (vehicleContainer && !vehicleContainer.classList.contains('hidden')) {
        console.log('🚗 Hiding vehicle selection');
        
        // Animate vehicle cards
        vehicleCards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add('resetting');
          }, index * 50);
        });
        
        // Slide up container
        setTimeout(() => {
          vehicleContainer.classList.add('hiding');
          vehicleContainer.classList.remove('show');
        }, 200);
        
        // Hide completely after animation
        setTimeout(() => {
          vehicleContainer.classList.add('hidden');
          vehicleContainer.classList.remove('hiding');
          vehicleCards.forEach(card => {
            card.classList.remove('resetting');
          });
        }, 1200);
      }
      
      // 4. Animate form fields
      const formFields = document.querySelectorAll('input:not([type="radio"]), select, textarea');
      formFields.forEach((field, index) => {
        setTimeout(() => {
          field.classList.add('form-field-resetting');
        }, index * 30);
      });
      
      // 5. Animate booking time buttons
      const bookingButtons = document.querySelectorAll('.booking-time-button.selected');
      bookingButtons.forEach(button => {
        button.classList.add('deselecting');
        button.classList.remove('selected');
      });
      
      // 6. Reset form data after animations start
      setTimeout(() => {
        resetFormData();
      }, 300);
      
      // 7. Clean up animations and show success
      setTimeout(() => {
        // Remove reset button animation
        newResetButton.classList.remove('resetting');
        
        // Remove form field animations
        formFields.forEach(field => {
          field.classList.remove('form-field-resetting');
        });
        
        // Remove button animations
        document.querySelectorAll('.booking-time-button').forEach(button => {
          button.classList.remove('deselecting', 'selected');
        });
        
        // Reset form state
        if (window.formState) {
          window.formState.oneway = {
            fromLocation: false,
            toAddress: false,
            bookingTime: false,
            vehicleType: false
          };
          window.formState.experiencePlus = {
            fromLocation: false,
            experienceType: false,
            dateTime: false
          };
        }
        
        // Emit reset completed event
        if (window.eventBus) {
          window.eventBus.emit('form:reset:completed', {
            timestamp: Date.now(),
            source: 'reset-button'
          });
          
          // Show success message
          emitGlobalError(
            'Form has been reset successfully!',
            'success',
            'RESET001',
            true,
            'reset-workflow'
          );
        }
        
        console.log('✅ Reset workflow completed');
        
      }, 1500);
      
    } catch (error) {
      console.error('❌ Reset error:', error);
      
      // Remove button animation on error
      newResetButton.classList.remove('resetting');
      
      eventBus.emit(FORM_EVENTS.SUBMISSION_FAILED, createSubmissionError(
        'Reset failed. Please refresh the page.',
        'RESET_ERROR',
        { error: error.message },
        'reset-error'
      ));
    }
  });
  
  console.log('✅ Reset button initialized successfully');
}

// Update resetFormData function
function resetFormData() {
  console.log('🧹 Resetting form data...');
  
  try {
    const form = document.getElementById('booking-form');
    if (form) {
      // Reset standard form inputs
      form.reset();
      
      // Clear Google Places inputs specifically
      const placesInputs = [
        'from-location',
        'to-address', 
        'from-location-exp'
      ];
      
      placesInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
          element.value = '';
          if (element.place) {
            element.place = null;
          }
          // Clear any custom properties
          element.removeAttribute('data-place-selected');
        }
      });
      
      // Uncheck all radio buttons
      document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
        radio.checked = false;
        radio.setAttribute('aria-checked', 'false');
      });
      
      // Reset vehicle cards
      document.querySelectorAll('.vehicle-card').forEach(card => {
        card.classList.remove('selected');
        card.setAttribute('aria-selected', 'false');
      });
      
      // Reset dropdowns to first option
      document.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
      });
      
      // Hide conditional sections
      const sectionsToHide = [
        'scheduled-booking-inputs',
        'duration-container',
        'date-time-container-hourly',
        'date-preference-container',
        'experience-options-container',
        'hourly-description',
        'tours-description',
        'airport-description'
      ];
      
      sectionsToHide.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.classList.add('hidden');
        }
      });
      
      // Reset to first tab (One Way)
      const firstTab = document.getElementById('tab-button-oneway');
      const firstPanel = document.getElementById('panel-oneway');
      const secondTab = document.getElementById('tab-button-experience-plus');
      const secondPanel = document.getElementById('panel-experience-plus');
      
      if (firstTab && firstPanel && secondTab && secondPanel) {
        firstTab.setAttribute('aria-selected', 'true');
        firstTab.classList.add('active-tab');
        firstPanel.classList.remove('hidden');
        
        secondTab.setAttribute('aria-selected', 'false');
        secondTab.classList.remove('active-tab');
        secondPanel.classList.add('hidden');
      }
      
      // Disable submit button
      const submitButton = document.getElementById('submit-button');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute('aria-disabled', 'true');
      }
    }
    
    // Emit form data reset event
    if (window.eventBus) {
      window.eventBus.emit('form:data:reset', {
        timestamp: Date.now(),
        source: 'reset-workflow'
      });
    }
    
  } catch (error) {
    console.error('❌ Error resetting form data:', error);
  }
}

// Update the DOM ready handler to ensure proper initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard: DOM ready - initializing all features...');
  
  try {
    // 1. Initialize reset functionality FIRST
    initializeResetButton();
    
    // 2. Set up real-time validation
    setupRealtimeValidation();
    
    // 3. Set up vehicle visibility checks
    setupVehicleVisibilityChecks();
    
    // 4. Add form submission handler
    const form = document.getElementById('booking-form');
    if (form) {
      form.addEventListener('submit', handleFormSubmission);
    }
    
    // 5. Initialize dashboard components
    initializeDashboard();
    
    // Initialize maps for location fields
    if (typeof initAutocomplete !== 'undefined') {
      initAutocomplete(['from-location', 'to-address', 'from-location-exp']);
    }
    
    console.log('✅ Dashboard: All features initialized successfully');
    
  } catch (error) {
    console.error('❌ Dashboard: Initialization error:', error);
  }
});

// Add EventBus listeners for reset workflow
eventBus.on('form:reset:started', ({ timestamp, source }) => {
  console.log(`🧹 EventBus: Form reset started from ${source} at ${new Date(timestamp).toLocaleTimeString()}`);
});

eventBus.on('form:reset:completed', ({ timestamp, source }) => {
  console.log(`✅ EventBus: Form reset completed from ${source} at ${new Date(timestamp).toLocaleTimeString()}`);
  
  // Trigger form validation checks after reset
  setTimeout(() => {
    eventBus.emit('form:validate', {
      formId: 'booking-form',
      source: 'post-reset-validation'
    });
  }, 500);
});

eventBus.on('form:data:reset', ({ timestamp, source }) => {
  console.log(`🔄 EventBus: Form data reset from ${source} at ${new Date(timestamp).toLocaleTimeString()}`);
});

// Test event emissions
eventBus.emit('map:user-location:requested', { fieldId: 'from-location', timestamp: Date.now() });

// Listen to all map events for debugging
Object.values(MAP_EVENTS).forEach(eventName => {
  eventBus.on(eventName, (data) => {
    console.log(`🗺️ Map Event: ${eventName}`, data);
  });
});

console.log("✅ Dashboard.js module loaded successfully");