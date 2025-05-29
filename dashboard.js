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
  console.log('🔧 Dashboard: Initializing reset functionality...');
  
  const resetButton = document.getElementById('reset-button');
  if (!resetButton) {
    console.warn('⚠️ Dashboard: Reset button not found');
    return;
  }
  
  // Remove existing event listeners by cloning the button
  const newResetButton = resetButton.cloneNode(true);
  resetButton.parentNode.replaceChild(newResetButton, resetButton);
  
  // Add proper event listener that calls performFormReset()
  newResetButton.addEventListener('click', function(event) {
    event.preventDefault();
    console.log('🔘 Dashboard reset button clicked - calling performFormReset');
    performFormReset();
  });
  
  // Set flag to indicate dashboard reset is initialized
  window.dashboardResetInitialized = true;
  
  console.log('✅ Dashboard: Reset functionality initialized with enhanced logic');
}

/**
 * Perform Form Reset with special handling for Google Places Autocomplete components
 */
function performFormReset() {
  try {
    console.log('🔄 Dashboard: Performing form reset...');
    
    // Basic form reset 
    const form = document.getElementById('booking-form');
    if (form) {
      form.reset();
      console.log('📝 HTML form reset completed');
    }
    
    console.log('🗃️ Resetting form state...');
    
    // Reset window.formState
    if (window.formState) {
      window.formState = {
        oneway: {
          fromLocation: false,
          toAddress: false,
          bookingTime: false,
          vehicleType: false
        },
        experienceplus: {
          fromLocation: false,
          experienceType: false,
          dateTime: false
        }
      };
      console.log('✅ Window form state reset:', window.formState);
    }
    
    // Reset address change tracker
    if (window.addressChangeTracker) {
      window.addressChangeTracker.reset();
      console.log('✅ Address change tracker reset');
    }
    
    // Reset local formState
    if (typeof formState !== 'undefined') {
      formState.oneway = {
        fromLocation: false,
        toAddress: false,
        bookingTime: false,
        vehicleType: false
      };
      formState.experienceplus = {
        fromLocation: false,
        experienceType: false,
        dateTime: false
      };
      console.log('✅ Local form state reset');
    }
    
    // Clear error messages
    const errorElements = DOMManager ? 
      DOMManager.querySelectorAll('.text-red-600:not(.hidden)') :
      document.querySelectorAll('.text-red-600:not(.hidden)');
    
    errorElements.forEach(element => {
      if (DOMManager) {
        DOMManager.addClass(element, 'hidden');
      } else {
        element.classList.add('hidden');
      }
    });
    console.log('🧹 Error messages cleared');
    
    // Multi-strategy approach to reset Google Places autocomplete fields
    const addressContainers = [
      'from-location',      // One Way tab starting point
      'to-address',         // One Way tab destination
      'from-location-exp'   // Experience+ tab location field
    ];
    
    console.log('🗺️ Resetting Google Places fields...');
    addressContainers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        // Reset Google Places element
        if (container.tagName === 'INPUT') {
          container.value = '';
        }
        
        const googlePlacesElement = container.querySelector('gmp-place-autocomplete');
        if (googlePlacesElement) {
          googlePlacesElement.value = '';
          if (googlePlacesElement.place) {
            googlePlacesElement.place = null;
          }
        }
        console.log(`🔄 Reset Google Places field: ${id}`);
      }
    });

    console.log('🚗 Resetting vehicle selections...');
    // Unselecting all vehicle cards
    const vehicleCards = document.querySelectorAll('.vehicle-card');
    vehicleCards.forEach(card => {
      card.classList.remove('selected');
      
      // Also remove any data-selected attribute if you're using it
      if (card.hasAttribute('data-selected')) {
        card.removeAttribute('data-selected');
      }

      // If there are radio inputs inside, uncheck them
      const radioInput = card.querySelector('input[type="radio"]');
      if (radioInput) {
        radioInput.checked = false;
        console.log(`🔧 Unchecked vehicle: ${radioInput.value || radioInput.name}`);
        
        // Emitting events for vehicle deselection
        if (radioInput && window.eventBus) {
          const changeEvent = new Event('change', { bubbles: true });
          radioInput.dispatchEvent(changeEvent);
          
          window.eventBus.emit('vehicle:deselected', {
            vehicleType: null,
            tabType: radioInput.name.replace('vehicle_type_', ''),
            source: 'reset-button',
            timestamp: Date.now()
          });
        }
      }
    });
    
    console.log('🔴 Force disabling submit buttons...');
    // IMPORTANT: Force disable the continue button
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-disabled', 'true');
      submitButton.removeAttribute('title');
      
      // Remove enabled class and add disabled styling
      if (DOMManager) {
        DOMManager.removeClass(submitButton, 'enabled');
        DOMManager.addClass(submitButton, 'opacity-50');
        DOMManager.addClass(submitButton, 'cursor-not-allowed');
      } else {
        submitButton.classList.remove('enabled');
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      }
      
      // Reset button text to default
      const buttonText = submitButton.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = 'Continue';
      }
      
      console.log('🔧 Disabled button: submit-button');
    }
    
    // Reset booking preference buttons
    const requestNowButton = document.getElementById('request-now-button');
    const bookLaterButton = document.getElementById('book-later-button');
    
    if (requestNowButton) {
      requestNowButton.classList.remove('active', 'selected');
      console.log('🔄 Reset request-now button');
    }
    
    if (bookLaterButton) {
      bookLaterButton.classList.remove('active', 'selected');
      console.log('🔄 Reset book-later button');
    }
    
    // Hide scheduled booking inputs
    const scheduledInputs = document.getElementById('scheduled-booking-inputs');
    if (scheduledInputs) {
      scheduledInputs.classList.add('hidden');
    }
    
    // Reset booking preference value
    const bookingPreference = document.getElementById('booking-preference');
    if (bookingPreference) {
      bookingPreference.value = '';
    }
    
    // Reset Experience+ dropdown
    const experienceDropdown = document.getElementById('experience-dropdown');
    if (experienceDropdown) {
      experienceDropdown.value = '';
      experienceDropdown.selectedIndex = 0;
      console.log('🎯 Reset experience dropdown');
    }
    
    // Reset date preference radio buttons
    const datePreferenceRadios = document.querySelectorAll('input[name="date_preference"]');
    datePreferenceRadios.forEach(radio => {
      radio.checked = false;
    });
    console.log('📅 Reset date preference radios');
    
    // Hide vehicle selection
    const vehicleSelection = document.getElementById('vehicle-selection-oneway');
    if (vehicleSelection) {
      vehicleSelection.classList.add('hidden');
      vehicleSelection.classList.remove('show');
    }
    
    // Hide experience containers
    const experienceContainers = [
      'hourly-description',
      'duration-container', 
      'date-time-container-hourly',
      'date-preference-container',
      'common-experience-fields',
      'experience-options-container',
      'water-sky-options',
      'wynwood-night-options',
      'miami-relocation-options'
    ];
    
    experienceContainers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.classList.add('hidden');
      }
    });
    console.log('📦 Hidden experience containers');
    
    // Emit form reset event through EventBus
    if (window.eventBus) {
      window.eventBus.emit('form:reset', {
        source: 'reset-button',
        timestamp: Date.now()
      });
    }
    
    // Trigger post-reset validation with setTimeout
    setTimeout(() => {
      if (typeof checkFormValidity === 'function') {
        console.log('🔍 Triggering post-reset validation...');
        checkFormValidity();
      }
    }, 100);
    
    console.log('✅ Dashboard: Form reset completed successfully');
    
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
  console.log('🚀 Dashboard: Starting initialization...');
  
  // Set flag early to prevent fallback reset
  window.dashboardResetInitialized = true;
  
  // Initialize dashboard-specific functionality
  initializeVehicleSelection();
  initializeResetFunctionality();  // Initialize reset after vehicle selection
  
  console.log('✅ Dashboard: Initialization completed');
  
  // Add debug functionality if debug parameter is present in URL
  if (window.location.search.includes('debug=true')) {
    // Enhanced ComponentRegistry logging
    if (typeof ComponentRegistry !== 'undefined') {
      const originalRegister = ComponentRegistry.register;
      ComponentRegistry.register = function(id, ComponentClass, deps, config) {
        console.log(`%c🔗 REGISTERED: ${id}`, 'color: #4ecdc4; font-weight: bold;');
        console.log(`📁 File: /components/${id}.js`);
        return originalRegister.call(this, id, ComponentClass, deps, config);
      };
    }
    
    // Add element finder
    window.findController = (elementId) => {
      const patterns = {
        'submit': 'FormSubmissionComponent',
        'tab': 'TabNavigationComponent',
        'location': 'LocationComponent',
        'vehicle': 'VehicleSelectionComponent'
      };
      
      const component = Object.keys(patterns)
        .find(key => elementId.includes(key)) || 'Unknown';
      
      console.log(`🎯 ${elementId} → ${patterns[component] || 'Check your components'}`);
      
      // Highlight element
      const el = document.getElementById(elementId);
      if (el) {
        el.style.outline = '3px solid #ff6b6b';
        setTimeout(() => el.style.outline = '', 2000);
      }
    };
    
    // Initialize element inspector functionality
    initializeElementInspector();
    
    console.log('%c🐞 Debug mode activated!', 'color: #ff6b6b; font-weight: bold; font-size: 14px;');
    console.log('Use window.findController("element-id") to locate component controllers');
  }

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

