/**
 * Production-ready logging utility
 */

const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.search.includes('debug=true');

export const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    console.warn(`⚠️ ${message}`, ...args);
  },
  
  error: (message, ...args) => {
    console.error(`❌ ${message}`, ...args);
  },
  
  success: (message, ...args) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, ...args);
    }
  }
};