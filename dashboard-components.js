/**
 * Dashboard Components Registration
 * 
 * This file registers all dashboard components with the ComponentRegistry
 */

import ComponentRegistry, { BaseComponent } from './core/ComponentRegistry.js';
import DOMManager from './core/DOMManager.js';

/**
 * Booking Form Component
 */
class BookingFormComponent extends BaseComponent {
  async onInitialize() {
    console.log('🎯 Initializing BookingForm component');
    
    this.form = DOMManager.getElementById('booking-form');
    this.submitButton = DOMManager.getElementById('submit-button');
    
    if (!this.form) {
      throw new Error('Booking form not found');
    }
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Set up form submission
    DOMManager.addEventListener(this.form, 'submit', this.handleSubmit.bind(this));
    
    // Listen for validation events
    this.eventBus.on('form:field:changed', this.handleFieldChange.bind(this));
  }
  
  handleSubmit(event) {
    event.preventDefault();
    
    this.eventBus.emit('form:submission:started', {
      formId: 'booking-form',
      timestamp: Date.now()
    });
  }
  
  handleFieldChange(data) {
    console.log('📝 Field changed in BookingForm:', data);
    // Update form state
  }
  
  async onDestroy() {
    // Clean up event listeners
    DOMManager.removeEventListener(this.form, 'submit');
    this.eventBus.off('form:field:changed', this.handleFieldChange);
  }
}

/**
 * Tab Navigation Component
 */
class TabNavigationComponent extends BaseComponent {
  async onInitialize() {
    console.log('🔄 Initializing TabNavigation component');
    
    this.tabButtons = DOMManager.getElements('[data-tab-target]');
    this.tabPanels = DOMManager.getElements('.tab-panel');
    
    this.setupTabSwitching();
  }
  
  setupTabSwitching() {
    this.tabButtons.forEach(button => {
      DOMManager.addEventListener(button, 'click', (event) => {
        this.switchTab(event.currentTarget);
      });
    });
  }
  
  switchTab(button) {
    const targetPanel = button.getAttribute('data-tab-target');
    
    // Hide all panels
    this.tabPanels.forEach(panel => {
      DOMManager.addClass(panel, 'hidden');
    });
    
    // Show target panel
    const panel = DOMManager.getElement(targetPanel);
    if (panel) {
      DOMManager.removeClass(panel, 'hidden');
    }
    
    // Emit tab changed event
    this.eventBus.emit('tab:changed', {
      targetPanel,
      timestamp: Date.now()
    });
  }
}

/**
 * Error Handler Component
 */
class ErrorHandlerComponent extends BaseComponent {
  async onInitialize() {
    console.log('🚨 Initializing ErrorHandler component');
    
    // Get error handling module
    const errorHandling = this.getDependency('error-handling');
    
    this.setupErrorListeners();
  }
  
  setupErrorListeners() {
    this.eventBus.on('error:show', this.handleShowError.bind(this));
    this.eventBus.on('error:clear', this.handleClearError.bind(this));
  }
  
  handleShowError(data) {
    console.log('🚨 Handling error display:', data);
    // Use error handling logic
  }
  
  handleClearError(data) {
    console.log('✨ Handling error clear:', data);
    // Use error clearing logic
  }
}

// Register all components
ComponentRegistry.registerMany({
  'booking-form': {
    ComponentClass: BookingFormComponent,
    dependencies: ['error-handler'],
    config: {
      validateOnChange: true,
      submitEndpoint: '/api/bookings'
    }
  },
  'tab-navigation': {
    ComponentClass: TabNavigationComponent,
    dependencies: [],
    config: {
      defaultTab: 'oneway'
    }
  },
  'error-handler': {
    ComponentClass: ErrorHandlerComponent,
    dependencies: [],
    config: {
      globalErrorContainer: 'global-error-container'
    }
  }
});

// Initialize all components when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing Miami Concierge components...');
  
  try {
    await ComponentRegistry.initialize();
    console.log('✅ All components initialized successfully');
    
    // Log registry stats
    console.log('📊 Component Registry Stats:', ComponentRegistry.getStats());
    
  } catch (error) {
    console.error('❌ Error initializing components:', error);
  }
});

export { BookingFormComponent, TabNavigationComponent, ErrorHandlerComponent };