/**
 * Element Inspector Functionality
 * Allows clicking on elements to get their IDs and controller information
 */
function initializeElementInspector() {
  console.log('🔍 Initializing Element Inspector...');
  
  const inspectorToggle = document.getElementById('inspector-toggle');
  if (!inspectorToggle) {
    console.warn('⚠️ Inspector toggle button not found');
    return;
  }
  
  let isInspectorActive = false;
  let hoveredElement = null;
  let originalOutline = '';
  
  // Style for the inspector toggle button
  inspectorToggle.style.position = 'fixed';
  inspectorToggle.style.bottom = '20px';
  inspectorToggle.style.right = '20px';
  inspectorToggle.style.zIndex = '9999';
  inspectorToggle.style.background = '#3b82f6';
  inspectorToggle.style.color = 'white';
  inspectorToggle.style.border = 'none';
  inspectorToggle.style.borderRadius = '50%';
  inspectorToggle.style.width = '40px';
  inspectorToggle.style.height = '40px';
  inspectorToggle.style.fontSize = '18px';
  inspectorToggle.style.cursor = 'pointer';
  inspectorToggle.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  // Add tooltip
  inspectorToggle.title = 'Click to inspect elements';
  
  // Toggle inspector on button click
  inspectorToggle.addEventListener('click', function() {
    isInspectorActive = !isInspectorActive;
    
    if (isInspectorActive) {
      inspectorToggle.style.background = '#f44336';
      document.body.style.cursor = 'crosshair';
      console.log('🔍 Inspector activated. Click on any element to inspect.');
    } else {
      inspectorToggle.style.background = '#3b82f6';
      document.body.style.cursor = '';
      console.log('🔍 Inspector deactivated.');
    }
  });
  
  // Add inspection functionality
  document.addEventListener('mouseover', function(e) {
    if (!isInspectorActive) return;
    
    // Reset previous element
    if (hoveredElement && hoveredElement !== e.target) {
      hoveredElement.style.outline = originalOutline;
    }
    
    // Highlight current element
    hoveredElement = e.target;
    originalOutline = hoveredElement.style.outline;
    hoveredElement.style.outline = '2px solid #f44336';
    
    e.stopPropagation();
  }, true);
  
  document.addEventListener('mouseout', function(e) {
    if (!isInspectorActive || !hoveredElement) return;
    
    hoveredElement.style.outline = originalOutline;
    e.stopPropagation();
  }, true);
  
  document.addEventListener('click', function(e) {
    if (!isInspectorActive) return;
    
    // Prevent default action
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.target;
    
    // Gather element info
    const id = element.id || 'no-id';
    const classes = Array.from(element.classList).join(', ') || 'no-classes';
    const tagName = element.tagName.toLowerCase();
    const attributes = Array.from(element.attributes)
      .map(attr => `${attr.name}="${attr.value}"`)
      .join(', ');
    
    // Log element info
    console.group('🔍 Element Inspection');
    console.log('%cElement:', 'font-weight: bold;', element);
    console.log('%cID:', 'font-weight: bold;', id);
    console.log('%cClasses:', 'font-weight: bold;', classes);
    console.log('%cTag:', 'font-weight: bold;', tagName);
    console.log('%cAttributes:', 'font-weight: bold;', attributes);
    
    // Try to find the controller
    if (window.findController && id) {
      window.findController(id);
    }
    
    console.groupEnd();
    
    // Add visual indicator
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
    setTimeout(() => {
      element.style.backgroundColor = originalBg;
    }, 1000);
    
    return false;
  }, true);
  
  // Add keyboard shortcut (Alt+I)
  document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 'i') {
      e.preventDefault();
      inspectorToggle.click();
    }
  });
  
  // Make inspector available globally
  window.toggleInspector = function() {
    inspectorToggle.click();
    return isInspectorActive;
  };
  
  console.log('✅ Element Inspector initialized. Click 🔍 button or press Alt+I to activate.');
}

// Add this line to the debug section of your initialization code
if (window.location.search.includes('debug=true')) {
  // Initialize element inspector functionality
  initializeElementInspector();
  
  console.log('🔧 Element Inspector available. Use Alt+I or click the 🔍 button.');
}

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