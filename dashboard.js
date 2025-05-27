// SIMPLIFIED VERSION FOR IMMEDIATE PUSH - No problematic imports

console.log("🚀 Dashboard.js module loading...");
console.log("🧪 Testing: Module execution at", new Date().toISOString());

// ========================================
// SIMPLIFIED IMPORTS (ONLY WORKING FILES)
// ========================================

// Wait for core modules to be available globally
let eventBus, DOMManager, EventDefinitions;

// Check if modules are available
function checkCoreModules() {
  eventBus = window.eventBus;
  DOMManager = window.DOMManager;
  EventDefinitions = window.EventDefinitions || window.MiamiEvents;
  
  return eventBus && DOMManager && EventDefinitions;
}

// Global dashboard initializer instance
let dashboardInitializer = null;

// ========================================
// CORE FUNCTIONALITY (WORKING VERSION)
// ========================================

/**
 * Vehicle Selection Management - WORKING
 */
function initializeVehicleSelection() {
  console.log('🚗 Dashboard: Initializing vehicle selection...');
  
  if (!DOMManager) {
    console.warn('⚠️ DOMManager not available, using fallback');
    return initializeFallbackVehicleSelection();
  }
  
  // Handle vehicle radio button changes
  const vehicleRadios = DOMManager.querySelectorAll('input[name^="vehicle_type_"]');
  
  vehicleRadios.forEach(radio => {
    DOMManager.addEventListener(radio, 'change', function() {
      if (this.checked) {
        const vehicleType = DOMManager.getValue(this);
        const tabType = DOMManager.getAttribute(this, 'name').replace('vehicle_type_', '');
        
        console.log(`🚗 Vehicle selected: ${vehicleType} in ${tabType} tab`);
        
        // Emit event if EventBus available
        if (eventBus && EventDefinitions) {
          eventBus.emit(EventDefinitions.EVENTS?.VEHICLE?.SELECTED || 'vehicle:selected', {
            vehicleType,
            vehicleId: vehicleType,
            tabType,
            source: 'user-selection',
            timestamp: Date.now()
          });
        }
        
        // Update vehicle visibility logic
        checkVehicleVisibility();
      }
    });
  });
  
  console.log(`✅ Dashboard: ${vehicleRadios.length} vehicle radios initialized`);
}

/**
 * Fallback vehicle selection without DOMManager
 */
function initializeFallbackVehicleSelection() {
  console.log('🔄 Dashboard: Initializing fallback vehicle selection...');
  
  const vehicleRadios = document.querySelectorAll('input[name^="vehicle_type_"]');
  
  vehicleRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        const vehicleType = this.value;
        const tabType = this.name.replace('vehicle_type_', '');
        
        console.log(`🚗 Vehicle selected: ${vehicleType} in ${tabType} tab`);
        
        // Emit event if EventBus available
        if (window.eventBus) {
          window.eventBus.emit('vehicle:selected', {
            vehicleType,
            vehicleId: vehicleType,
            tabType,
            source: 'fallback-selection',
            timestamp: Date.now()
          });
        }
        
        checkVehicleVisibility();
      }
    });
  });
  
  console.log(`✅ Dashboard: ${vehicleRadios.length} vehicle radios initialized (fallback)`);
}

/**
 * Vehicle Visibility Logic - WORKING
 */
function checkVehicleVisibility() {
  console.log('👁️ Dashboard: Checking vehicle visibility...');
  
  // Get current active tab
  const activeTabButton = document.querySelector('.tab-button[aria-selected="true"]');
  const currentTab = activeTabButton ? activeTabButton.id : 'oneway';
  
  // Vehicle container visibility logic
  const vehicleContainers = {
    'oneway': document.getElementById('vehicle-selection-oneway'),
    'roundtrip': document.getElementById('vehicle-selection-roundtrip'),
    'experiencePlus': document.getElementById('vehicle-selection-experience-plus')
  };
  
  // Hide all containers first
  Object.values(vehicleContainers).forEach(container => {
    if (container) {
      container.classList.add('hidden');
    }
  });
  
  // Show the appropriate container
  if (vehicleContainers[currentTab]) {
    vehicleContainers[currentTab].classList.remove('hidden');
    console.log(`✅ Dashboard: Showing vehicle container for ${currentTab}`);
    
    // Emit visibility change event
    if (window.eventBus) {
      window.eventBus.emit('ui:vehicle-container:shown', {
        currentTab,
        containerId: `vehicle-selection-${currentTab}`,
        timestamp: Date.now()
      });
    }
  }
}

/**
 * Form Reset Functionality - WORKING
 */
function initializeResetFunctionality() {
  console.log('🔄 Dashboard: Initializing reset functionality...');
  
  const resetButton = document.getElementById('reset-button');
  
  if (resetButton) {
    resetButton.addEventListener('click', (event) => {
      event.preventDefault();
      
      console.log('🔄 Dashboard: Reset button clicked');
      
      // Emit reset requested event
      if (window.eventBus) {
        window.eventBus.emit('form:reset:requested', {
          formId: 'booking-form',
          source: 'reset-button',
          component: 'dashboard',
          timestamp: Date.now()
        });
      }
      
      // Perform reset actions
      performFormReset();
    });
  }
}

/**
 * Perform Form Reset - WORKING
 */
function performFormReset() {
  console.log('🧹 Dashboard: Performing form reset...');
  
  try {
    // Clear all form fields
    const form = document.getElementById('booking-form');
    if (form) {
      form.reset();
    }
    
    // Clear location fields specifically
    const locationFields = ['from-location', 'to-address', 'from-location-exp'];
    locationFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.value = '';
      }
    });
    
    // Reset vehicle selections
    const vehicleRadios = document.querySelectorAll('input[name^="vehicle_type_"]');
    vehicleRadios.forEach(radio => {
      radio.checked = false;
    });
    
    // Reset to default tab
    const onewayTab = document.getElementById('oneway');
    if (onewayTab) {
      onewayTab.click();
    }
    
    console.log('✅ Dashboard: Form reset completed');
    
    // Emit reset completed event
    if (window.eventBus) {
      window.eventBus.emit('form:reset:completed', {
        formId: 'booking-form',
        source: 'dashboard',
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('❌ Dashboard: Reset failed:', error);
  }
}

/**
 * Initialize Dashboard - WORKING
 */
async function initializeDashboard() {
  console.log('🚀 Dashboard: Starting initialization...');
  
  try {
    // Wait for core modules (with timeout)
    let attempts = 0;
    while (!checkCoreModules() && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (attempts >= 50) {
      console.warn('⚠️ Dashboard: Core modules not available, using fallback mode');
    }
    
    // Initialize functionality
    initializeVehicleSelection();
    initializeResetFunctionality();
    
    // Set up initial vehicle visibility
    checkVehicleVisibility();
    
    console.log('✅ Dashboard: Initialization completed');
    
    // Make functions available globally
    window.dashboardModuleFunctions = {
      checkVehicleVisibility,
      performFormReset,
      initializeVehicleSelection,
      initializeResetFunctionality
    };
    
    return true;
    
  } catch (error) {
    console.error('❌ Dashboard: Initialization failed:', error);
    return false;
  }
}

// ========================================
// MAIN INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  const result = await initializeDashboard();
  
  if (result) {
    console.log('✅ Dashboard.js: Successfully initialized');
  } else {
    console.error('❌ Dashboard.js: Initialization failed');
  }
});

console.log('✅ Dashboard.js: Module loaded successfully');