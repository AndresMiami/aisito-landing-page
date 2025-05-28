console.log("🚀 Dashboard.js module loading...");
console.log("🧪 Testing: Module execution at", new Date().toISOString());

// ========================================
// CORE IMPORTS (ONLY ONCE AT THE TOP)
// ========================================
import DOMManager from './core/DOMManager.js';
import EventDefinitions from './core/EventDefinitions.js';

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
});

console.log('✅ Dashboard.js: Module loaded successfully');

// Make available globally (NO DUPLICATES)
window.MiamiEvents = EventDefinitions;
window.DOMManager = DOMManager;