# Miami Concierge - Event System Documentation

## Overview
This application uses an event-driven architecture with EventBus for decoupled communication between components. All events follow the format: `category:action` or `category:subcategory:action`.

## Event Categories

### 🚨 Error Events
Events for handling validation errors and user feedback.

#### `error:show`
**Description:** Display an error message for a specific form field  
**Payload:**
```javascript
{
  fieldId: string,        // ID of the form field (e.g., 'from-location')
  message: string,        // Error message to display
  severity: string,       // 'info', 'success', 'warning', 'error', 'critical'
  source: string,         // Component that emitted the error (e.g., 'validation')
  timestamp: number       // Date.now() when error occurred
}
```

#### `error:clear`
**Description:** Clear error message for a specific form field  
**Payload:**
```javascript
{
  fieldId: string,        // ID of the form field to clear
  source: string,         // Component that cleared the error
  timestamp: number       // Date.now() when cleared
}
```

#### `error:clear-all`
**Description:** Clear all error messages  
**Payload:**
```javascript
{
  source: string,         // Component that cleared all errors
  timestamp: number       // Date.now() when cleared
}
```

#### `error:global`
**Description:** Show application-wide error/success message  
**Payload:**
```javascript
{
  message: string,        // Message to display
  severity: string,       // 'info', 'success', 'warning', 'error', 'critical'
  code: string,          // Optional error code (e.g., 'FORM_INVALID')
  dismissable: boolean,   // Whether user can dismiss the message
  source: string,         // Component that emitted the error
  duration: number,       // Auto-dismiss duration in ms (optional)
  timestamp: number       // Date.now() when error occurred
}
```

#### `error:global-clear`
**Description:** Clear global error message  
**Payload:**
```javascript
{
  source: string,         // Component that cleared the error
  timestamp: number       // Date.now() when cleared
}
```

---

### 📝 Form Events
Events for form validation and state management.

#### `form:validated`
**Description:** Form validation completed  
**Payload:**
```javascript
{
  isValid: boolean,       // Whether form passed validation
  errors: string[],       // Array of validation error messages
  source: string,         // Source of validation (e.g., 'submit', 'realtime')
  formId: string,         // Form identifier (e.g., 'booking-form')
  timestamp: number       // Date.now() when validation completed
}
```

#### `form:field:validated`
**Description:** Individual field validation completed  
**Payload:**
```javascript
{
  fieldId: string,        // Field that was validated
  value: any,            // Current field value
  isValid: boolean,       // Whether field passed validation
  errors: string[],       // Array of field-specific errors
  rules: string[],        // Validation rules applied
  source: string,         // Source of validation
  timestamp: number       // Date.now() when validation completed
}
```

#### `form:field:changed`
**Description:** Form field value changed  
**Payload:**
```javascript
{
  fieldId: string,        // Field that changed
  value: any,            // New field value
  oldValue: any,         // Previous field value (optional)
  rules: string[],        // Validation rules to apply
  params: object,         // Additional validation parameters
  source: string,         // Source of change (e.g., 'user-input')
  timestamp: number       // Date.now() when change occurred
}
```

#### `form:validation-changed`
**Description:** Overall form validation state changed  
**Payload:**
```javascript
{
  isValid: boolean,       // New validation state
  tab: string,           // Active tab ('oneway', 'experience-plus')
  fieldId: string,        // Field that triggered the change (optional)
  reason: string,         // Reason for change (e.g., 'field-change', 'tab-switch')
  timestamp: number       // Date.now() when state changed
}
```

#### `form:reset:started`
**Description:** Form reset operation started  
**Payload:**
```javascript
{
  source: string,         // What triggered the reset (e.g., 'reset-button')
  timestamp: number       // Date.now() when reset started
}
```

#### `form:reset:completed`
**Description:** Form reset operation completed  
**Payload:**
```javascript
{
  source: string,         // What triggered the reset
  duration: number,       // Time taken to complete reset (optional)
  timestamp: number       // Date.now() when reset completed
}
```

#### `form:submit:started`
**Description:** Form submission started  
**Payload:**
```javascript
{
  formData: object,       // Form data being submitted
  formId: string,         // Form identifier
  source: string,         // Submit trigger (e.g., 'submit-button')
  timestamp: number       // Date.now() when submission started
}
```

