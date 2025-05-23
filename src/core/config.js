/**
 * Configuration module for the Miami AI Concierge application
 * Centralizes configuration settings and environment-specific overrides
 */

// Default configuration
const defaultConfig = {
  // Application settings
  app: {
    name: 'Miami AI Concierge',
    version: '1.0.0',
    environment: 'development'
  },
  
  // Feature flags
  features: {
    enableDebounce: true,
    enableAnalytics: false,
    showDebugInfo: true
  },
  
  // API endpoints
  api: {
    baseUrl: '/api',
    timeout: 30000, // 30 seconds
    formEndpoint: process.env.FORM_ENDPOINT || "https://formspree.io/your-endpoint",
    googleMapsKey: process.env.GOOGLE_MAPS_API_KEY
  },
  
  // Component-specific settings
  components: {
    experienceSelector: {
      autoFocus: true,
      animationSpeed: 300
    },
    vehicleSelector: {
      showPrices: true,
      showImages: true,
      enableFilters: true
    }
  },
  
  // UI Configuration
  ui: {
    maxNotesLength: 500,
    debounceDelay: 300,
    animationDuration: 200,
    placeholders: {
      oneWay: "Optional: Add flight number, luggage details, or specific instructions...",
      hourly: "Optional: Describe your ideal route, planned stops, music/AC preferences...",
      experience: "Optional: Any special interests or requests for this experience?",
      defaultExp: "Optional notes or preferences..."
    }
  },
  
  // Validation Configuration
  validation: {
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phonePattern: /^\+?[\d\s()-]{10,20}$/,
    minInputLength: 3
  },
  
  // Maps Configuration
  maps: {
    miamiArea: {
      north: 26.2,
      south: 25.6,
      east: -80.0,
      west: -80.5
    }
  },
  
  // Module Configuration
  modules: {
    loadTimeout: 10000, // 10 seconds
    retryAttempts: 3
  },
  
  // EventBus settings
  eventBus: {
    debugEvents: true,
    logEvents: ['experience.selected', 'form.submit'],
    defaultDebounceMs: 300
  }
};

// Environment-specific configuration overrides
const environmentOverrides = {
  development: {
    features: {
      showDebugInfo: true
    },
    development: {
      debug: true,
      logEvents: true,
      enableTestMode: window.location.search.includes('test=')
    }
  },
  
  production: {
    features: {
      enableDebounce: true,
      enableAnalytics: true,
      showDebugInfo: false
    },
    eventBus: {
      debugEvents: false
    },
    development: {
      debug: false,
      logEvents: false,
      enableTestMode: false
    }
  }
};

// Detect current environment
function detectEnvironment() {
  if (typeof window === 'undefined') return 'development';
  
  const hostname = window.location.hostname;
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'development';
  } else if (hostname.includes('staging') || hostname.includes('preview')) {
    return 'staging';
  } else {
    return 'production';
  }
}

// Merge configuration with environment overrides
function createConfig() {
  const environment = detectEnvironment();
  const envConfig = environmentOverrides[environment] || {};
  
  // Deep merge of default config with environment overrides
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
  
  const mergedConfig = deepMerge(JSON.parse(JSON.stringify(defaultConfig)), envConfig);
  
  // Always ensure the environment is correctly set
  mergedConfig.app.environment = environment;
  
  return Object.freeze(mergedConfig);
}

// Export the frozen configuration object
export const config = createConfig();

// Export default for convenience
export default config;
