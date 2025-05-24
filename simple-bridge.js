/**
 * Simple Bridge - Connects your working dashboard.js with new modular features
 * 
 * This bridge:
 * - Doesn't modify your existing dashboard.js
 * - Adds new capabilities on top
 * - Provides a pathway to gradual enhancement
 * - Maintains backward compatibility
 */

class SimpleBridge {
  constructor() {
    this.isReady = false;
    this.elements = null;
    this.dashboard = null;
    this.eventBus = this.createEventBus();
    
    console.log('🌉 SimpleBridge: Initializing...');
  }

  // Simple event bus for communication
  createEventBus() {
    const events = {};
    
    return {
      on: (event, callback) => {
        if (!events[event]) events[event] = [];
        events[event].push(callback);
        return () => this.off(event, callback);
      },
      
      emit: (event, data) => {
        if (events[event]) {
          events[event].forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              console.error(`🌉 SimpleBridge: Error in event ${event}:`, error);
            }
          });
        }
      },
      
      off: (event, callback) => {
        if (events[event]) {
          events[event] = events[event].filter(cb => cb !== callback);
        }
      }
    };
  }

  // Wait for your dashboard to be ready
  async waitForDashboard() {
    return new Promise((resolve) => {
      const checkDashboard = () => {
        if (typeof getElementRefs === 'function') {
          console.log('🌉 SimpleBridge: Dashboard detected and ready');
          resolve();
        } else {
          console.log('🌉 SimpleBridge: Waiting for dashboard...');
          setTimeout(checkDashboard, 100);
        }
      };
      checkDashboard();
    });
  }

  // Initialize the bridge
  async init() {
    if (this.isReady) {
      console.log('🌉 SimpleBridge: Already initialized');
      return this;
    }

    try {
      // Wait for dashboard to be ready
      await this.waitForDashboard();
      
      // Get enhanced element references
      this.elements = getElementRefs();
      
      // Create dashboard interface
      this.dashboard = this.createDashboardInterface();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up form monitoring
      this.setupFormMonitoring();
      
      // Add TabNavigation monitoring
      this.setupTabNavigationMonitoring();
      
      this.isReady = true;
      console.log('✅ SimpleBridge: Initialization complete');
      
      // Emit ready event
      this.eventBus.emit('bridge:ready', {
        elements: this.elements,
        dashboard: this.dashboard
      });
      
      return this;
      
    } catch (error) {
      console.error('❌ SimpleBridge: Initialization failed:', error);
      throw error;
    }
  }

  // Create a clean interface to your dashboard
  createDashboardInterface() {
    return {
      // Form state
      getFormState: () => {
        if (!this.elements._helpers) return {};
        
        return {
          isReady: this.elements._helpers.isCoreFormReady(),
          activeTab: this.elements._helpers.getActiveTab(),
          selectedVehicle: this.elements._helpers.getSelectedVehicle(),
          selectedExperience: this.elements._helpers.getSelectedExperience(),
          bookingPreference: this.elements._helpers.getBookingPreference(),
          isExperienceMode: this.elements._helpers.isExperienceMode(),
          formData: this.elements._helpers.getFormData()
        };
      },
      
      // Element access
      getElements: () => this.elements,
      
      // Validation info
      getValidation: () => this.elements._validation,
      
      // Helper methods
      getHelpers: () => this.elements._helpers,
      
      // Check if bridge is working
      isWorking: () => this.isReady && this.elements && this.elements._helpers
    };
  }
  // Set up event listeners to monitor dashboard activity
  setupEventListeners() {
    if (!this.elements.bookingForm) return;

    // Monitor form changes
    this.elements.bookingForm.addEventListener('change', (event) => {
      const formState = this.dashboard.getFormState();
      
      this.eventBus.emit('form:changed', {
        target: event.target,
        formState: formState,
        timestamp: Date.now()
      });
    });

    // Monitor TabNavigation component events (Phase 1B Integration)
    this.setupTabNavigationMonitoring();

    // Monitor manual tab changes (fallback)
    if (this.elements.tabNavigation) {
      this.elements.tabNavigation.addEventListener('click', (event) => {
        if (event.target.closest('.tab-button')) {
          setTimeout(() => {
            const formState = this.dashboard.getFormState();
            
            this.eventBus.emit('tab:changed', {
              newTab: formState.activeTab,
              formState: formState,
              timestamp: Date.now(),
              source: 'manual'
            });
          }, 100); // Small delay to let tab switch complete
        }
      });
    }

    // Monitor form submission attempts
    if (this.elements.submitButton) {
      this.elements.submitButton.addEventListener('click', (event) => {
        const formState = this.dashboard.getFormState();
        
        this.eventBus.emit('form:submit:attempt', {
          formState: formState,
          timestamp: Date.now()
        });
      });
    }    console.log('🌉 SimpleBridge: Event listeners set up');
  }

  // Enhanced TabNavigation monitoring in SimpleBridge
  setupTabNavigationMonitoring() {
    console.log('🎯 SimpleBridge: Setting up TabNavigation monitoring...');
    
    // Listen for TabNavigation component events
    this.eventBus.on('tab-navigation:initialized', (data) => {
      console.log('✅ SimpleBridge: TabNavigation component initialized:', data);
    });
    
    this.eventBus.on('tab-navigation:tab-changed', (data) => {
      console.log('🔄 SimpleBridge: TabNavigation tab changed:', data);
    });
    
    // Listen for fallback tab changes
    this.eventBus.on('dashboard:tab-changed', (data) => {
      console.log('🔄 SimpleBridge: Dashboard tab changed:', data);
    });
    
    console.log('✅ SimpleBridge: TabNavigation monitoring set up');
  }

  // Set up form monitoring and analytics
  setupFormMonitoring() {
    let lastFormState = null;

    const monitorFormState = () => {
      const currentState = this.dashboard.getFormState();
      const stateChanged = JSON.stringify(currentState) !== JSON.stringify(lastFormState);
      
      if (stateChanged) {
        this.eventBus.emit('form:state:changed', {
          previousState: lastFormState,
          currentState: currentState,
          timestamp: Date.now()
        });
        
        lastFormState = { ...currentState };
      }
    };

    // Monitor form state every 2 seconds
    setInterval(monitorFormState, 2000);
    
    console.log('🌉 SimpleBridge: Form monitoring set up');
  }

  // Public API methods
  
  // Subscribe to bridge events
  on(event, callback) {
    return this.eventBus.on(event, callback);
  }

  // Emit bridge events
  emit(event, data) {
    this.eventBus.emit(event, data);
  }

  // Get current form state
  getFormState() {
    return this.dashboard ? this.dashboard.getFormState() : null;
  }
  // Get bridge status
  getStatus() {
    const baseStatus = {
      isReady: this.isReady,
      hasElements: !!this.elements,
      hasDashboard: !!this.dashboard,
      hasEventBus: !!this.eventBus,
      timestamp: Date.now()
    };
    
    // Add TabNavigation integration status
    const tabNavigationStatus = {
      componentAvailable: !!window.dashboardTabNavigation,
      componentInitialized: window.dashboardTabNavigation?.initialized || false,
      fallbackActive: !window.dashboardTabNavigation,
      tabCount: window.dashboardTabNavigation?.tabButtons?.length || 0
    };
    
    return {
      ...baseStatus,
      tabNavigation: tabNavigationStatus,
      integration: {
        phase: 'B1-TabNavigation',
        status: 'active',
        fallbackReady: true
      }
    };
  }

  // Enhanced form validation (adds to existing)
  validateFormEnhanced() {
    const state = this.getFormState();
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!state.isReady) {
      validation.isValid = false;
      validation.errors.push('Form is not ready - missing critical elements');
    }

    // Add more validation rules here
    if (state.activeTab === 'tab-button-oneway') {
      if (!state.formData['from-location']) {
        validation.errors.push('From location is required');
      }
      if (!state.formData['to-address']) {
        validation.errors.push('To address is required');
      }
      if (!state.selectedVehicle) {
        validation.errors.push('Vehicle selection is required');
      }
    }

    if (state.activeTab === 'tab-button-experience-plus') {
      if (!state.selectedExperience) {
        validation.errors.push('Experience selection is required');
      }
    }

    validation.isValid = validation.errors.length === 0;
    
    // Emit validation event
    this.eventBus.emit('form:validated', validation);
    
    return validation;
  }
}

// Create and export bridge instance
const bridge = new SimpleBridge();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bridge.init().then(() => {
      console.log('🌉 SimpleBridge: Auto-initialized on DOMContentLoaded');
    });
  });
} else {
  // DOM already loaded
  bridge.init().then(() => {
    console.log('🌉 SimpleBridge: Auto-initialized immediately');
  });
}

// Make bridge globally available
window.SimpleBridge = bridge;

export default bridge;