#### `form:submit:completed`
**Description:** Form submission completed  
**Payload:**
```javascript
{
  success: boolean,       // Whether submission was successful
  response: object,       // Server response (optional)
  formId: string,         // Form identifier
  duration: number,       // Time taken for submission
  timestamp: number       // Date.now() when submission completed
}
```

---

### 📍 Location Events
Events for Google Places autocomplete and location handling.

#### `location:selected`
**Description:** User selected a location from autocomplete  
**Payload:**
```javascript
{
  fieldId: string,        // Field where location was selected
  place: object,          // Google Places API place object
  isValid: boolean,       // Whether place has required data
  address: string,        // Formatted address
  placeId: string,        // Google Place ID
  coordinates: {          // Lat/lng coordinates
    lat: number,
    lng: number
  },
  timestamp: number       // Date.now() when location selected
}
```

#### `location:validation-required`
**Description:** Location field requires validation  
**Payload:**
```javascript
{
  fieldId: string,        // Field requiring validation
  value: string,          // Current field value
  hasPlaceData: boolean,  // Whether field has Google Places data
  timestamp: number       // Date.now() when validation required
}
```

#### `location:cleared`
**Description:** Location field was cleared  
**Payload:**
```javascript
{
  fieldId: string,        // Field that was cleared
  source: string,         // What cleared the field
  timestamp: number       // Date.now() when cleared
}
```

---

### 🚗 Vehicle Selection Events
Events for vehicle type selection.

#### `vehicle:selected`
**Description:** User selected a vehicle type  
**Payload:**
```javascript
{
  vehicleType: string,    // Selected vehicle type (e.g., 'Luxury Sedan')
  tabType: string,        // Tab where selection was made ('oneway', 'experience-plus')
  fieldId: string,        // Radio button field ID
  source: string,         // Selection source (e.g., 'user-click')
  timestamp: number       // Date.now() when selected
}
```

#### `vehicle:selection-cleared`
**Description:** Vehicle selection was cleared  
**Payload:**
```javascript
{
  tabType: string,        // Tab where selection was cleared
  source: string,         // What cleared the selection
  timestamp: number       // Date.now() when cleared
}
```

---

### 📑 Tab Navigation Events
Events for tab switching functionality.

#### `tab:changed`
**Description:** User switched between tabs  
**Payload:**
```javascript
{
  fromTab: string,        // Previous tab ID
  toTab: string,          // New tab ID
  source: string,         // What triggered the change (e.g., 'user-click')
  timestamp: number       // Date.now() when tab changed
}
```

#### `tab:content:shown`
**Description:** Tab content became visible  
**Payload:**
```javascript
{
  tabId: string,          // Tab that became visible
  panelId: string,        // Panel that became visible
  timestamp: number       // Date.now() when shown
}
```

#### `tab:content:hidden`
**Description:** Tab content became hidden  
**Payload:**
```javascript
{
  tabId: string,          // Tab that became hidden
  panelId: string,        // Panel that became hidden
  timestamp: number       // Date.now() when hidden
}
```

---

### ⏰ Date/Time Events
Events for date and time picker interactions.

#### `datetime:selected`
**Description:** User selected a date/time  
**Payload:**
```javascript
{
  fieldId: string,        // Field where date/time was selected
  value: string,          // Selected date/time value
  type: string,           // 'date' or 'time'
  formattedValue: string, // Human-readable formatted value
  timestamp: number       // Date.now() when selected
}
```

#### `booking:preference:changed`
**Description:** Booking time preference changed (Now vs Later)  
**Payload:**
```javascript
{
  preference: string,     // 'now' or 'later'
  tabType: string,        // Tab where preference changed
  source: string,         // What triggered the change
  timestamp: number       // Date.now() when changed
}
```

---

### 🎯 Experience Events
Events for Experience+ tab functionality.

#### `experience:type:selected`
**Description:** User selected an experience type  
**Payload:**
```javascript
{
  experienceType: string, // Selected experience (e.g., 'hourly_chauffeur')
  fieldId: string,        // Dropdown field ID
  displayName: string,    // Human-readable experience name
  timestamp: number       // Date.now() when selected
}
```

