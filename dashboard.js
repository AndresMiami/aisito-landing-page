// dashboard.js
console.log("🚀 Dashboard.js module loading..."); // Added debug log

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
let showError, clearError, clearAllErrors;
let validateForm;
let processFormData, sendFormData;

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

console.log("✅ Dashboard.js module loaded successfully");