// Test script for the modular architecture
// This file can be run in the browser console when testing integration

function testModularArchitecture() {
  console.log('========= TESTING MODULAR ARCHITECTURE =========');
  
  // Check if the architecture is properly loaded
  if (!window.newArchitecture) {
    console.error('❌ Architecture not initialized. Make sure you are using ?test=integration in the URL');
    return false;
  }
  
  // Test EventBus
  console.log('Testing EventBus...');
  const { eventBus } = window.newArchitecture;
  if (!eventBus) {
    console.error('❌ EventBus not found');
    return false;
  }
  
  let testPassed = true;
  let testCounter = 0;
  
  // Test EventBus subscription
  try {
    const unsubscribe = eventBus.subscribe('test.pubsub', (data) => {
      console.log('✅ EventBus subscription works:', data);
      testCounter++;
    });
    
    eventBus.publish('test.pubsub', { message: 'Hello from test script!' });
    unsubscribe();
    eventBus.publish('test.pubsub', { message: 'This should not be received' });
    
    if (testCounter !== 1) {
      console.error('❌ EventBus subscription or unsubscription failed');
      testPassed = false;
    }
  } catch (error) {
    console.error('❌ EventBus test failed:', error);
    testPassed = false;
  }
  
  // Test Config
  console.log('Testing Config...');
  const { config } = window.newArchitecture;
  if (!config) {
    console.error('❌ Config not found');
    return false;
  }
  
  // Test Experience Selector Component
  console.log('Testing experience selector integration...');
  const dropdown = document.getElementById('experience-dropdown');
  if (dropdown) {
    // Try changing the experience and verify that the event is published
    eventBus.once('experience.selected', (data) => {
      console.log('✅ Experience selector integration works:', data);
      testCounter++;
    });
    
    // Programmatically change the dropdown value
    const newValue = dropdown.options[1]?.value || 'hourly_chauffeur';
    dropdown.value = newValue;
    
    // Trigger the change event
    const changeEvent = new Event('change');
    dropdown.dispatchEvent(changeEvent);
  } else {
    console.warn('⚠️ Experience dropdown not found, skipping this test');
  }
  
  // Test tab navigation integration
  console.log('Testing tab navigation integration...');
  const tabButton = document.querySelector('.tab-button');
  if (tabButton) {
    eventBus.once('tabs.change', (data) => {
      console.log('✅ Tab navigation integration works:', data);
      testCounter++;
    });
    
    // Programmatically click the tab
    tabButton.click();
  } else {
    console.warn('⚠️ Tab buttons not found, skipping this test');
  }
  
  // Test bridge initialization
  console.log('Testing bridge initialization...');
  try {
    const result = testCounter >= 2;
    if (result) {
      console.log('✅ Bridge initialization successful');
    } else {
      console.error('❌ Bridge initialization may have issues');
      testPassed = false;
    }
  } catch (error) {
    console.error('❌ Bridge test failed:', error);
    testPassed = false;
  }
  
  console.log('========= TEST RESULTS =========');
  if (testPassed) {
    console.log('✅ All tests passed! The modular architecture is working correctly.');
  } else {
    console.log('❌ Some tests failed. Check the console for details.');
  }
  
  return testPassed;
}

// Function to test components
function testComponents() {
  console.log('========= TESTING COMPONENTS =========');
  
  const { eventBus } = window.newArchitecture;
  if (!eventBus) {
    console.error('❌ EventBus not found');
    return false;
  }
  
  let testPassed = true;
  
  // Test ExperienceSelector component
  console.log('Testing ExperienceSelector component...');
  try {
    // Import the component
    import('./src/components/ExperienceSelector.js').then(module => {
      const experienceSelector = module.default;
      
      if (!experienceSelector) {
        console.error('❌ ExperienceSelector module not exported correctly');
        testPassed = false;
        return;
      }
      
      // Try to initialize it
      const instance = experienceSelector.init();
      
      if (!instance) {
        console.error('❌ ExperienceSelector initialization failed');
        testPassed = false;
        return;
      }
      
      console.log('✅ ExperienceSelector component loaded successfully');
      
      // Test the component functionality
      eventBus.publish('experience.selected', { value: 'hourly_chauffeur' });
      
      // Clean up
      setTimeout(() => {
        experienceSelector.destroy();
      }, 1000);
    }).catch(error => {
      console.error('❌ Error loading ExperienceSelector component:', error);
      testPassed = false;
    });
  } catch (error) {
    console.error('❌ ExperienceSelector test failed:', error);
    testPassed = false;
  }
  
  // Test VehicleSelectionComponent
  console.log('Testing VehicleSelectionComponent...');
  try {
    // Import the component
    import('./src/components/VehicleSelectionComponent.js').then(module => {
      const VehicleSelectionComponent = module.default || module.VehicleSelectionComponent;
      
      if (!VehicleSelectionComponent) {
        console.error('❌ VehicleSelectionComponent module not exported correctly');
        testPassed = false;
        return;
      }
      
      // Create an instance
      const vehicleComponent = new VehicleSelectionComponent();
      
      // Try to initialize it
      vehicleComponent.init();
      
      console.log('✅ VehicleSelectionComponent loaded successfully');
      
      // Test the component functionality by publishing an event it should respond to
      eventBus.publish('experience.selected', { value: 'airport_transfer' });
      
      // Clean up
      setTimeout(() => {
        vehicleComponent.destroy();
      }, 1000);
    }).catch(error => {
      console.error('❌ Error loading VehicleSelectionComponent:', error);
      testPassed = false;
    });
  } catch (error) {
    console.error('❌ VehicleSelectionComponent test failed:', error);
    testPassed = false;
  }
  
  console.log('========= COMPONENT TEST RESULTS =========');
  if (testPassed) {
    console.log('✅ All component tests passed!');
  } else {
    console.log('❌ Some component tests failed. Check the console for details.');
  }
  
  return testPassed;
}

// Execute the tests
console.log('Run testModularArchitecture() to test the core architecture');
console.log('Run testComponents() to test individual components');