#### `experience:duration:selected`
**Description:** User selected experience duration  
**Payload:**
```javascript
{
  duration: string,       // Selected duration (e.g., '4')
  experienceType: string, // Associated experience type
  fieldId: string,        // Duration field ID
  timestamp: number       // Date.now() when selected
}
```

---

### 📊 Analytics Events
Events for tracking user interactions and system performance.

#### `analytics:track`
**Description:** Track user interaction or system event  
**Payload:**
```javascript
{
  event: string,          // Event name (e.g., 'form_submitted')
  properties: {           // Event-specific properties
    [key: string]: any
  },
  userId: string,         // User identifier (optional)
  sessionId: string,      // Session identifier (optional)
  timestamp: number       // Date.now() when event occurred
}
```

#### `analytics:page:view`
**Description:** Track page view  
**Payload:**
```javascript
{
  page: string,           // Page identifier
  url: string,            // Current URL
  referrer: string,       // Previous page URL
  timestamp: number       // Date.now() when page viewed
}
```

---

### 🔧 System Events
Events for system state and debugging.

#### `system:ready`
**Description:** Application initialization completed  
**Payload:**
```javascript
{
  modules: string[],      // Successfully loaded modules
  version: string,        // Application version
  timestamp: number       // Date.now() when ready
}
```

#### `system:error`
**Description:** System-level error occurred  
**Payload:**
```javascript
{
  error: string,          // Error message
  module: string,         // Module where error occurred
  stack: string,          // Error stack trace (optional)
  severity: string,       // Error severity level
  timestamp: number       // Date.now() when error occurred
}
```

---

### 🗺️ Maps Integration Events
Events for Google Maps functionality and location handling.

#### `map:ready`
**Description:** Google Maps API loaded and ready for use
**Payload:**
```javascript
{
  timestamp: number,      // When maps became ready
  version: string         // Google Maps API version
}
```

#### `map:autocomplete:initialized`
**Description:** Autocomplete initialized for a specific field
**Payload:**
```javascript
{
  fieldId: string,        // Field where autocomplete was initialized
  timestamp: number       // When initialization completed
}
```

#### `map:location:selected`
**Description:** User selected a location from autocomplete dropdown
**Payload:**
```javascript
{
  placeId: string,        // Google Place ID
  address: string,        // Formatted address
  coordinates: {          // Lat/lng coordinates
    lat: number,
    lng: number
  },
  fieldId: string,        // Form field ID
  source: string,         // Source of selection ('autocomplete', 'reverse-geocode', etc.)
  timestamp: number       // When location was selected
}
```

#### `map:location:cleared`
**Description:** Location field was cleared/reset
**Payload:**
```javascript
{
  fieldId: string,        // Field that was cleared
  timestamp: number       // When cleared
}
```

#### `map:user-location:requested`
**Description:** User's current location was requested
**Payload:**
```javascript
{
  fieldId: string,        // Field requesting the location
  timestamp: number       // When request was made
}
```

#### `map:user-location:succeeded`
**Description:** Successfully obtained user's current location
**Payload:**
```javascript
{
  placeId: string,        // Google Place ID from reverse geocoding
  address: string,        // Address from reverse geocoding
  coordinates: {          // User's coordinates
    lat: number,
    lng: number
  },
  fieldId: string,        // Field that requested location
  source: string,         // Always 'reverse-geocode'
  timestamp: number       // When location was obtained
}
```

#### `map:user-location:failed`
**Description:** Failed to get user's current location
**Payload:**
```javascript
{
  fieldId: string,        // Field that requested location
  error: string,          // Error message
  timestamp: number       // When error occurred
}
```

#### `map:geocode:requested`
**Description:** Address geocoding was requested
**Payload:**
```javascript
{
  address: string,        // Address to geocode
  fieldId: string,        // Associated form field
  timestamp: number       // When request was made
}
```

#### `map:geocode:succeeded`
**Description:** Address successfully geocoded to coordinates
**Payload:**
```javascript
{
  placeId: string,        // Google Place ID
  address: string,        // Formatted address
  coordinates: {          // Geocoded coordinates
    lat: number,
    lng: number
  },
  fieldId: string,        // Associated form field
  source: string,         // Always 'geocode'
  timestamp: number       // When geocoding completed
}
```

