import eventBus from './EventBus.js';

/**
 * Test functions for the EventBus
 * Run these in the browser console to verify EventBus functionality
 */
export function testEventBus() {
  console.log('🧪 Testing EventBus...');

  // Test basic subscription and publishing
  let value = 0;
  
  const unsubscribe = eventBus.subscribe('counter.increment', (data) => {
    value += data.amount;
    console.log(`Counter incremented by ${data.amount} to ${value}`);
  });
  
  console.log('Publishing counter.increment with amount 5');
  eventBus.publish('counter.increment', { amount: 5 });
  console.assert(value === 5, 'Value should be 5');
  
  console.log('Publishing counter.increment with amount 10');
  eventBus.publish('counter.increment', { amount: 10 });
  console.assert(value === 15, 'Value should be 15');
  
  // Test unsubscribe
  console.log('Unsubscribing from counter.increment');
  unsubscribe();
  console.log('Publishing counter.increment with amount 20 (should not update value)');
  eventBus.publish('counter.increment', { amount: 20 });
  console.assert(value === 15, 'Value should still be 15 after unsubscribe');
  
  // Test namespaced events
  let namespaceValue = 0;
  eventBus.subscribe('form.*', () => {
    namespaceValue += 1;
    console.log(`Namespace subscriber triggered, value: ${namespaceValue}`);
  });
  
  console.log('Publishing form.submit event');
  eventBus.publish('form.submit', { success: true });
  console.assert(namespaceValue === 1, 'Namespace value should be 1');
  
  console.log('Publishing form.validate event');
  eventBus.publish('form.validate', { valid: true });
  console.assert(namespaceValue === 2, 'Namespace value should be 2');
  
  // Test once
  let onceValue = 0;
  console.log('Testing once subscription');
  eventBus.once('test.once', () => {
    onceValue += 1;
    console.log('Once subscriber executed');
  });
  
  console.log('Publishing test.once first time');
  eventBus.publish('test.once');
  console.assert(onceValue === 1, 'Once value should be 1');
  
  console.log('Publishing test.once second time (should not trigger)');
  eventBus.publish('test.once');
  console.assert(onceValue === 1, 'Once value should still be 1');
  
  console.log('All EventBus tests completed! ✅');
  return 'EventBus tests successful!';
}

// Export a function to test UI-related events from the dashboard
export function testUIEvents() {
  console.log('🧪 Testing UI event integration...');
  
  // Subscribe to form-related events
  eventBus.subscribe('form.locationChange', (data) => {
    console.log('Location changed:', data);
  });
  
  eventBus.subscribe('form.experienceSelected', (data) => {
    console.log('Experience selected:', data);
  });
  
  eventBus.subscribe('form.submit', (data) => {
    console.log('Form submitted:', data);
  });
  
  console.log('Event listeners registered. Try interacting with the UI.');
  return 'UI event test setup complete. Try interacting with the form.';
}

// If running directly in the browser
if (typeof window !== 'undefined') {
  window.testEventBus = testEventBus;
  window.testUIEvents = testUIEvents;
  console.log('Run testEventBus() or testUIEvents() to test the EventBus');
}
