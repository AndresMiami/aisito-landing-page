/**
 * Main entry point for the Miami AI Concierge application
 * Initializes the modular architecture and core components
 */
import { logger } from './utils/error-logger.js';
import { ErrorReporter } from './components/error-reporter/error-reporter.js';
import { ModuleLoader } from './core/ModuleLoader.js';
import { initBridge } from './core/Bridge.js';
import config from './core/config.js';
import eventBus from './core/EventBus.js';

// Import components
import { ExperienceSelector } from './components/ExperienceSelector.js';
import { VehicleSelectionComponent } from './components/VehicleSelectionComponent.js';

// Import services
import { FormValidationService } from './services/FormValidationService.js';

// Create and configure module loader
const moduleLoader = new ModuleLoader();

// Register components with dependencies and priority
moduleLoader.register('experienceSelector', new ExperienceSelector(), [], 10);
moduleLoader.register('vehicleSelector', new VehicleSelectionComponent(), ['experienceSelector'], 20);

// Register services
moduleLoader.register('formValidation', new FormValidationService(), [], 5);

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize error handling
    if (config.app.environment === 'development' || location.hostname === 'localhost') {
      ErrorReporter.initializeForDebug();
    }
    
    // Initialize bridge between old and new code
    initBridge();
    
    // Start all modules
    await moduleLoader.start(config);
    
    // Publish application ready event
    eventBus.publish('app.initialized', { 
      timestamp: Date.now(),
      config: config
    });
    
    // Log application initialization
    logger.logInfo('Application initialized with modular architecture', 'main.js', {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      environment: config.app.environment
    });
  } catch (error) {
    logger.logError(`Failed to initialize application: ${error.message}`, 'main.js', error);
    console.error('Application initialization failed:', error);
  }
});

// Additional global error handlers for specific API errors
window.fetch = new Proxy(window.fetch, {
  apply: async function(target, thisArg, args) {
    try {
      const response = await Reflect.apply(target, thisArg, args);
      
      // Log API failures as errors
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
      }
      
      return response;
    } catch (error) {
      // Log network errors
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      logger.logError(error, 'fetch', { url });
      throw error;
    }
  }
});