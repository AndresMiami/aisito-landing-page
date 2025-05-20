/**
 * Error logging utility for the I ❤️ Miami Concierge application
 * Handles logging errors, warnings, and info messages consistently
 */
export class ErrorLogger {
  constructor(options = {}) {
    this.options = {
      enableConsoleOutput: options.enableConsoleOutput !== false,
      logLevel: options.logLevel || 'error', // 'error', 'warning', 'info', 'debug'
      captureStackTrace: options.captureStackTrace !== false,
      maxLogEntries: options.maxLogEntries || 100,
      sendToServer: options.sendToServer || false,
      serverEndpoint: options.serverEndpoint || '/api/logs',
      applicationName: options.applicationName || 'I ❤️ Miami Concierge',
      version: options.version || '1.0.0',
    };
    
    // Initialize log storage
    this.logs = [];
    
    // Log levels with numeric values for comparison
    this.logLevels = {
      debug: 0,
      info: 1,
      warning: 2,
      error: 3
    };
    
    // Set current log level
    this.currentLogLevel = this.logLevels[this.options.logLevel] || this.logLevels.error;
    
    // Bind methods to ensure 'this' context
    this.logError = this.logError.bind(this);
    this.logWarning = this.logWarning.bind(this);
    this.logInfo = this.logInfo.bind(this);
    this.logDebug = this.logDebug.bind(this);
    
    // If enabled, set up global error handling
    if (options.captureGlobalErrors !== false) {
      this._setupGlobalErrorHandling();
    }
  }
  
  /**
   * Creates a log entry
   * @param {string} level - Log level
   * @param {string|Error} message - Error message or Error object
   * @param {string} source - Source of the error
   * @param {Object} data - Additional data
   * @returns {Object} Log entry
   */
  _createLogEntry(level, message, source = '', data = {}) {
    const timestamp = new Date();
    const isError = message instanceof Error;
    let stackTrace = undefined;
    
    // Extract message and stack trace from Error objects
    if (isError) {
      stackTrace = message.stack;
      message = message.message;
    } else if (this.options.captureStackTrace) {
      // Capture stack trace for non-Error objects too
      const stack = new Error().stack;
      stackTrace = stack ? stack.split('\n').slice(3).join('\n') : undefined;
    }
    
    const logEntry = {
      level,
      timestamp,
      message,
      source,
      data,
      stackTrace,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      applicationName: this.options.applicationName,
      version: this.options.version
    };
    
    // Add log to storage
    this._storeLog(logEntry);
    
    return logEntry;
  }
  
  /**
   * Stores log entry in memory and limits log size
   * @param {Object} logEntry - Log entry to store
   */
  _storeLog(logEntry) {
    this.logs.push(logEntry);
    
    // Limit number of stored logs
    if (this.logs.length > this.options.maxLogEntries) {
      this.logs.shift();
    }
    
    // If enabled, output to console
    if (this.options.enableConsoleOutput) {
      this._outputToConsole(logEntry);
    }
    
    // If enabled, send to server
    if (this.options.sendToServer) {
      this._sendToServer(logEntry);
    }
  }
  
  /**
   * Outputs log entry to console based on level
   * @param {Object} logEntry - Log entry to output
   */
  _outputToConsole(logEntry) {
    const { level, message, source, data, stackTrace } = logEntry;
    
    // Create console message
    const consoleMsg = `[${level.toUpperCase()}] ${source ? `(${source}) ` : ''}${message}`;
    
    // Output based on level
    switch (level) {
      case 'error':
        console.error(consoleMsg, data);
        if (stackTrace) console.error(stackTrace);
        break;
      case 'warning':
        console.warn(consoleMsg, data);
        break;
      case 'info':
        console.info(consoleMsg, data);
        break;
      case 'debug':
        console.debug(consoleMsg, data);
        break;
      default:
        console.log(consoleMsg, data);
    }
  }
  
