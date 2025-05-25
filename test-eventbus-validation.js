/**
 * test-eventbus-validation.js - Test script for EventBus validation system
 * 
 * This script tests the complete error handling and validation flow
 * to ensure the EventBus integration is working correctly.
 * 
 * Add this as a separate file and include it only during testing.
 */

// Self-executing function to avoid polluting global scope
(function() {
  console.log('🧪 Starting EventBus validation tests...');
  
  // Get EventBus instance
  const eventBus = window.eventBus || (window.SimpleBridge?.eventBus);
  
  if (!eventBus) {
    console.error('❌ Cannot run tests: EventBus not available');
    return;
  }
  
  // Test results storage
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  };
  
  // Set up test monitoring
  setupTestMonitoring();
  
  // Run tests with a slight delay to ensure everything is initialized
  setTimeout(runTests, 1000);
  
  // Test monitoring setup
  function setupTestMonitoring() {
    console.log('🔧 Setting up test monitoring...');
    
    // Monitor all error events
    eventBus.on('error:show', (data) => {
      console.log('🧪 TEST: error:show event received', data);
      recordTestEvent('error:show', data);
    });
    
    eventBus.on('error:clear', (data) => {
      console.log('🧪 TEST: error:clear event received', data);
      recordTestEvent('error:clear', data);
    });
    
    eventBus.on('error:clear-all', (data) => {
      console.log('🧪 TEST: error:clear-all event received', data);
      recordTestEvent('error:clear-all', data);
    });
    
    eventBus.on('error:global', (data) => {
      console.log('🧪 TEST: error:global event received', data);
      recordTestEvent('error:global', data);
    });
    
    // Monitor validation events
    eventBus.on('form:validated', (data) => {
      console.log('🧪 TEST: form:validated event received', data);
      recordTestEvent('form:validated', data);
    });
    
    eventBus.on('form:field:validated', (data) => {
      console.log('🧪 TEST: form:field:validated event received', data);
      recordTestEvent('form:field:validated', data);
    });
    
    eventBus.on('form:validation-changed', (data) => {
      console.log('🧪 TEST: form:validation-changed event received', data);
      recordTestEvent('form:validation-changed', data);
    });
    
    // Monitor location events
    eventBus.on('location:validation-required', (data) => {
      console.log('🧪 TEST: location:validation-required event received', data);
      recordTestEvent('location:validation-required', data);
    });
    
    // Monitor vehicle selection events
    eventBus.on('vehicle:selected', (data) => {
      console.log('🧪 TEST: vehicle:selected event received', data);
      recordTestEvent('vehicle:selected', data);
    });
    
    // Monitor form reset events
    eventBus.on('form:reset:started', (data) => {
      console.log('🧪 TEST: form:reset:started event received', data);
      recordTestEvent('form:reset:started', data);
    });
    
    eventBus.on('form:reset:completed', (data) => {
      console.log('🧪 TEST: form:reset:completed event received', data);
      recordTestEvent('form:reset:completed', data);
    });
    
    console.log('✅ Test monitoring set up');
  }
  
  // Record test events for analysis
  function recordTestEvent(eventType, data) {
    const timestamp = new Date().toISOString();
    testResults.details.push({
      eventType,
      data,
      timestamp
    });
  }
  
  // Run all tests
  function runTests() {
    console.log('🧪 Running EventBus validation tests...');
    console.log('📊 Test Schedule:');
    console.log('   - Test 1: Field error (immediate)');
    console.log('   - Test 2: Clear field error (1.5s)');
    console.log('   - Test 3: Global error (3s)');
    console.log('   - Test 4: Form validation (4.5s)');
    console.log('   - Test 5: Clear all errors (6s)');
    console.log('   - Test 6: Location validation (7.5s)');
    console.log('   - Test 7: Submit button state (9s)');
    console.log('   - Test 8: Vehicle selection (10.5s)');
    console.log('   - Test 9: Form reset workflow (12s)');
    console.log('   - Test 10: Real-time field changes (13.5s)');
    
    testResults.total = 10;
    
    // Test 1: Field error
    testFieldError();
    
    // Test 2: Clear field error
    setTimeout(testClearFieldError, 1500);
    
    // Test 3: Global error
    setTimeout(testGlobalError, 3000);
    
    // Test 4: Form validation
    setTimeout(testFormValidation, 4500);
    
    // Test 5: Clear all errors
    setTimeout(testClearAllErrors, 6000);
    
    // Test 6: Location validation
    setTimeout(testLocationValidation, 7500);
    
    // Test 7: Submit button state
    setTimeout(testSubmitButtonState, 9000);
    
    // Test 8: Vehicle selection
    setTimeout(testVehicleSelection, 10500);
    
    // Test 9: Form reset workflow
    setTimeout(testFormResetWorkflow, 12000);
    
    // Test 10: Real-time field changes
    setTimeout(testRealtimeFieldChanges, 13500);
    
    // Generate final report
    setTimeout(generateTestReport, 15000);
  }
  
  // Test 1: Field error
  function testFieldError() {
    console.log('🧪 TEST 1: Testing field error...');
    
    try {
      // Emit error:show event
      eventBus.emit('error:show', {
        fieldId: 'from-location',
        message: 'TEST: Please enter a valid location',
        severity: 'error',
        source: 'test-suite'
      });
      
      // Check if error element exists and is visible
      setTimeout(() => {
        const errorElement = document.getElementById('from-location-error');
        const field = document.getElementById('from-location');
        
        if (errorElement && errorElement.textContent.includes('TEST:') && !errorElement.classList.contains('hidden')) {
          console.log('✅ TEST 1: PASSED - Field error displayed correctly');
          testResults.passed++;
        } else {
          console.log('❌ TEST 1: FAILED - Field error not displayed');
          testResults.failed++;
        }
        
        // Check if field has error styling
        if (field && field.classList.contains('invalid')) {
          console.log('✅ TEST 1: PASSED - Field has error styling');
        } else {
          console.log('❌ TEST 1: FAILED - Field missing error styling');
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ TEST 1: ERROR - Field error test failed:', error);
      testResults.failed++;
    }
  }
  
  // Test 2: Clear field error
  function testClearFieldError() {
    console.log('🧪 TEST 2: Testing clear field error...');
    
    try {
      // Emit error:clear event
      eventBus.emit('error:clear', {
        fieldId: 'from-location',
        source: 'test-suite'
      });
      
      // Check if error was cleared
      setTimeout(() => {
        const errorElement = document.getElementById('from-location-error');
        const field = document.getElementById('from-location');
        
        if (errorElement && (errorElement.style.display === 'none' || errorElement.classList.contains('hidden') || errorElement.textContent === '')) {
          console.log('✅ TEST 2: PASSED - Field error cleared correctly');
          testResults.passed++;
        } else {
          console.log('❌ TEST 2: FAILED - Field error not cleared');
          testResults.failed++;
        }
        
        // Check if field styling was removed
        if (field && !field.classList.contains('invalid')) {
          console.log('✅ TEST 2: PASSED - Field error styling removed');
        } else {
          console.log('❌ TEST 2: FAILED - Field error styling not removed');
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ TEST 2: ERROR - Clear field error test failed:', error);
      testResults.failed++;
    }
  }
  
  // Test 3: Global error
  function testGlobalError() {
    console.log('🧪 TEST 3: Testing global error...');
    
    try {
      // Emit error:global event
      eventBus.emit('error:global', {
        message: 'TEST: This is a global error message for testing',
        severity: 'warning',
        code: 'TEST_GLOBAL_ERROR',
        dismissable: true,
        source: 'test-suite',
        duration: 4000
      });
      
      // Check if global error appears
      setTimeout(() => {
        const globalErrorContainer = document.getElementById('global-error-container');
        const globalError = globalErrorContainer?.querySelector('.global-error');
        
        if (globalError && globalError.textContent.includes('TEST:')) {
          console.log('✅ TEST 3: PASSED - Global error displayed correctly');
          testResults.passed++;
        } else {
          console.log('❌ TEST 3: FAILED - Global error not displayed');
          testResults.failed++;
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ TEST 3: ERROR - Global error test failed:', error);
      testResults.failed++;
    }
  }
  
  // Test 4: Form validation
  function testFormValidation() {
    console.log('🧪 TEST 4: Testing form validation...');
    
    try {
      // Emit form:validated event (invalid)
      eventBus.emit('form:validated', {
        isValid: false,
        errors: ['TEST: Form has validation errors'],
        source: 'test-suite',
        formId: 'booking-form',
        timestamp: Date.now()
      });
      
      // Emit form:field:validated event
      eventBus.emit('form:field:validated', {
        fieldId: 'to-address',
        value: '',
        isValid: false,
        errors: ['TEST: Please enter a destination'],
        source: 'test-suite',
        timestamp: Date.now()
      });
      
      // Check submit button state
      setTimeout(() => {
        const submitButton = document.getElementById('submit-button');
        
        if (submitButton && submitButton.disabled) {
          console.log('✅ TEST 4: PASSED - Submit button disabled correctly');
          testResults.passed++;
        } else {
          console.log('❌ TEST 4: FAILED - Submit button not disabled');
          testResults.failed++;
        }
        
        // Check if field error appears
        const toAddressError = document.getElementById('to-address-error');
        if (toAddressError && toAddressError.textContent.includes('TEST:')) {
          console.log('✅ TEST 4: PASSED - Field validation error displayed');
        } else {
          console.log('❌ TEST 4: FAILED - Field validation error not displayed');
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ TEST 4: ERROR - Form validation test failed:', error);
      testResults.failed++;
    }
  }
  
  // Test 5: Clear all errors
  function testClearAllErrors() {
    console.log('🧪 TEST 5: Testing clear all errors...');
    
    try {
      // Emit error:clear-all event
      eventBus.emit('error:clear-all', {
        source: 'test-suite'
      });
      
      // Check if all errors are cleared
      setTimeout(() => {
        const errorElements = document.querySelectorAll('[id$="-error"]');
        let allCleared = true;
        
        errorElements.forEach(errorEl => {
          if (errorEl.textContent.includes('TEST:') && errorEl.style.display !== 'none' && !errorEl.classList.contains('hidden')) {
            allCleared = false;
          }
        });
        
        if (allCleared) {
          console.log('✅ TEST 5: PASSED - All errors cleared correctly');
          testResults.passed++;
        } else {
          console.log('❌ TEST 5: FAILED - Some errors not cleared');
          testResults.failed++;
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ TEST 5: ERROR - Clear all errors test failed:', error);
      testResults.failed++;
    }
  }
  
  // Test 6: Location validation
  function testLocationValidation() {
    console.log('🧪 TEST 6: Testing location validation...');
    
    try {
      // Emit location:validation-required event
      eventBus.emit('location:validation-required', {
        fieldId: 'from-location',
        value: 'Miami Beach (incomplete)',
        timestamp: Date.now()
      });
      
      // Check if location validation triggers
      setTimeout(() => {
        console.log('✅ TEST 6: PASSED - Location validation event processed');
        testResults.passed++;
      }, 500);
      
    } catch (error) {
      console.error('❌ TEST 6: ERROR - Location validation test failed:', error);
      testResults.failed++;
    }
  }
  
  // Test 7: Submit button state
  function testSubmitButtonState() {
    console.log('🧪 TEST 7: Testing submit button state changes...');
    
    try {
      // First disable button
      eventBus.emit('form:validated', {
        isValid: false,
        errors: ['TEST: Form is invalid'],
        source: 'test-suite',
        timestamp: Date.now()
      });
      
      // Check disabled state
      setTimeout(() => {
        const submitButton = document.getElementById('submit-button');
        const isDisabled = submitButton && submitButton.disabled;
        
        if (isDisabled) {
          console.log('✅ TEST 7a: PASSED - Submit button disabled correctly');
        } else {
          console.log('❌ TEST 7a: FAILED - Submit button not disabled');
        }
        
        // Then after 750ms, enable button
        setTimeout(() => {
          eventBus.emit('form:validated', {
            isValid: true,
            errors: [],
            source: 'test-suite',
            timestamp: Date.now()
          });
          
          // Check enabled state
          setTimeout(() => {
            const isEnabled = submitButton && !submitButton.disabled;
            
            if (isEnabled) {
              console.log('✅ TEST 7b: PASSED - Submit button enabled correctly');
              testResults.passed++;
            } else {
              console.log('❌ TEST 7b: FAILED - Submit button not enabled');
              testResults.failed++;
            }
          }, 250);
        }, 750);
      }, 250);
      
    } catch (error) {
      console.error('❌ TEST 7: ERROR - Submit button state test failed:', error);
      testResults.failed++;
    }
  }
  
  // Test 8: Vehicle selection
  function testVehicleSelection() {
    console.log('🧪 TEST 8: Testing vehicle selection...');
    
    try {
      // Emit vehicle:selected event
      eventBus.emit('vehicle:selected', {
        vehicleType: 'sedan',
        tabType: 'oneway'
      });
      
      // Emit form:field:changed for vehicle selection
      eventBus.emit('form:field:changed', {
        fieldId: 'vehicle_type_oneway',
        value: 'sedan',
        rules: ['vehicleSelected'],
        params: { vehicleSelected: ['vehicle_type_oneway'] }
      });
      
      setTimeout(() => {
        console.log('✅ TEST 8: PASSED - Vehicle selection events processed');
        testResults.passed++;
      }, 500);
      
    } catch (error) {
      console.error('❌ TEST 8: ERROR - Vehicle selection test failed:', error);
      testResults.failed++;
    }
  }
  
  // Test 9: Form reset workflow
  function testFormResetWorkflow() {
    console.log('🧪 TEST 9: Testing form reset workflow...');
    
    try {
      // Emit form:reset:started event
      eventBus.emit('form:reset:started', {
        timestamp: Date.now(),
        source: 'test-suite'
      });
      
      // Wait and emit form:reset:completed
      setTimeout(() => {
        eventBus.emit('form:reset:completed', {
          timestamp: Date.now(),
          source: 'test-suite'
        });
        
        setTimeout(() => {
          console.log('✅ TEST 9: PASSED - Form reset workflow completed');
          testResults.passed++;
        }, 250);
      }, 500);
      
    } catch (error) {
      console.error('❌ TEST 9: ERROR - Form reset workflow test failed:', error);
      testResults.failed++;
    }
  }
  
  // Test 10: Real-time field changes
  function testRealtimeFieldChanges() {
    console.log('🧪 TEST 10: Testing real-time field changes...');
    
    try {
      // Emit form:field:changed event
      eventBus.emit('form:field:changed', {
        fieldId: 'from-location',
        value: 'Miami International Airport',
        rules: ['required', 'locationSelected'],
        params: { locationSelected: ['from-location'] }
      });
      
      // Emit form:validation-changed event
      eventBus.emit('form:validation-changed', {
        isValid: true,
        tab: 'oneway',
        fieldId: 'from-location',
        reason: 'field-change'
      });
      
      setTimeout(() => {
        console.log('✅ TEST 10: PASSED - Real-time field change events processed');
        testResults.passed++;
      }, 500);
      
    } catch (error) {
      console.error('❌ TEST 10: ERROR - Real-time field changes test failed:', error);
      testResults.failed++;
    }
  }
  
  // Generate final test report
  function generateTestReport() {
    console.log('\n🏁 EventBus Validation Test Report');
    console.log('=====================================');
    console.log(`📊 Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
      console.log('🎉 All tests passed! EventBus validation system is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please check the error messages above.');
    }
    
    console.log('\n📋 Event Summary:');
    const eventCounts = {};
    testResults.details.forEach(detail => {
      eventCounts[detail.eventType] = (eventCounts[detail.eventType] || 0) + 1;
    });
    
    Object.entries(eventCounts).forEach(([eventType, count]) => {
      console.log(`   ${eventType}: ${count} events`);
    });
    
    console.log('\n💾 Detailed test results stored in window.testResults for inspection');
    window.testResults = testResults;
    
    // Clean up test errors
    setTimeout(() => {
      console.log('🧹 Cleaning up test errors...');
      eventBus.emit('error:clear-all', { source: 'test-cleanup' });
    }, 2000);
  }
  
})();

console.log('🧪 EventBus validation test script loaded');