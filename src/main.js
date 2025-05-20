import { logger } from './utils/error-logger.js';
import { ErrorReporter } from './components/error-reporter/error-reporter.js';

// Initialize error handling
document.addEventListener('DOMContentLoaded', () => {
  // Create floating error reporter in development environment
  if (process.env.NODE_ENV === 'development' || location.hostname === 'localhost') {
    ErrorReporter.initializeForDebug();
  }
  
  // Log application initialization
  logger.logInfo('Application initialized', 'main.js', {
    url: window.location.href,
    timestamp: new Date().toISOString()
  });
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