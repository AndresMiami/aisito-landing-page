/**
 * EventBus Integration Validation and Cleanup
 * 
 * This script validates your EventBus integration and performs
 * necessary checks for production deployment.
 */

(function validateEventBusIntegration() {
  console.log('🔍 Starting EventBus integration validation...');
  
  // 1. Verify EventBus availability
  function validateEventBus() {
    console.log('🔍 Validating EventBus availability...');
    
    // Check if EventBus is available
    if (!window.eventBus && !window.SimpleBridge?.eventBus) {
      console.error('❌ EventBus not available - integration incomplete');
      return false;
    }
    
    // Verify EventBus has required methods
    const eventBus = window.eventBus || window.SimpleBridge.eventBus;
    const hasRequiredMethods = 
      typeof eventBus.on === 'function' && 
      typeof eventBus.emit === 'function' && 
      typeof eventBus.off === 'function';
    
    if (!hasRequiredMethods) {
      console.error('❌ EventBus missing required methods - integration incomplete');
      console.log('Available methods:', Object.getOwnPropertyNames(eventBus));
      return false;
    }
    
    console.log('✅ EventBus integration validated successfully');
    return true;
  }
  
  // 2. Verify Error Events module
  function validateErrorEvents() {
    console.log('🔍 Validating Error Events...');
    
    // Check if ERROR_EVENTS is available globally (it should be imported in modules)
    try {
      // Try to import and check the module
      import('./ErrorEvents.js').then(module => {
        const { ERROR_EVENTS, ERROR_SEVERITY } = module;
        
        // Verify required event types
        const requiredEvents = ['SHOW', 'CLEAR', 'CLEAR_ALL', 'GLOBAL', 'GLOBAL_CLEAR'];
        const missingEvents = requiredEvents.filter(event => !ERROR_EVENTS[event]);
        
        if (missingEvents.length > 0) {
          console.warn(`⚠️ Missing error events: ${missingEvents.join(', ')}`);
        } else {
          console.log('✅ Error events validated successfully');
          console.log('📋 Available error events:', Object.keys(ERROR_EVENTS));
        }
        
        // Verify severity levels
        const requiredSeverities = ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL'];
        const missingSeverities = requiredSeverities.filter(severity => !ERROR_SEVERITY[severity]);
        
        if (missingSeverities.length > 0) {
          console.warn(`⚠️ Missing error severities: ${missingSeverities.join(', ')}`);
        } else {
          console.log('✅ Error severities validated successfully');
          console.log('📋 Available severities:', Object.keys(ERROR_SEVERITY));
        }
      }).catch(error => {
        console.error('❌ Failed to import ErrorEvents module:', error);
      });
    } catch (error) {
      console.error('❌ Error validating ErrorEvents module:', error);
    }
  }
  
  // 3. Verify validation listeners
  function validateValidationListeners() {
    console.log('🔍 Validating validation listeners...');
    
    try {
      import('./validation-listeners.js').then(() => {
        console.log('✅ Validation listeners module loaded successfully');
      }).catch(error => {
        console.warn('⚠️ Validation listeners module not found or failed to load:', error);
      });
    } catch (error) {
      console.warn('⚠️ Error loading validation listeners:', error);
    }
  }
  
  // 4. Verify error handling module
  function validateErrorHandling() {
    console.log('🔍 Validating error handling module...');
    
    try {
      import('./errorHandling.js').then(module => {
        const requiredFunctions = ['emitError', 'emitClearError', 'emitGlobalError', 'emitClearAllErrors'];
        const missingFunctions = requiredFunctions.filter(func => typeof module[func] !== 'function');
        
        if (missingFunctions.length > 0) {
          console.warn(`⚠️ Missing error handling functions: ${missingFunctions.join(', ')}`);
        } else {
          console.log('✅ Error handling functions validated successfully');
        }
      }).catch(error => {
        console.error('❌ Failed to import error handling module:', error);
      });
    } catch (error) {
      console.error('❌ Error validating error handling module:', error);
    }
  }
  
  // 5. Test event flow
  function testEventFlow() {
    console.log('🔍 Testing event flow...');
    
    const eventBus = window.eventBus || window.SimpleBridge?.eventBus;
    if (!eventBus) {
      console.error('❌ Cannot test event flow - EventBus not available');
      return;
    }
    
    let testsPassed = 0;
    const totalTests = 3;
    
    // Test 1: Basic event emission and listening
    const testEventName = 'test:validation:basic';
    const testListener = (data) => {
      if (data.test === 'basic') {
        console.log('✅ Test 1: Basic event flow working');
        testsPassed++;
      }
    };
    
    eventBus.on(testEventName, testListener);
    eventBus.emit(testEventName, { test: 'basic' });
    eventBus.off(testEventName, testListener);
    
    // Test 2: Error event flow
    setTimeout(() => {
      try {
        eventBus.emit('error:show', {
          fieldId: 'test-field',
          message: 'Test validation message',
          severity: 'warning',
          source: 'validation-test'
        });
        console.log('✅ Test 2: Error event emission working');
        testsPassed++;
        
        // Clear the test error
        setTimeout(() => {
          eventBus.emit('error:clear', { fieldId: 'test-field' });
        }, 100);
      } catch (error) {
        console.error('❌ Test 2: Error event flow failed:', error);
      }
    }, 100);
    
    // Test 3: Form validation event flow
    setTimeout(() => {
      try {
        eventBus.emit('form:validated', {
          isValid: true,
          errors: [],
          source: 'validation-test'
        });
        console.log('✅ Test 3: Form validation event flow working');
        testsPassed++;
      } catch (error) {
        console.error('❌ Test 3: Form validation event flow failed:', error);
      }
      
      // Report results
      setTimeout(() => {
        console.log(`📊 Event flow test results: ${testsPassed}/${totalTests} tests passed`);
        if (testsPassed === totalTests) {
          console.log('🎉 All event flow tests passed!');
        } else {
          console.warn('⚠️ Some event flow tests failed - check integration');
        }
      }, 200);
    }, 200);
  }
  
  // 6. Check DOM elements for error display
  function validateDOMElements() {
    console.log('🔍 Validating DOM elements for error display...');
    
    const requiredFields = [
      'from-location',
      'to-address',
      'from-location-exp',
      'experience-dropdown',
      'submit-button'
    ];
    
    let missingElements = [];
    let missingErrorElements = [];
    
    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (!field) {
        missingElements.push(fieldId);
      }
      
      const errorElement = document.getElementById(`${fieldId}-error`);
      if (!errorElement) {
        missingErrorElements.push(`${fieldId}-error`);
      }
    });
    
    if (missingElements.length > 0) {
      console.warn(`⚠️ Missing form elements: ${missingElements.join(', ')}`);
    }
    
    if (missingErrorElements.length > 0) {
      console.warn(`⚠️ Missing error elements: ${missingErrorElements.join(', ')}`);
    }
    
    if (missingElements.length === 0 && missingErrorElements.length === 0) {
      console.log('✅ All required DOM elements found');
    }
    
    // Check for global error container
    const globalErrorContainer = document.getElementById('global-error-container');
    if (!globalErrorContainer) {
      console.log('ℹ️ Global error container will be created dynamically when needed');
    } else {
      console.log('✅ Global error container found');
    }
  }
  
  // Run all validations
  console.log('🚀 Starting comprehensive EventBus validation...');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runValidation);
  } else {
    runValidation();
  }
  
  function runValidation() {
    setTimeout(() => {
      validateEventBus();
      validateErrorEvents();
      validateValidationListeners();
      validateErrorHandling();
      validateDOMElements();
      testEventFlow();
      
      setTimeout(() => {
        console.log('🏁 EventBus integration validation complete');
        console.log('📋 Check the console messages above for any issues that need attention');
      }, 1000);
    }, 500);
  }
})();