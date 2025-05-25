# Miami Concierge Event System Guide

## Quick Reference

### Keyboard Shortcuts (Development Only)
- **Ctrl+Shift+E** - Toggle Event Monitor
- **Ctrl+Shift+D** - Toggle Debug Panel  
- **Ctrl+Shift+C** - Clear Event History

### Console Commands
```javascript
// Event Monitor Controls
window.eventMonitor.show()     // Show monitor
window.eventMonitor.hide()     // Hide monitor
window.eventMonitor.toggle()   // Toggle expanded/collapsed
window.eventMonitor.clear()    // Clear event history

// Manual Event Testing
window.eventBus.emit('error:show', {
  fieldId: 'test-field',
  message: 'Test error message',
  severity: 'error'
});

window.eventBus.emit('form:submission:started', {
  data: { test: true },
  timestamp: Date.now()
});
```

## Event Categories

### 🚨 Error Events (`error:*`)
- `error:show` - Display field-specific error
- `error:clear` - Clear specific field error
- `error:global` - Show global application error
- `error:clear:all` - Clear all errors

### 📝 Form Events (`form:*`)
- `form:submission:started` - Form submission began
- `form:data:processed` - Form data validation complete
- `form:submission:succeeded` - Successful submission
- `form:submission:failed` - Failed submission
- `form:loading:started` - Loading state began
- `form:loading:ended` - Loading state ended
- `form:reset` - Form was reset

### 🗺️ Map Events (`map:*`)
- `map:location:selected` - User selected a location
- `map:geocoding:success` - Address geocoding successful
- `map:geocoding:error` - Address geocoding failed
- `map:user:location:success` - Got user's current location
- `map:user:location:error` - Failed to get user location

### 📊 Analytics Events (`analytics:*`)
- `analytics:track` - Track user interaction
- `analytics:page:view` - Page view event
- `analytics:conversion` - Conversion event

### ⚙️ System Events (`system:*`)
- `system:initialization:complete` - App initialization done
- `system:monitor:initialized` - Event monitor ready
- `system:error:critical` - Critical system error

## Event Payload Structures

### Error Event Payload
```javascript
{
  fieldId: 'field-name',          // Required: Field identifier
  message: 'Error message',       // Required: Human-readable message
  severity: 'error|warning|info', // Required: Error severity
  source: 'validation|network',   // Optional: Error source
  code: 'ERROR_CODE',            // Optional: Error code
  timestamp: Date.now()          // Optional: Timestamp
}
```

### Form Event Payload
```javascript
{
  data: { /* form data */ },     // Form data object
  serviceType: 'One Way',        // Service type
  timestamp: Date.now(),         // Event timestamp
  source: 'user-action'         // Event source
}
```

### Map Event Payload
```javascript
{
  placeId: 'ChIJ...',           // Google Places ID
  address: 'Full address',       // Formatted address
  coordinates: {                 // Lat/lng coordinates
    lat: 25.7617,
    lng: -80.1918
  },
  fieldId: 'from-location',     // Associated form field
  source: 'places-api'         // Data source
}
```

## Component Integration Examples

### Error Handling
```javascript
import { emitError, emitClearError } from './errorHandling.js';

// Show error
emitError('field-id', 'Error message', 'error', 'validation');

// Clear error
emitClearError('field-id', 'validation');
```

### Form Submission
```javascript
import { processFormData, sendFormData } from './formSubmission.js';

// Process and submit form
const formData = processFormData(elements);
if (formData) {
  sendFormData(formData, elements, config);
}
```

### Map Integration
```javascript
// Listen for location selection
eventBus.on('map:location:selected', (data) => {
  console.log('Location selected:', data.address);
  // Update form field with selected location
});
```

## Best Practices

### 1. Event Naming Convention
- Use namespace prefixes: `category:action:detail`
- Be specific and descriptive
- Use lowercase with colons as separators

### 2. Payload Structure
- Always include timestamp for debugging
- Include source information for tracing
- Use consistent field names across events

### 3. Error Handling
- Wrap event listeners in try-catch blocks
- Log errors with context information
- Provide fallback behavior for critical events

### 4. Performance
- Avoid frequent event emissions in loops
- Use debouncing for user input events
- Clean up event listeners on component destruction

## Debugging Tips

### 1. Use the Event Monitor
The event monitor provides real-time visibility into all events:
- Filter by category or search text
- Click events to see full payload
- Export event history for analysis

### 2. Console Debugging
```javascript
// Enable verbose logging
window.eventBus._debug = true;

// Monitor specific events
window.eventBus.on('form:*', console.log);

// Check event history
console.log(window.eventMonitor.getHistory());
```

### 3. Debug Panel
Use the debug panel buttons to:
- Force validation states
- Emit test events
- Inspect form state
- Control event monitor

### 4. Network Tab
Monitor FormSpree submissions in browser DevTools Network tab to debug form submission issues.

## Production Deployment

Before deploying to production:

1. **Remove Debug Code**
   - Comment out debug panels
   - Disable event monitor initialization
   - Remove console.log statements

2. **Optimize Event Handling**
   - Minimize event payload sizes
   - Remove development-only events
   - Ensure proper error handling

3. **Security Considerations**
   - Don't expose sensitive data in events
   - Validate event payloads
   - Implement rate limiting for event emissions

## Troubleshooting

### Common Issues

1. **Events Not Firing**
   - Check EventBus initialization
   - Verify event names match exactly
   - Ensure listeners are registered before events

2. **Memory Leaks**
   - Always clean up event listeners
   - Avoid circular references in payloads
   - Use weak references where appropriate

3. **Performance Issues**
   - Debounce high-frequency events
   - Limit event payload sizes
   - Use event delegation for DOM events

### Getting Help

1. Check the browser console for errors
2. Use the event monitor to trace event flow
3. Enable debug mode with `?debug=true` URL parameter
4. Review this documentation for proper usage patterns

## 📊 Visual Event Flow Diagrams

For a comprehensive visual understanding of how events flow through the Miami Concierge application, view the [Interactive Event Flow Diagrams](./event-flow-diagram.html).

The visual diagrams cover:

1. **📝 Form Submission Flow** - Complete form lifecycle from input to server response
2. **🗺️ Location Selection Flow** - Google Places integration and validation
3. **🚨 Error Handling Flow** - Error detection, display, and resolution
4. **✅ Validation Flow** - Real-time validation and UI feedback

Each diagram includes:
- Component interactions
- Event names and payloads
- Sequence diagrams
- Step-by-step explanations

### Quick Access
```bash
# Serve the diagrams locally
python -m http.server 8000
# Then visit: http://localhost:8000/event-flow-diagram.html
```