/**
 * Wrapper for main.js that provides module mocking
 * This file acts as a bridge between the old and new architectures
 */

// First, create classes and objects needed for the bridge
class ModuleLoader {
  constructor() {
    this.modules = {};
  }

  register(name, module, dependencies = [], priority = 0) {
    this.modules[name] = { module, dependencies, priority, initialized: false };
    console.log(`📦 Registered module: ${name}`);
  }

  getRegisteredModules() {
    return Object.keys(this.modules);
  }

  async start(config) {
    console.log('🚀 Starting all modules...');
    // Implementation would initialize modules in dependency order
    return true;
  }
}

class ErrorReporter {
  static initializeForDebug() {
    console.log('🐛 Initializing ErrorReporter in debug mode');
  }
}

class ExperienceSelector {
  constructor() {
    console.log('🎭 ExperienceSelector created');
  }
}

class VehicleSelectionComponent {
  constructor() {
    console.log('🚗 VehicleSelectionComponent created');
  }
}

class FormValidationService {
  constructor() {
    console.log('✅ FormValidationService created');
  }
}

// Create global objects
const config = {
  app: { environment: (window.location.hostname === 'localhost') ? 'development' : 'production' }
};

const eventBus = {
  callbacks: {},
  subscribe(event, callback) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(callback);
    return () => this.unsubscribe(event, callback);
  },
  publish(event, data) {
    if (!this.callbacks[event]) return;
    this.callbacks[event].forEach(callback => callback(data));
  }
};

console.log('🔄 Main wrapper initializing with bridged modules');

// Create logger
const logger = {
  logInfo(message, source, data) {
    console.log(`📝 [${source}] ${message}`, data || '');
  },
  logError(message, source, error) {
    console.error(`❌ [${source}] ${message}`, error || '');
  }
};

// Import the bridge async
async function initBridge() {
  try {
    const bridge = await import('../phase1-bridge.js');
    if (bridge && bridge.initializeBridge) {
      const bridgeInstance = await bridge.initializeBridge();
      console.log('✅ Bridge initialized:', bridgeInstance);
      return bridgeInstance;
    }
    throw new Error('Bridge initialization function not found');
  } catch (error) {
    console.error('❌ Error initializing bridge:', error);
    return null;
  }
}

// Initialize the global aisito object
window.aisito = {
  bridge: null,
  status: () => {
    return {
      version: '0.1.0',
      initialized: !!(window.aisito.bridge && window.aisito.bridge.isInitialized),
      components: moduleLoader ? moduleLoader.getRegisteredModules() : []
    };
  },
  testError: (message) => {
    console.error('Test error from aisito:', message);
    return { status: 'error', message };
  },
  enableNewValidation: () => {
    if (window.aisito.bridge) {
      window.aisito.bridge.enableNewValidation();
      return true;
    }
    return false;
  },
  enableNewSubmission: () => {
    if (window.aisito.bridge) {
      window.aisito.bridge.enableNewSubmission();
      return true;
    }
    return false;
  },
};

// Create and configure module loader
const moduleLoader = new ModuleLoader();

// Register components with dependencies and priority
moduleLoader.register('experienceSelector', new ExperienceSelector(), [], 10);
moduleLoader.register('vehicleSelector', new VehicleSelectionComponent(), ['experienceSelector'], 20);

// Initialize the bridge and set it to the global object
(async () => {
  const bridgeInstance = await initBridge();
  window.aisito.bridge = () => bridgeInstance;
})();

// Register services
moduleLoader.register('formValidation', new FormValidationService(), [], 5);

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 Initializing modular architecture...');
    
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
    logger.logInfo('Application initialized with modular architecture', 'main-wrapper.js', {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      environment: config.app.environment
    });
  } catch (error) {
    logger.logError(`Failed to initialize application: ${error.message}`, 'main-wrapper.js', error);
    console.error('Application initialization failed:', error);
  }
});

console.log('✅ Main wrapper initialized successfully');