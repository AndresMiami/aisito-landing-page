console.log("🚀 Dashboard.js module loading...");
console.log("🧪 Testing: Module execution at", new Date().toISOString());

// Wait for DOM and components to be ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Dashboard: Starting initialization...');
  
  // Initialize dashboard-specific functionality
  initializeVehicleSelection();
  initializeResetFunctionality();
  
  console.log('✅ Dashboard: Initialization completed');
  
  // IMPORTANT: Don't access components here - they'll be already set up by dashboard-components.js
});

// ========================================
// CORE IMPORTS (ONLY ONCE AT THE TOP)
// ========================================
import DOMManager from './core/DOMManager.js';
import EventDefinitions from './core/EventDefinitions.js';
import ComponentRegistry from './core/ComponentRegistry.js';

// ========================================
// CORE FUNCTIONALITY
// ========================================

/**
 * Vehicle Selection Management
 */
function initializeVehicleSelection() {
  console.log('🚗 Dashboard: Initializing vehicle selection...');
  
  if (!DOMManager) {
    console.warn('⚠️ DOMManager not available, using fallback');
    return initializeFallbackVehicleSelection();
  }
  
  const vehicleRadios = DOMManager.querySelectorAll('input[name^="vehicle_type_"]');
  
  vehicleRadios.forEach(radio => {
    DOMManager.addEventListener(radio, 'change', function() {
      if (this.checked) {
        const vehicleType = DOMManager.getValue(this);
        const tabType = DOMManager.getAttribute(this, 'name').replace('vehicle_type_', '');
        
        console.log(`🚗 Vehicle selected: ${vehicleType} in ${tabType} tab`);
        
        if (window.eventBus && EventDefinitions) {
          window.eventBus.emit(EventDefinitions.EVENTS?.VEHICLE?.SELECTED || 'vehicle:selected', {
            vehicleType,
            vehicleId: vehicleType,
            tabType,
            source: 'user-selection',
            timestamp: Date.now()
          });
        }
        
        checkVehicleVisibility();
      }
    });
  });
  
  console.log(`✅ Dashboard: ${vehicleRadios.length} vehicle radios initialized`);
}

/**
 * Fallback vehicle selection
 */
function initializeFallbackVehicleSelection() {
  console.log('🔄 Dashboard: Using fallback vehicle selection...');
  
  const vehicleRadios = document.querySelectorAll('input[name^="vehicle_type_"]');
  
  vehicleRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        const vehicleType = this.value;
        const tabType = this.name.replace('vehicle_type_', '');
        
        console.log(`🚗 Vehicle selected (fallback): ${vehicleType} in ${tabType} tab`);
        
        if (window.eventBus && EventDefinitions) {
          window.eventBus.emit(EventDefinitions.EVENTS?.VEHICLE?.SELECTED || 'vehicle:selected', {
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
 * Check Vehicle Visibility
 */
function checkVehicleVisibility() {
  const activeTab = document.querySelector('.tab-panel:not(.hidden)');
  if (!activeTab) return;
  
  const vehicleContainer = activeTab.querySelector('.vehicle-selection-container');
  if (!vehicleContainer) return;
  
  const activeRadio = activeTab.querySelector('input[name^="vehicle_type_"]:checked');
  
  if (activeRadio) {
    vehicleContainer.classList.add('show');
    console.log('✅ Vehicle selection visible');
  } else {
    vehicleContainer.classList.remove('show');
    console.log('⏸️ Vehicle selection hidden');
  }
}

/**
 * Reset Functionality
 */
function initializeResetFunctionality() {
  const resetButton = document.getElementById('reset-button');
  if (!resetButton) {
    console.warn('⚠️ Reset button not found');
    return;
  }
  
  resetButton.addEventListener('click', performFormReset);
  console.log('✅ Dashboard: Reset functionality initialized');
}

/**
 * Perform Form Reset
 */
function performFormReset() {
  try {
    const form = document.getElementById('booking-form');
    if (form) {
      form.reset();
    }
    
    const errorElements = document.querySelectorAll('.text-red-600:not(.hidden)');
    errorElements.forEach(element => {
      element.classList.add('hidden');
      element.textContent = '';
    });
    
    const vehicleContainers = document.querySelectorAll('.vehicle-selection-container');
    vehicleContainers.forEach(container => {
      container.classList.remove('show');
    });
    
    if (window.eventBus && EventDefinitions) {
      window.eventBus.emit(EventDefinitions.EVENTS.FORM.RESET, {
        timestamp: Date.now(),
        source: 'dashboard-reset'
      });
    }
    
    console.log('✅ Dashboard: Form reset completed');
    
  } catch (error) {
    console.error('❌ Dashboard: Error during form reset:', error);
  }
}

/**
 * Initialize Dashboard
 */
async function initializeDashboard() {
  console.log('🚀 Dashboard: Starting initialization...');
  
  try {
    initializeVehicleSelection();
    initializeResetFunctionality();
    checkVehicleVisibility();
    
    console.log('✅ Dashboard: Initialization completed');
    
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
// MAIN INITIALIZATION (ONLY ONCE)
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  const result = await initializeDashboard();
  
  if (result) {
    console.log('✅ Dashboard.js: Successfully initialized');
  } else {
    console.error('❌ Dashboard.js: Initialization failed');
  }
  
  console.log('🚀 Initializing Miami Concierge components...');
  
  try {
    // Initialize ComponentRegistry
    await ComponentRegistry.initializeAll(); // Use the correct method name
    
    console.log('✅ All components initialized successfully');
    console.log('📊 Component Registry Stats:', {
      componentsCount: ComponentRegistry.components.size,
      instancesCount: ComponentRegistry.instances.size
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

// Emergency reset function
function emergencyReset() {
  console.log('🚨 Performing emergency reset...');
  
  // Clear all intervals and timeouts
  for (let i = 1; i < 99999; i++) {
    window.clearInterval(i);
    window.clearTimeout(i);
  }
  
  // Reset component registry
  if (window.MiamiComponents && window.MiamiComponents.registry) {
    try {
      window.MiamiComponents.registry.destroyAll();
      window.MiamiComponents.registry.clear();
      console.log('✅ Component registry reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset component registry:', error);
    }
  }
  
  console.log('✅ Emergency reset completed');
  return true;
}

// Make it available globally
window.emergencyReset = emergencyReset;

// Add emergency reset functionality
window.fixMiamiConcierge = function() {
  console.log('🚨 Attempting emergency fix...');
  
  // Fix 1: Clear any broken component registry
  if (window.ComponentRegistry) {
    try {
      window.ComponentRegistry.clear();
      console.log('✅ ComponentRegistry cleared');
    } catch (e) {
      console.error('❌ Error clearing ComponentRegistry:', e);
    }
  }
  
  // Fix 2: Re-initialize essential functionality
  try {
    // Reset form state
    if (window.formState) {
      window.formState = {
        oneway: {},
        experienceplus: {}
      };
      console.log('✅ Form state reset');
    }
    
    // Enable buttons
    document.getElementById('submit-button')?.removeAttribute('disabled');
    console.log('✅ Submit button enabled');
    
    return true;
  } catch (e) {
    console.error('❌ Error in emergency fix:', e);
    return false;
  }
};

// Log the helper availability
console.log('🔧 Emergency fix function available. Run window.fixMiamiConcierge() in console if needed.');
console.log('✅ Dashboard.js: Module loaded successfully');

// Make available globally (NO DUPLICATES)
window.MiamiEvents = EventDefinitions;
window.DOMManager = DOMManager;