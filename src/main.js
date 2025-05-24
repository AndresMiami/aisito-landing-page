/**
 * Updated main.js - Integrates your existing system with new modular architecture
 * 
 * WHY THIS APPROACH:
 * - Keeps your existing main.js structure
 * - Adds the Phase1Bridge to connect old and new systems
 * - Gradual migration without breaking changes
 */

import { logger } from './utils/error-logger.js';
import { ErrorReporter } from './components/error-reporter/error-reporter.js';
import { ModuleLoader } from './core/ModuleLoader.js';
import { initBridge } from './core/Bridge.js';
import config from './core/config.js';
import eventBus from './core/EventBus.js';

// Import your existing components
import { ExperienceSelector } from './components/ExperienceSelector.js';
import { VehicleSelectionComponent } from './components/VehicleSelectionComponent.js';
import { FormValidationService } from './services/FormValidationService.js';

// Import the NEW Phase1Bridge to connect old dashboard.js with new system
import { initializeBridge } from '../phase1-bridge.js';  // Note the ../

// Create module loader
const moduleLoader = new ModuleLoader();

// Register your existing components
moduleLoader.register('experienceSelector', new ExperienceSelector(), [], 10);
moduleLoader.register('vehicleSelector', new VehicleSelectionComponent(), ['experienceSelector'], 20);
moduleLoader.register('formValidation', new FormValidationService(), [], 5);

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 Starting Aisito application initialization...');
    
    // Initialize error handling
    if (config.app.environment === 'development' || location.hostname === 'localhost') {
      ErrorReporter.initializeForDebug();
    }
    
    // Initialize your existing bridge
    initBridge();
    
    // Start existing modules
    await moduleLoader.start(config);
    
    // 🌟 NEW: Initialize Phase1Bridge to connect dashboard.js
    console.log('🌉 Initializing Phase1Bridge...');
    const bridge = await initializeBridge();
    
    // Make bridge available for debugging
    window.aisitoBridge = bridge;
    
    // Publish application ready event
    eventBus.publish('app.initialized', { 
      timestamp: Date.now(),
      config: config,
      bridge: bridge
    });
    
    // 🌟 NEW: Log the bridge status
    console.log('🌉 Bridge Status:', bridge.getStatus());
    
    logger.logInfo('Application initialized with Phase1Bridge', 'main.js', {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      environment: config.app.environment,
      bridgeEnabled: true
    });
    
    console.log('✅ Aisito application fully initialized!');
    
  } catch (error) {
    logger.logError(`Failed to initialize application: ${error.message}`, 'main.js', error);
    console.error('❌ Application initialization failed:', error);
    
    // Try to show error to user even if initialization failed
    try {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-notification';
      errorDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        background: #fee; border: 1px solid #fcc; color: #c33;
        padding: 15px; border-radius: 5px; max-width: 300px;
      `;
      errorDiv.innerHTML = `
        <strong>Application Error</strong><br>
        The application failed to initialize. Please refresh the page.
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 18px;">&times;</button>
      `;
      document.body.appendChild(errorDiv);
    } catch (displayError) {
      console.error('Could not display error notification:', displayError);
    }
  }
});

// Enhanced global error handlers with bridge integration
window.fetch = new Proxy(window.fetch, {
  apply: async function(target, thisArg, args) {
    try {
      const response = await Reflect.apply(target, thisArg, args);
      
      if (!response.ok) {
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        
        logger.logError(
          `API Error: ${response.status} ${response.statusText}`,
          'fetch',
          {
            url,
            status: response.status,
            statusText: response.statusText,
            level: 'warning'
          }
        );
        
        // 🌟 NEW: Emit API error event for bridge to handle
        eventBus.publish('api.error', {
          url,
          status: response.status,
          statusText: response.statusText
        });
      }
      
      return response;
    } catch (error) {
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      logger.logError(error, 'fetch', { url });
      
      // 🌟 NEW: Emit network error event for bridge to handle
      eventBus.publish('network.error', {
        url,
        error: error.message
      });
      
      throw error;
    }
  }
});

// 🌟 NEW: Global debugging helpers
if (config.app.environment === 'development' || location.hostname === 'localhost') {
  window.aisito = {
    // Access to the bridge
    bridge: () => window.aisitoBridge,
    
    // Test error handling
    testError: (message = 'Test error message') => {
      eventBus.publish('error.test', { message });
    },
    
    // Check bridge status
    status: () => {
      return {
        bridge: window.aisitoBridge?.getStatus(),
        eventBus: !!eventBus,
        moduleLoader: !!moduleLoader
      };
    },
    
    // Enable new features gradually
    enableNewValidation: () => {
      window.aisitoBridge?.enableNewValidation();
    },
    
    enableNewSubmission: () => {
      window.aisitoBridge?.enableNewSubmission();
    },
    
    // Get event bus for debugging
    events: eventBus
  };
  
  console.log('🔧 Debug helpers available at window.aisito');
}