#### `map:geocode:failed`
**Description:** Address geocoding failed
**Payload:**
```javascript
{
  address: string,        // Address that failed to geocode
  fieldId: string,        // Associated form field
  error: string,          // Error message
  timestamp: number       // When error occurred
}
```

## Event Usage Examples

### Emitting Events
```javascript
// Show field error
eventBus.emit('error:show', {
  fieldId: 'from-location',
  message: 'Please enter a valid location',
  severity: 'error',
  source: 'validation',
  timestamp: Date.now()
});

// Form validation completed
eventBus.emit('form:validated', {
  isValid: false,
  errors: ['Missing required fields'],
  source: 'submit-validation',
  formId: 'booking-form',
  timestamp: Date.now()
});
```

### Listening to Events
```javascript
// Listen for location selection
eventBus.on('location:selected', (data) => {
  console.log(`Location selected for ${data.fieldId}: ${data.address}`);
  // Clear any existing errors for this field
  eventBus.emit('error:clear', {
    fieldId: data.fieldId,
    source: 'location-selection',
    timestamp: Date.now()
  });
});

// Listen for form validation
eventBus.on('form:validated', (data) => {
  if (data.isValid) {
    enableSubmitButton();
  } else {
    disableSubmitButton();
    // Show global validation message
    eventBus.emit('error:global', {
      message: `Please correct ${data.errors.length} error(s) before submitting`,
      severity: 'warning',
      dismissable: true,
      source: 'validation-summary',
      timestamp: Date.now()
    });
  }
});
```

## Best Practices

1. **Consistent Naming:** Always use the format `category:action` or `category:subcategory:action`
2. **Include Timestamps:** Always include `timestamp: Date.now()` in event payloads
3. **Source Tracking:** Always include a `source` field to track what emitted the event
4. **Error Handling:** Wrap event emissions in try-catch blocks
5. **Documentation:** Update this file when adding new events
6. **Payload Validation:** Validate event payloads in development mode

## Event Flow Examples

### Form Submission Flow
```
1. form:submit:started
2. form:validated (if invalid, stop here)
3. Multiple error:show events (if validation fails)
4. form:submit:completed
5. error:global (success message)
```

### Location Selection Flow
```
1. location:validation-required
2. location:selected
3. error:clear (clear any existing errors)
4. form:field:validated
5. form:validation-changed
```

### Tab Switch Flow
```
1. tab:content:hidden (previous tab)
2. tab:changed
3. tab:content:shown (new tab)
4. error:clear-all (clear tab-specific errors)
5. form:validation-changed
```

---

*Last Updated: [Current Date]*  
*Version: 1.0*

## Event File Structure

### Event Definition Files
- `ErrorEvents.js` - Error handling and notification events
- `MapEvents.js` - Google Maps and location-related events  
- `FormEvents.js` - Form validation and submission events
- `UIEvents.js` - User interface interaction events

### Integration Hub
- `eventBus.js` - Central export hub for all event definitions

### Usage Pattern
```javascript
// Import from the integration hub
import { MAP_EVENTS, FORM_EVENTS, createLocationObject } from './eventBus.js';

// Use standardized events
eventBus.emit(MAP_EVENTS.LOCATION_SELECTED, createLocationObject(...));
eventBus.emit(FORM_EVENTS.FORM_VALIDATED, createFormValidationObject(...));
```

### Maps Integration Flow
```
1. map:ready (when Google Maps API loads)
2. map:autocomplete:initialized (for each location field)
3. User types in field...
4. User selects from dropdown:
   a. map:location:selected
   b. error:clear (clear any field errors)
   c. form:field:validated (mark field as valid)
5. form:validation-changed (update overall form state)
```

### Current Location Flow
```
1. map:user-location:requested
2. Browser prompts for permission...
3. map:user-location:succeeded OR map:user-location:failed
4. If succeeded:
   a. Reverse geocoding happens
   b. map:location:selected (with reverse-geocoded address)
   c. error:clear
   d. form:field:validated
```

### Geocoding Flow
```
1. map:geocode:requested
2. map:geocode:succeeded OR map:geocode:failed
3. If succeeded:
   a. map:location:selected
   b. error:clear
   c. form:field:validated
4. If failed:
   a. error:show (display error to user)
```