  /**
   * Sends log entry to server endpoint
   * @param {Object} logEntry - Log entry to send
   */
  _sendToServer(logEntry) {
    try {
      // Clone the log entry to avoid modifications
      const entryCopy = JSON.parse(JSON.stringify(logEntry));
      
      // Use fetch to send log to server
      fetch(this.options.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entryCopy),
        // Don't block page for log sending
        keepalive: true
      }).catch(err => {
        // Only console output, avoid recursive error logging
        if (this.options.enableConsoleOutput) {
          console.error('Failed to send log to server:', err);
        }
      });
    } catch (err) {
      // Only console output, avoid recursive error logging
      if (this.options.enableConsoleOutput) {
        console.error('Error preparing log for server:', err);
      }
    }
  }
  
  /**
   * Set up global error handling
   */
  _setupGlobalErrorHandling() {
    if (typeof window !== 'undefined') {
      // Capture unhandled exceptions
      window.addEventListener('error', (event) => {
        this.logError(event.error || event.message, 'Unhandled Exception', {
          filename: event.filename,
          line: event.lineno,
          column: event.colno
        });
        
        // Don't prevent default handling
        return false;
      });
      
      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason;
        this.logError(error, 'Unhandled Promise Rejection', {
          reason: error?.toString()
        });
        
        // Don't prevent default handling
        return false;
      });
    }
  }
  
  /**
   * Determines if a log level should be processed based on current log level
   * @param {string} level - Log level to check
   * @returns {boolean} Whether to process this log
   */
  _shouldLog(level) {
    const levelValue = this.logLevels[level] || 0;
    return levelValue >= this.currentLogLevel;
  }
  
  /**
   * Logs an error message
   * @param {string|Error} message - Error message or Error object
   * @param {string} source - Source of the error
   * @param {Object} data - Additional data
   * @returns {Object} Log entry
   */
  logError(message, source = '', data = {}) {
    if (!this._shouldLog('error')) return null;
    return this._createLogEntry('error', message, source, data);
  }
  
  /**
   * Logs a warning message
   * @param {string} message - Warning message
   * @param {string} source - Source of the warning
   * @param {Object} data - Additional data
   * @returns {Object} Log entry
   */
  logWarning(message, source = '', data = {}) {
    if (!this._shouldLog('warning')) return null;
    return this._createLogEntry('warning', message, source, data);
  }
  
  /**
   * Logs an info message
   * @param {string} message - Info message
   * @param {string} source - Source of the info
   * @param {Object} data - Additional data
   * @returns {Object} Log entry
   */
  logInfo(message, source = '', data = {}) {
    if (!this._shouldLog('info')) return null;
    return this._createLogEntry('info', message, source, data);
  }
  
  /**
   * Logs a debug message
   * @param {string} message - Debug message
   * @param {string} source - Source of the debug message
   * @param {Object} data - Additional data
   * @returns {Object} Log entry
   */
  logDebug(message, source = '', data = {}) {
    if (!this._shouldLog('debug')) return null;
    return this._createLogEntry('debug', message, source, data);
  }
  
  /**
   * Gets all stored logs
   * @returns {Array} Array of log entries
   */
  getLogs() {
    return [...this.logs];
  }
  
  /**
   * Clears all stored logs
   */
  clearLogs() {
    this.logs = [];
    return this;
  }
  
  /**
   * Updates logger configuration
   * @param {Object} options - New configuration options
   * @returns {ErrorLogger} This instance for chaining
   */
  updateConfig(options = {}) {
    this.options = { ...this.options, ...options };
    this.currentLogLevel = this.logLevels[this.options.logLevel] || this.logLevels.error;
    return this;
  }
}

// Create singleton instance
export const logger = new ErrorLogger({
  enableConsoleOutput: true,
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  captureStackTrace: true,
  captureGlobalErrors: true,
  applicationName: 'I ❤️ Miami Concierge'
});