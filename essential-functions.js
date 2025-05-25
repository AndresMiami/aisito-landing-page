/**
 * Essential Functions for Dashboard Integration
 * Extracts inline scripts and provides core utilities for SimpleBridge
 */

// Initialize global formState if it doesn't exist
if (!window.formState) {
  window.formState = {
    oneway: {
      fromLocation: false,
      toAddress: false,
      bookingTime: false,
      vehicleType: false
    },
    experienceplus: {
      fromLocation: false,
      serviceType: false,
      duration: false,
      bookingTime: false
    }
  };
  console.log('🔧 Initialized global formState:', window.formState);
}

// Force validation function for closed Shadow DOM elements
window.forceLocationValidation = function(elementId, stateType, stateKey) {
  console.log(`🔧 FORCE VALIDATING: ${elementId} -> ${stateType}.${stateKey}`);
  
  // Ensure formState exists and is properly structured
  if (!window.formState) window.formState = {};
  if (!window.formState[stateType]) window.formState[stateType] = {};
  
  // Force set to valid
  window.formState[stateType][stateKey] = true;
  console.log(`✅ FORCED: formState.${stateType}.${stateKey} = true`);
  
  // Trigger validation update
  if (typeof emitEvent === 'function') {
    emitEvent('form:field-changed', { field: `${stateType}-${stateKey}-forced` });
  }
  
  // Trigger form validation
  setTimeout(() => {
    if (typeof checkOneWayFormValidity === 'function') {
      checkOneWayFormValidity();
    }
    if (typeof checkExperiencePlusFormValidity === 'function') {
      checkExperiencePlusFormValidity();
    }
  }, 100);
  
  console.log('🎯 Force validation complete');
};

// Simple validation helper for user interaction
window.validateOnInteraction = function(elementId, stateType, stateKey) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  let hasInteracted = false;
  
  ['focus', 'click', 'keydown', 'input'].forEach(eventType => {
    element.addEventListener(eventType, () => {
      if (!hasInteracted) {
        hasInteracted = true;
        console.log(`👀 User interacted with ${elementId} - Auto-validating`);
        
        // Wait a bit then force validate
        setTimeout(() => {
          forceLocationValidation(elementId, stateType, stateKey);
        }, 1000);
      }
    });
  });
  
  console.log(`✅ Interaction validation set up for ${elementId}`);
};

// Form state tracking for validation
let formState = {
  isValidating: false,
  oneway: {
    fromLocation: false,
    toAddress: false,
    bookingTime: false,
    vehicleType: false
  },
  experiencePlus: {
    fromLocation: false,
    experienceType: false,
    dateTime: false
  }
};

// URL to experience mapping for navigation integration
const urlToExperienceMap = {
  'hourly.html': 'hourly_chauffeur',
  'yacht.html': 'water_sky',
  'dining.html': 'miami_relocation',
  'wynwood.html': 'tours_excursions',
  'airport.html': 'airport_transfer'
};

// Main integration testing functionality (extracted from inline script)
function initializeIntegrationTesting() {
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.log('🧪 Testing TabNavigation Integration...');
      
      // Test 1: Check if SimpleBridge is ready
      if (window.SimpleBridge) {
        const status = window.SimpleBridge.getStatus();
        console.log('✅ SimpleBridge status:', status);
        console.log('📋 TabNavigation integration:', status.tabNavigation);
        
        // Test 2: Check if TabNavigation component is loaded
        if (window.dashboardTabNavigation) {
          console.log('✅ TabNavigation component loaded successfully');
          console.log('🎯 Active tab:', window.dashboardTabNavigation.getActiveTab()?.textContent);
        } else {
          console.log('🔄 Using fallback tab system (this is OK!)');
        }
        
        // Test 3: Test tab switching - DISABLED to prevent automatic switching
        // const testTabSwitch = () => {
        //   const tabButtons = document.querySelectorAll('.tab-button');
        //   if (tabButtons.length > 1) {
        //     console.log('🧪 Testing tab switch...');
        //     tabButtons[1].click();
        //     setTimeout(() => {
        //       console.log('✅ Tab switch test completed');
        //     }, 100);
        //   }
        // };
        
        // Test 4: Monitor events
        window.SimpleBridge.on('dashboard:tab-changed', (data) => {
          console.log('📡 Tab change event received:', data);
        });
        
        window.SimpleBridge.on('integration:component-ready', (data) => {
          console.log('📡 Component ready event:', data);
        });
        
        // Run tests - COMMENTED OUT to prevent automatic tab switching
        // testTabSwitch();
        
      } else {
        console.warn('⚠️ SimpleBridge not available');
      }
      
      console.log('🏁 Integration testing complete');
    }, 2000);
  });
}

// Essential element reference function that SimpleBridge needs
function getElementRefs() {
  console.log('🔍 Getting element references for SimpleBridge...');
  
  const refs = {
    // Tab navigation elements
    tabNavigation: document.getElementById('tab-navigation'),
    tabButtons: {
      oneway: document.getElementById('tab-button-oneway'),
      experiencePlus: document.getElementById('tab-button-experience-plus')
    },
    tabPanels: {
      oneway: document.getElementById('panel-oneway'),
      experiencePlus: document.getElementById('panel-experience-plus')
    },
    
    // Form elements
    bookingForm: document.getElementById('booking-form'),
    submitButton: document.getElementById('submit-button'),
    resetButton: document.getElementById('reset-button'),
    
    // Location inputs
    fromLocation: document.getElementById('from-location'),
    toAddress: document.getElementById('to-address'),
    fromLocationExp: document.getElementById('from-location-exp'),
    
    // Date/time elements
    bookingPreference: document.getElementById('booking-preference'),
    requestNowButton: document.getElementById('request-now-button'),
    bookLaterButton: document.getElementById('book-later-button'),
    scheduledBookingInputs: document.getElementById('scheduled-booking-inputs'),
    
    // One-way specific elements
    pickupDateOneway: document.getElementById('pickup-date-oneway'),
    pickupTimeOneway: document.getElementById('pickup-time-oneway'),
    vehicleSelectionOneway: document.getElementById('vehicle-selection-oneway'),
    
    // Experience+ specific elements
    experienceDropdown: document.getElementById('experience-dropdown'),
    durationContainer: document.getElementById('duration-container'),
    durationHourly: document.getElementById('duration-hourly'),
    dateTimeContainerHourly: document.getElementById('date-time-container-hourly'),
    pickupDateHourly: document.getElementById('pickup-date-hourly'),
    pickupTimeHourly: document.getElementById('pickup-time-hourly'),
    datePreferenceContainer: document.getElementById('date-preference-container'),
    experienceOptionsContainer: document.getElementById('experience-options-container'),
    
    // Error elements
    errors: {
      fromLocation: document.getElementById('from-location-error'),
      toAddress: document.getElementById('to-address-error'),
      fromLocationExp: document.getElementById('from-location-exp-error'),
      bookingTime: document.getElementById('booking-time-error'),
      pickupDateOneway: document.getElementById('pickup-date-oneway-error'),
      pickupTimeOneway: document.getElementById('pickup-time-oneway-error'),
      vehicleTypeOneway: document.getElementById('vehicle-type-oneway-error'),
      experienceDropdown: document.getElementById('experience-dropdown-error'),
      durationHourly: document.getElementById('duration-hourly-error'),
      pickupDateHourly: document.getElementById('pickup-date-hourly-error'),
      pickupTimeHourly: document.getElementById('pickup-time-hourly-error'),
      datePreference: document.getElementById('date_preference-error')
    },
    
    // Description elements
    descriptions: {
      hourly: document.getElementById('hourly-description'),
      tours: document.getElementById('tours-description'),
      airport: document.getElementById('airport-description')
    },
    
    // Experience option containers
    experienceOptions: {
      waterSky: document.getElementById('water-sky-options'),
      wynwoodNight: document.getElementById('wynwood-night-options'),
      miamiRelocation: document.getElementById('miami-relocation-options')
    },
    
    // Confirmation message
    confirmationMessage: document.getElementById('confirmation-message')
  };
  
  // Log missing elements for debugging
  const missingElements = [];
  const checkElement = (path, element) => {
    if (!element) {
      missingElements.push(path);
    }
  };
  
  // Check critical elements
  checkElement('tabNavigation', refs.tabNavigation);
  checkElement('bookingForm', refs.bookingForm);
  checkElement('submitButton', refs.submitButton);
  
  // Check tab buttons
  Object.entries(refs.tabButtons).forEach(([key, element]) => {
    checkElement(`tabButtons.${key}`, element);
  });
  
  // Check tab panels
  Object.entries(refs.tabPanels).forEach(([key, element]) => {
    checkElement(`tabPanels.${key}`, element);
  });
  
  if (missingElements.length > 0) {
    console.warn('⚠️ Missing elements detected:', missingElements);
  } else {
    console.log('✅ All critical elements found');
  }
  
  console.log('📋 Element references prepared:', {
    totalElements: Object.keys(refs).length,
    missingCount: missingElements.length,
    hasTabNavigation: !!refs.tabNavigation,
    hasForm: !!refs.bookingForm
  });
  
  return refs;
}

// Event emission utility
function emitEvent(eventName, data = {}) {
  console.log(`📡 Emitting event: ${eventName}`, data);
  
  // Emit via SimpleBridge if available
  if (window.SimpleBridge && typeof window.SimpleBridge.emit === 'function') {
    window.SimpleBridge.emit(eventName, data);
  }
  
  // Also emit as custom DOM event
  const customEvent = new CustomEvent(eventName, { detail: data });
  document.dispatchEvent(customEvent);
}

// Debug function to inspect Google Places elements
function debugGooglePlacesElements() {
  console.log('🔍 Debugging Google Places elements...');
  
  const fromLocation = document.getElementById('from-location');
  const toAddress = document.getElementById('to-address');
  
  if (fromLocation) {
    console.log('📍 From location element:', {
      tagName: fromLocation.tagName,
      id: fromLocation.id,
      value: fromLocation.value,
      textContent: fromLocation.textContent,
      innerHTML: fromLocation.innerHTML,
      hasPlace: !!fromLocation.place,
      place: fromLocation.place
    });
    
    // Try to access shadow DOM
    try {
      const shadowRoot = fromLocation.shadowRoot;
      console.log('🌑 From location shadow DOM:', shadowRoot);
      if (shadowRoot) {
        const input = shadowRoot.querySelector('input');
        console.log('📝 Shadow DOM input:', input?.value);
      }
    } catch (e) {
      console.log('❌ Cannot access shadow DOM:', e.message);
    }
  }
  
  if (toAddress) {
    console.log('📍 To address element:', {
      tagName: toAddress.tagName,
      id: toAddress.id,
      value: toAddress.value,
      textContent: toAddress.textContent,
      innerHTML: toAddress.innerHTML,
      hasPlace: !!toAddress.place,
      place: toAddress.place
    });
  }
}

// One Way Tab Functionality
function initializeOneWayTab() {
  console.log('🚀 Initializing One Way tab functionality...');
  
  const refs = getElementRefs();
  
  // Debug Google Places elements after a delay
  setTimeout(() => {
    debugGooglePlacesElements();
  }, 1000);
  
  // Request Now/Book Later button handlers
  if (refs.requestNowButton) {
    refs.requestNowButton.addEventListener('click', () => {
      console.log('📅 Request Now selected');
      if (refs.bookingPreference) refs.bookingPreference.value = 'now';
      refs.scheduledBookingInputs?.classList.add('hidden');
      
      // Update form state
      formState.oneway.bookingTime = true;
      console.log('🔄 Form state updated - bookingTime:', formState.oneway.bookingTime);
      
      // Visual feedback
      refs.requestNowButton.classList.add('active');
      refs.bookLaterButton?.classList.remove('active');
      
      emitEvent('form:booking-preference-changed', { preference: 'now', tab: 'oneway' });
      checkFormValidity();
    });
  }
  
  if (refs.bookLaterButton) {
    refs.bookLaterButton.addEventListener('click', () => {
      console.log('📅 Book Later selected');
      if (refs.bookingPreference) refs.bookingPreference.value = 'later';
      refs.scheduledBookingInputs?.classList.remove('hidden');
      
      // Update form state - requires date/time selection
      formState.oneway.bookingTime = false;
      console.log('🔄 Form state updated - bookingTime requires date/time:', formState.oneway.bookingTime);
      
      // Visual feedback
      refs.bookLaterButton.classList.add('active');
      refs.requestNowButton?.classList.remove('active');
      
      emitEvent('form:booking-preference-changed', { preference: 'later', tab: 'oneway' });
      checkFormValidity();
    });
  }
  
  // Date/time input handlers for "Book Later"
  if (refs.pickupDateOneway) {
    refs.pickupDateOneway.addEventListener('change', () => {
      const value = refs.pickupDateOneway?.value || '';
      console.log('📅 Pickup date changed:', value);
      emitEvent('form:field-changed', { field: 'pickup-date-oneway', value });
      checkDateTimeValidity();
    });
  }
  
  if (refs.pickupTimeOneway) {
    refs.pickupTimeOneway.addEventListener('change', () => {
      const value = refs.pickupTimeOneway?.value || '';
      console.log('⏰ Pickup time changed:', value);
      emitEvent('form:field-changed', { field: 'pickup-time-oneway', value });
      checkDateTimeValidity();
    });
  }
  
  // Vehicle selection logic
  initializeVehicleSelection();
  
  // FIXED: Google Places Web Component handlers
  if (refs.fromLocation) {
    console.log('🔧 Setting up gmp-place-autocomplete for from-location');
    
    // Method 1: Listen for gmp-placeselect event (when user selects from dropdown)
    refs.fromLocation.addEventListener('gmp-placeselect', (event) => {
      const place = event.target.place;
      const displayName = place?.displayName || place?.formattedAddress || '';
      
      formState.oneway.fromLocation = true; // Any selection counts as valid
      console.log('🏁 From location (gmp-placeselect):', { 
        place,
        displayName, 
        formState: formState.oneway.fromLocation 
      });
      
      emitEvent('form:field-changed', { field: 'from-location', value: displayName, place });
      checkFormValidity();
    });
    
    // Method 2: Monitor for text input in shadow DOM using MutationObserver
    const observeFromLocation = () => {
      try {
        // Create a MutationObserver to watch for changes in the shadow DOM
        const observer = new MutationObserver(() => {
          // Check if there's any text content or if place is set
          const hasPlace = !!refs.fromLocation.place;
          const hasTextContent = (refs.fromLocation.textContent || '').trim().length > 0;
          
          // Check the shadow DOM input if accessible
          let hasInputValue = false;
          try {
            const shadowRoot = refs.fromLocation.shadowRoot;
            if (shadowRoot) {
              const input = shadowRoot.querySelector('input');
              hasInputValue = (input?.value || '').length > 0;
            }
          } catch (e) {
            // Shadow DOM not accessible, that's okay
          }
          
          const shouldBeValid = hasPlace || hasTextContent || hasInputValue;
          
          if (formState.oneway.fromLocation !== shouldBeValid) {
            formState.oneway.fromLocation = shouldBeValid;
            console.log('🏁 From location (observer):', { 
              hasPlace, 
              hasTextContent, 
              hasInputValue, 
              shouldBeValid,
              formState: formState.oneway.fromLocation 
            });
            
            emitEvent('form:field-changed', { field: 'from-location', value: 'text-input' });
            checkFormValidity();
          }
        });
        
        // Observe changes to the element and its children
        observer.observe(refs.fromLocation, { 
          childList: true, 
          subtree: true, 
          characterData: true,
          attributes: true 
        });
        
        console.log('👀 From location observer set up');
      } catch (e) {
        console.warn('⚠️ Could not set up from location observer:', e);
      }
    };
    
    observeFromLocation();
    
    // Method 3: Periodic check as fallback
    let lastFromState = false;
    setInterval(() => {
      const hasPlace = !!refs.fromLocation.place;
      const hasContent = (refs.fromLocation.textContent || '').trim().length > 0;
      const shouldBeValid = hasPlace || hasContent;
      
      if (shouldBeValid !== lastFromState) {
        lastFromState = shouldBeValid;
        formState.oneway.fromLocation = shouldBeValid;
        console.log('🏁 From location (periodic check):', { 
          hasPlace, 
          hasContent, 
          shouldBeValid,
          formState: formState.oneway.fromLocation 
        });
        emitEvent('form:field-changed', { field: 'from-location', value: 'periodic-check' });
        checkFormValidity();
      }
    }, 1000);
  }
  
  if (refs.toAddress) {
    console.log('🔧 Setting up gmp-place-autocomplete for to-address');
    
    // Same approach for to-address
    refs.toAddress.addEventListener('gmp-placeselect', (event) => {
      const place = event.target.place;
      const displayName = place?.displayName || place?.formattedAddress || '';
      
      formState.oneway.toAddress = true;
      console.log('🎯 To address (gmp-placeselect):', { 
        place,
        displayName, 
        formState: formState.oneway.toAddress 
      });
      
      emitEvent('form:field-changed', { field: 'to-address', value: displayName, place });
      checkFormValidity();
    });
    
    // Observer for to-address
    const observeToAddress = () => {
      try {
        const observer = new MutationObserver(() => {
          const hasPlace = !!refs.toAddress.place;
          const hasTextContent = (refs.toAddress.textContent || '').trim().length > 0;
          
          let hasInputValue = false;
          try {
            const shadowRoot = refs.toAddress.shadowRoot;
            if (shadowRoot) {
              const input = shadowRoot.querySelector('input');
              hasInputValue = (input?.value || '').length > 0;
            }
          } catch (e) {
            // Shadow DOM not accessible
          }
          
          const shouldBeValid = hasPlace || hasTextContent || hasInputValue;
          
          if (formState.oneway.toAddress !== shouldBeValid) {
            formState.oneway.toAddress = shouldBeValid;
            console.log('🎯 To address (observer):', { 
              hasPlace, 
              hasTextContent, 
              hasInputValue, 
              shouldBeValid,
              formState: formState.oneway.toAddress 
            });
            
            emitEvent('form:field-changed', { field: 'to-address', value: 'text-input' });
            checkFormValidity();
          }
        });
        
        observer.observe(refs.toAddress, { 
          childList: true, 
          subtree: true, 
          characterData: true,
          attributes: true 
        });
        
        console.log('👀 To address observer set up');
      } catch (e) {
        console.warn('⚠️ Could not set up to address observer:', e);
      }
    };
    
    observeToAddress();
    
    // Periodic check for to-address
    let lastToState = false;
    setInterval(() => {
      const hasPlace = !!refs.toAddress.place;
      const hasContent = (refs.toAddress.textContent || '').trim().length > 0;
      const shouldBeValid = hasPlace || hasContent;
      
      if (shouldBeValid !== lastToState) {
        lastToState = shouldBeValid;
        formState.oneway.toAddress = shouldBeValid;
        console.log('🎯 To address (periodic check):', { 
          hasPlace, 
          hasContent, 
          shouldBeValid,
          formState: formState.oneway.toAddress 
        });
        emitEvent('form:field-changed', { field: 'to-address', value: 'periodic-check' });
        checkFormValidity();
      }
    }, 1000);
  }
  
  // Initialize Flatpickr for date/time pickers
  initializeFlatpickr();
}

// Initialize Flatpickr date/time pickers
function initializeFlatpickr() {
  console.log('📅 Initializing Flatpickr date/time pickers...');
  
  // Initialize date picker for One Way tab
  if (typeof flatpickr !== 'undefined') {
    const pickupDateOneway = document.getElementById('pickup-date-oneway');
    if (pickupDateOneway) {
      flatpickr(pickupDateOneway, {
        minDate: 'today',
        dateFormat: 'Y-m-d',
        onChange: () => {
          checkDateTimeValidity();
        }
      });
      console.log('✅ Date picker initialized for pickup-date-oneway');
    }
    
    const pickupTimeOneway = document.getElementById('pickup-time-oneway');
    if (pickupTimeOneway) {
      flatpickr(pickupTimeOneway, {
        enableTime: true,
        noCalendar: true,
        dateFormat: 'H:i',
        time_24hr: false,
        onChange: () => {
          checkDateTimeValidity();
        }
      });
      console.log('✅ Time picker initialized for pickup-time-oneway');
    }
    
    // Initialize date/time pickers for Experience+ tab
    const pickupDateHourly = document.getElementById('pickup-date-hourly');
    if (pickupDateHourly) {
      flatpickr(pickupDateHourly, {
        minDate: 'today',
        dateFormat: 'Y-m-d',
        onChange: () => {
          checkExperienceDateTimeValidity();
        }
      });
      console.log('✅ Date picker initialized for pickup-date-hourly');
    }
    
    const pickupTimeHourly = document.getElementById('pickup-time-hourly');
    if (pickupTimeHourly) {
      flatpickr(pickupTimeHourly, {
        enableTime: true,
        noCalendar: true,
        dateFormat: 'H:i',
        time_24hr: false,
        onChange: () => {
          checkExperienceDateTimeValidity();
        }
      });
      console.log('✅ Time picker initialized for pickup-time-hourly');
    }
  } else {
    console.warn('⚠️ Flatpickr not available');
  }
}

// Vehicle selection initialization
function initializeVehicleSelection() {
  console.log('🚗 Initializing vehicle selection...');
  
  const vehicleCards = document.querySelectorAll('label[for^="vehicle-"]');
  const vehicleRadios = document.querySelectorAll('input[name="vehicle_type_oneway"]');
  
  vehicleCards.forEach(card => {
    card.addEventListener('click', () => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        console.log('🚗 Vehicle selected:', radio.value);
        
        // Update form state
        formState.oneway.vehicleType = true;
        console.log('🔄 Form state updated - vehicleType:', formState.oneway.vehicleType);
        
        // Visual feedback
        vehicleCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        // Update radio
        vehicleRadios.forEach(r => r.checked = false);
        radio.checked = true;
        
        emitEvent('form:vehicle-selected', { vehicle: radio.value, tab: 'oneway' });
        checkFormValidity();
      }
    });
  });
}

// Check date/time validity for "Book Later" with null checks
function checkDateTimeValidity() {
  const refs = getElementRefs();
  const hasDate = (refs.pickupDateOneway?.value?.length || 0) > 0;
  const hasTime = (refs.pickupTimeOneway?.value?.length || 0) > 0;
  
  if (refs.bookingPreference?.value === 'later') {
    formState.oneway.bookingTime = hasDate && hasTime;
    console.log('📅 Date/time validity check:', { 
      hasDate, 
      hasTime, 
      valid: formState.oneway.bookingTime,
      dateValue: refs.pickupDateOneway?.value,
      timeValue: refs.pickupTimeOneway?.value
    });
  }
  
  checkFormValidity();
}

// Check if vehicle selection should be shown
function checkShowVehicles() {
  const refs = getElementRefs();
  const activeTab = document.querySelector('.tab-panel:not(.hidden)');
  const isOnewayTab = activeTab?.id === 'panel-oneway';
  
  // Use the global formState values for consistency
  const globalState = window.formState || {};
  
  if (isOnewayTab && refs.vehicleSelectionOneway) {
    const shouldShow = (globalState.oneway?.fromLocation || formState.oneway?.fromLocation) && 
                     (globalState.oneway?.toAddress || formState.oneway?.toAddress) && 
                     (formState.oneway?.bookingTime || globalState.oneway?.bookingTime);
    
    console.log('🚗 Vehicle selection visibility check:', {
      fromLocation: globalState.oneway?.fromLocation || formState.oneway?.fromLocation,
      toAddress: globalState.oneway?.toAddress || formState.oneway?.toAddress,
      bookingTime: formState.oneway?.bookingTime || globalState.oneway?.bookingTime,
      shouldShow
    });
    
    if (shouldShow) {
      refs.vehicleSelectionOneway.classList.remove('hidden');
      // THIS is the critical line you need to add:
      refs.vehicleSelectionOneway.classList.add('show'); 
      console.log('✅ Vehicle selection shown');
    } else {
      refs.vehicleSelectionOneway.classList.add('hidden');
      // Also remove the show class when hiding
      refs.vehicleSelectionOneway.classList.remove('show');
      console.log('❌ Vehicle selection hidden');
    }
  }
}

// Form validation check
function checkFormValidity() {
  // First synchronize the form states
  if (typeof synchronizeFormStates === 'function') {
    synchronizeFormStates();
  }
  
  const refs = getElementRefs();
  const activeTab = document.querySelector('.tab-panel:not(.hidden)');
  const isOnewayTab = activeTab?.id === 'panel-oneway';
  
  let isValid = false;
  
  // Ensure local values are synced with global values
  if (window.formState && window.formState.oneway) {
    formState.oneway.fromLocation = window.formState.oneway.fromLocation || formState.oneway.fromLocation;
    formState.oneway.toAddress = window.formState.oneway.toAddress || formState.oneway.toAddress;
  }
  
  if (isOnewayTab) {
    isValid = formState.oneway.fromLocation && 
              formState.oneway.toAddress && 
              formState.oneway.bookingTime && 
              formState.oneway.vehicleType;
    
    console.log('✅ One-way form validity check:', {
      fromLocation: formState.oneway.fromLocation,
      toAddress: formState.oneway.toAddress,
      bookingTime: formState.oneway.bookingTime,
      vehicleType: formState.oneway.vehicleType,
      isValid
    });
  } else {
    // Experience+ validation
    isValid = formState.experiencePlus.fromLocation && 
              formState.experiencePlus.experienceType && 
              formState.experiencePlus.dateTime;
    
    console.log('✅ Experience+ form validity check:', {
      fromLocation: formState.experiencePlus.fromLocation,
      experienceType: formState.experiencePlus.experienceType,
      dateTime: formState.experiencePlus.dateTime,
      isValid
    });
  }
  
  // Update submit button
  if (refs.submitButton) {
    refs.submitButton.disabled = !isValid;
    refs.submitButton.setAttribute('aria-disabled', !isValid);
    
    if (isValid) {
      refs.submitButton.classList.add('enabled');
      refs.submitButton.removeAttribute('title');
    } else {
      refs.submitButton.classList.remove('enabled');
      refs.submitButton.setAttribute('title', 'Complete all required fields to enable submission');
    }
  }
  
  // Show vehicles if conditions met
  checkShowVehicles();
  
  emitEvent('form:validation-changed', { isValid, tab: isOnewayTab ? 'oneway' : 'experience-plus' });
}

// Experience+ Tab Functionality
function initializeExperiencePlusTab() {
  console.log('🎨 Initializing Experience+ tab functionality...');
  
  const refs = getElementRefs();
  
  // Experience dropdown handler
  if (refs.experienceDropdown) {
    refs.experienceDropdown.addEventListener('change', (e) => {
      const selectedValue = e.target.value;
      console.log('🎯 Experience selected:', selectedValue);
      
      // Update form state with null check
      formState.experiencePlus.experienceType = (selectedValue?.length || 0) > 0;
      
      // Show/hide containers based on selection
      handleExperienceSelection(selectedValue);
      
      emitEvent('experience:selected', { experience: selectedValue });
      checkFormValidity();
    });
  }
  
  // FIXED: Google Places Autocomplete event handlers for Experience+ tab
  if (refs.fromLocationExp) {
    // Primary: Google Places selection event
    refs.fromLocationExp.addEventListener('gmp-placeselect', (event) => {
      const place = event.target.place;
      const displayName = place?.displayName || place?.formattedAddress || '';
      const hasValue = displayName.length > 0;
      
      formState.experiencePlus.fromLocation = hasValue;
      console.log('🏁 Experience+ from location (gmp-placeselect):', { 
        displayName, 
        formattedAddress: place?.formattedAddress,
        hasValue, 
        formState: formState.experiencePlus.fromLocation 
      });
      
      emitEvent('form:field-changed', { field: 'from-location-exp', value: displayName, place });
      checkFormValidity();
    });
    
    // Fallback: Monitor the value property
    const checkExpLocationValue = () => {
      const value = refs.fromLocationExp.value || '';
      const hasValue = value.length > 0;
      if (formState.experiencePlus.fromLocation !== hasValue) {
        formState.experiencePlus.fromLocation = hasValue;
        console.log('🏁 Experience+ from location (value check):', { value, hasValue, formState: formState.experiencePlus.fromLocation });
        emitEvent('form:field-changed', { field: 'from-location-exp', value });
        checkFormValidity();
      }
    };
    
    setInterval(checkExpLocationValue, 500);
  }
  
  // Date preference handlers
  initializeDatePreferences();
  
  // Hourly duration handler
  if (refs.durationHourly) {
    refs.durationHourly.addEventListener('change', () => {
      const value = refs.durationHourly?.value || '';
      console.log('⏱️ Duration changed:', value);
      emitEvent('form:field-changed', { field: 'duration-hourly', value });
    });
  }
  
  // Hourly date/time handlers with null checks
  if (refs.pickupDateHourly) {
    refs.pickupDateHourly.addEventListener('change', () => {
      const value = refs.pickupDateHourly?.value || '';
      console.log('📅 Hourly date changed:', value);
      checkExperienceDateTimeValidity();
    });
  }
  
  if (refs.pickupTimeHourly) {
    refs.pickupTimeHourly.addEventListener('change', () => {
      const value = refs.pickupTimeHourly?.value || '';
      console.log('⏰ Hourly time changed:', value);
      checkExperienceDateTimeValidity();
    });
  }
}

// Handle experience selection show/hide logic
function handleExperienceSelection(selectedValue) {
  const refs = getElementRefs();
  
  // Hide all containers first
  refs.durationContainer?.classList.add('hidden');
  refs.dateTimeContainerHourly?.classList.add('hidden');
  refs.datePreferenceContainer?.classList.add('hidden');
  refs.descriptions.hourly?.classList.add('hidden');
  refs.descriptions.tours?.classList.add('hidden');
  refs.descriptions.airport?.classList.add('hidden');
  
  // Hide all experience options
  Object.values(refs.experienceOptions).forEach(container => {
    container?.classList.add('hidden');
  });
  
  // Update submit button text
  updateSubmitButtonText(selectedValue);
  
  // Show relevant containers based on selection
  switch (selectedValue) {
    case 'hourly_chauffeur':
      refs.descriptions.hourly?.classList.remove('hidden');
      refs.durationContainer?.classList.remove('hidden');
      refs.dateTimeContainerHourly?.classList.remove('hidden');
      console.log('📋 Showing hourly chauffeur options');
      break;
      
    case 'tours_excursions':
      refs.descriptions.tours?.classList.remove('hidden');
      refs.datePreferenceContainer?.classList.remove('hidden');
      refs.experienceOptions.wynwoodNight?.classList.remove('hidden');
      console.log('📋 Showing tours & excursions options');
      break;
      
    case 'airport_transfer':
      refs.descriptions.airport?.classList.remove('hidden');
      refs.datePreferenceContainer?.classList.remove('hidden');
      console.log('📋 Showing airport transfer options');
      break;
      
    case 'water_sky':
      refs.datePreferenceContainer?.classList.remove('hidden');
      refs.experienceOptions.waterSky?.classList.remove('hidden');
      console.log('📋 Showing yacht & boat options');
      break;
      
    case 'miami_relocation':
      refs.experienceOptions.miamiRelocation?.classList.remove('hidden');
      console.log('📋 Showing Miami relocation options');
      break;
      
    default:
      console.log('📋 No specific options for:', selectedValue);
  }
  
  // Update date/time validity
  checkExperienceDateTimeValidity();
}

// Update submit button text based on experience
function updateSubmitButtonText(experience) {
  const refs = getElementRefs();
  const buttonText = refs.submitButton?.querySelector('.button-text');
  
  if (buttonText) {
    switch (experience) {
      case 'hourly_chauffeur':
        buttonText.textContent = 'Book Hourly Service';
        break;
      case 'tours_excursions':
        buttonText.textContent = 'Book Tour';
        break;
      case 'airport_transfer':
        buttonText.textContent = 'Book Transfer';
        break;
      case 'water_sky':
        buttonText.textContent = 'Request Quote';
        break;
      case 'miami_relocation':
        buttonText.textContent = 'Get Consultation';
        break;
      default:
        buttonText.textContent = 'Continue';
    }
    
    console.log('🔤 Submit button text updated:', buttonText.textContent);
  }
}

// Initialize date preferences
function initializeDatePreferences() {
  const datePreferenceRadios = document.querySelectorAll('input[name="date_preference"]');
  
  datePreferenceRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      console.log('📅 Date preference changed:', e.target.value);
      formState.experiencePlus.dateTime = true; // Date preference counts as date selection
      emitEvent('form:date-preference-changed', { preference: e.target.value });
      checkFormValidity();
    });
  });
}

// Check Experience+ date/time validity with null checks
function checkExperienceDateTimeValidity() {
  const refs = getElementRefs();
  const selectedExperience = refs.experienceDropdown?.value;
  
  if (selectedExperience === 'hourly_chauffeur') {
    // For hourly, need both date and time
    const hasDate = (refs.pickupDateHourly?.value?.length || 0) > 0;
    const hasTime = (refs.pickupTimeHourly?.value?.length || 0) > 0;
    formState.experiencePlus.dateTime = hasDate && hasTime;
  } else {
    // For other experiences, date preference is sufficient
    const selectedPreference = document.querySelector('input[name="date_preference"]:checked');
    formState.experiencePlus.dateTime = !!selectedPreference;
  }
  
  console.log('📅 Experience+ date/time validity:', formState.experiencePlus.dateTime);
  checkFormValidity();
}

// Tab switching functionality
function initializeTabSwitching() {
  console.log('🔄 Initializing tab switching...');
  
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = button.getAttribute('data-tab-target');
      const targetPanel = document.querySelector(targetId);
      
      if (targetPanel) {
        // Update button states
        tabButtons.forEach(btn => {
          btn.setAttribute('aria-selected', 'false');
          btn.classList.remove('active');
        });
        
        button.setAttribute('aria-selected', 'true');
        button.classList.add('active');
        
        // Update panel states
        tabPanels.forEach(panel => {
          panel.classList.add('hidden');
          panel.setAttribute('tabindex', '-1');
        });
        
        targetPanel.classList.remove('hidden');
        targetPanel.setAttribute('tabindex', '0');
        
        const tabName = targetId.replace('#panel-', '');
        console.log('🔄 Tab switched to:', tabName);
        
        emitEvent('tab:switched', { tab: tabName, targetId });
        
        // Reset form validation for new tab
        checkFormValidity();
      }
    });
  });
}

// Reset form functionality
function initializeResetButton() {
  console.log('🔄 Essential Functions: Reset disabled - using Dashboard.js reset');
  
  // Check if dashboard.js already handled reset
  if (window.dashboardResetInitialized) {
    console.log('✅ Reset already handled by dashboard.js');
    return;
  }
  
  // Your existing essential-functions reset code here...
  // Only runs if dashboard.js didn't handle it
}

// Enhanced reset function with smooth animations
function resetFormWithAnimation() {
  console.log('🧹 Starting animated form reset...');
  
  return new Promise((resolve) => {
    // Step 1: Reset form state first
    window.formState = {
      oneway: {
        fromLocation: false,
        toAddress: false,
        bookingTime: false,
        vehicleType: false
      },
      experienceplus: {
        fromLocation: false,
        serviceType: false,
        duration: false,
        bookingTime: false
      }
    };
    
    // Step 2: Hide vehicle selection with animation
    const vehicleContainer = document.getElementById('vehicle-selection-oneway');
    if (vehicleContainer && !vehicleContainer.classList.contains('hidden')) {
      console.log('🎬 Starting vehicle container hide animation...');
      
      // Add the hiding animation class
      vehicleContainer.classList.add('hiding');
      
      // Wait for animation to complete, then actually hide
      setTimeout(() => {
        vehicleContainer.classList.add('hidden');
        vehicleContainer.classList.remove('hiding', 'show');
        console.log('✅ Vehicle container hidden with animation');
      }, 1200); // Match your CSS transition duration
    }
    
    // Step 3: Reset form fields with animation
    const form = document.getElementById('booking-form');
    if (form) {
      const formElements = form.querySelectorAll('input, select, textarea');
      
      formElements.forEach((element, index) => {
        setTimeout(() => {
          // Add reset animation class
          element.classList.add('form-field-resetting');
          
          // Reset the field value
          if (element.type === 'radio' || element.type === 'checkbox') {
            element.checked = false;
          } else {
            element.value = '';
          }
          
          // Remove selected classes
          element.classList.remove('selected', 'error');
          
          // Remove animation class after animation completes
          setTimeout(() => {
            element.classList.remove('form-field-resetting');
          }, 300);
        }, index * 50); // Staggered animation
      });
    }
    
    // Step 4: Reset booking time buttons with animation
    const requestNowBtn = document.getElementById('request-now-button');
    const bookLaterBtn = document.getElementById('book-later-button');
    
    [requestNowBtn, bookLaterBtn].forEach(btn => {
      if (btn && btn.classList.contains('selected')) {
        btn.classList.add('deselecting');
        setTimeout(() => {
          btn.classList.remove('selected', 'deselecting');
        }, 400);
      }
    });
    
    // Step 5: Hide scheduled inputs with animation
    const scheduledInputs = document.getElementById('scheduled-booking-inputs');
    if (scheduledInputs && !scheduledInputs.classList.contains('hidden')) {
      scheduledInputs.classList.add('hidden');
    }
    
    // Step 6: Reset booking preference
    const bookingPrefInput = document.getElementById('booking-preference');
    if (bookingPrefInput) {
      bookingPrefInput.value = '';
    }
    
    // Emit reset events
    emitEvent('form:reset', {});
    
    // Complete after all animations
    setTimeout(() => {
      console.log('✅ Animated form reset complete');
      resolve();
    }, 1500);
  });
}

// Update your existing reset function to use the animated version
async function resetForm() {
  console.log('🔄 Resetting form...');
  
  try {
    // Use the animated reset
    await resetFormWithAnimation();
    
    // Trigger validation updates
    synchronizeFormStates();
    const refs = getElementRefs();
    checkOneWayFormValidity(refs);
    checkVehicleSelectionVisibility(refs);
    
    emitEvent('form:validation-changed', { isValid: false, tab: 'oneway' });
    
    console.log('✅ Form reset complete');
  } catch (error) {
    console.error('❌ Form reset error:', error);
  }
}

// Handle URL-based experience selection
function handleUrlExperienceSelection() {
  const currentUrl = window.location.pathname;
  const filename = currentUrl.split('/').pop();
  const experienceType = urlToExperienceMap[filename];
  
  if (experienceType) {
    console.log('🔗 URL-based experience detected:', experienceType);
    
    // Switch to Experience+ tab
    const experiencePlusButton = document.getElementById('tab-button-experience-plus');
    if (experiencePlusButton) {
      experiencePlusButton.click();
    }
    
    // Set experience dropdown
    const experienceDropdown = document.getElementById('experience-dropdown');
    if (experienceDropdown) {
      experienceDropdown.value = experienceType;
      experienceDropdown.dispatchEvent(new Event('change'));
    }
    
    emitEvent('form:url-experience-selected', { experience: experienceType, url: filename });
  }
}

// Utility function to safely query elements with logging
function safeQuerySelector(selector, context = document) {
  try {
    const element = context.querySelector(selector);
    if (!element) {
      console.debug(`🔍 Element not found: ${selector}`);
    }
    return element;
  } catch (error) {
    console.error(`❌ Error querying selector "${selector}":`, error);
    return null;
  }
}

// Utility function to safely query multiple elements
function safeQuerySelectorAll(selector, context = document) {
  try {
    const elements = context.querySelectorAll(selector);
    console.debug(`🔍 Found ${elements.length} elements for: ${selector}`);
    return elements;
  } catch (error) {
    console.error(`❌ Error querying selector "${selector}":`, error);
    return [];
  }
}

// DOM ready utility
function onDOMReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

// Initialize when DOM is ready
onDOMReady(() => {
  console.log('🚀 Essential functions initialized');
  
  // Your existing initialization...
  initializeTabSwitching();
  initializeOneWayTab();
  initializeExperiencePlusTab();
  initializeResetButton();
  
  // Existing automatic detection
  initializeAutomaticPlacesValidation();
  
  // ADD this enhanced from-location detection
  setTimeout(() => {
    forceFromLocationValidation();
  }, 2000); // Wait 2 seconds for everything to load
  
  console.log('✅ Essential functions ready - Enhanced from-location validation enabled');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getElementRefs,
    safeQuerySelector,
    safeQuerySelectorAll,
    onDOMReady,
    initializeIntegrationTesting,
    checkFormValidity,
    checkShowVehicles,
    formState
  };
}

// ADD this complete function at the end of your essential-functions.js file

function initializeAutomaticPlacesValidation() {
  console.log('🚀 Initializing automatic Google Places validation for all tabs...');
  
  // Wait for Google Maps API to be fully loaded
  function waitForGoogleMaps(callback) {
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('✅ Google Maps API is ready');
      callback();
    } else {
      console.log('⏳ Waiting for Google Maps API...');
      setTimeout(() => waitForGoogleMaps(callback), 200);
    }
  }
  
  // Initialize once Google Maps is ready
  waitForGoogleMaps(() => {
    setupAllPlaceElements();
  });
}

function setupAllPlaceElements() {
  // Get all Google Places autocomplete elements from your HTML
  const fromLocation = document.getElementById('from-location');           // One Way - Starting Location
  const toAddress = document.getElementById('to-address');                 // One Way - Destination  
  const fromLocationExp = document.getElementById('from-location-exp');   // Experience+ - Starting Location
  
  console.log('🔍 Found place elements:', {
    'One Way From': !!fromLocation,
    'One Way To': !!toAddress,
    'Experience+ From': !!fromLocationExp
  });
  
  // Setup each element with comprehensive detection
  if (fromLocation) {
    setupAdvancedPlaceDetection(fromLocation, 'oneway', 'fromLocation', 'One Way Starting Location');
  }
  
  if (toAddress) {
    setupAdvancedPlaceDetection(toAddress, 'oneway', 'toAddress', 'One Way Destination');
  }
  
  if (fromLocationExp) {
    setupAdvancedPlaceDetection(fromLocationExp, 'experienceplus', 'fromLocation', 'Experience+ Starting Location');
  }
}

function setupAdvancedPlaceDetection(element, tabType, stateKey, displayName) {
  let hasUserInteracted = false;
  let isLocationValidated = false;
  let lastKnownValue = '';
  let validationAttempts = 0;
  
  console.log(`🔧 Setting up advanced detection for: ${displayName}`);
  
  // === METHOD 1: Official Google Events (Primary Detection) ===
  
  // Event fires when user selects from dropdown
  element.addEventListener('gmp-placeselect', (event) => {
    if (!isLocationValidated) {
      console.log(`✅ ${displayName} - Place selected from dropdown:`, event.place);
      markLocationAsValid(tabType, stateKey, 'Google dropdown selection', event.place);
      isLocationValidated = true;
    }
  });
  
  // Event fires when place changes
  element.addEventListener('gmp-placechange', (event) => {
    if (!isLocationValidated) {
      console.log(`✅ ${displayName} - Place changed:`, event);
      markLocationAsValid(tabType, stateKey, 'Google place change', event);
      isLocationValidated = true;
    }
  });
  
  // === METHOD 2: Property Monitoring (Secondary Detection) ===
  
  function checkGooglePlaceProperty() {
    try {
      const place = element.place;
      if (place && place.place_id && !isLocationValidated) {
        console.log(`✅ ${displayName} - Google place property detected:`, {
          name: place.name || 'N/A',
          formatted_address: place.formatted_address || 'N/A',
          place_id: place.place_id
        });
        markLocationAsValid(tabType, stateKey, 'Google place property', place);
        isLocationValidated = true;
        return true;
      }
    } catch (error) {
      // Silently handle property access errors (expected with closed Shadow DOM)
    }
    return false;
  }
  
  // === METHOD 3: Content Detection & User Interaction ===
  
  function getElementContent() {
    try {
      // Try multiple ways to get content from the Google Places element
      return element.value || 
             element.textContent || 
             element.innerText || 
             element.getAttribute('value') || 
             '';
    } catch (error) {
      return '';
    }
  }
  
  function isValidMiamiLocation(content) {
    if (!content || content.length < 3) return false;
    
    // Miami-specific location patterns
    const miamiPatterns = [
      // General Miami/Florida
      /\b(miami|florida|fl)\b/i,
      
      // Miami neighborhoods and areas
      /\b(south beach|brickell|wynwood|coral gables|coconut grove|downtown|little havana|key biscayne)\b/i,
      
      // Airports and transportation hubs
      /\b(airport|mia|fort lauderdale|fll|cruise|port)\b/i,
      
      // Popular hotels and landmarks
      /\b(fontainebleau|eden roc|setai|w hotel|marriott|hilton|four seasons|ritz carlton)\b/i,
      
      // Street address patterns
      /\d+\s+[\w\s]+(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|way|lane|ln|court|ct|place|pl)/i,
      
      // Miami landmarks
      /\b(ocean drive|lincoln road|collins avenue|biscayne|bayside|american airlines arena)\b/i
    ];
    
    return miamiPatterns.some(pattern => pattern.test(content));
  }
  
  function performContentValidation() {
    if (isLocationValidated) return true;
    
    validationAttempts++;
    const currentContent = getElementContent();
    
    // Check if content has changed and looks valid
    if (currentContent && currentContent !== lastKnownValue) {
      lastKnownValue = currentContent;
      
      console.log(`🔍 ${displayName} - Content check (attempt ${validationAttempts}): "${currentContent}"`);
      
      // Validate based on content patterns
      if (isValidMiamiLocation(currentContent)) {
        console.log(`✅ ${displayName} - Valid Miami location detected: "${currentContent}"`);
        markLocationAsValid(tabType, stateKey, 'Content pattern validation', { input: currentContent });
        isLocationValidated = true;
        return true;
      }
      
      // For substantial input (8+ characters), be more permissive
      if (hasUserInteracted && currentContent.length >= 8 && validationAttempts > 2) {
        console.log(`🔄 ${displayName} - Accepting substantial input: "${currentContent}"`);
        markLocationAsValid(tabType, stateKey, 'Substantial input acceptance', { input: currentContent });
        isLocationValidated = true;
        return true;
      }
    }
    
    return false;
  }
  
  // === METHOD 4: User Interaction Detection ===
  
  const interactionEvents = ['focus', 'click', 'keydown', 'keyup', 'input', 'change'];
  
  interactionEvents.forEach(eventType => {
    element.addEventListener(eventType, (event) => {
      // Mark that user has interacted
      if (!hasUserInteracted && ['keydown', 'input', 'focus'].includes(eventType)) {
        hasUserInteracted = true;
        console.log(`👀 ${displayName} - User interaction detected: ${eventType}`);
      }
      
      // Check for validation after interaction
      if (hasUserInteracted && !isLocationValidated) {
        setTimeout(() => {
          checkGooglePlaceProperty() || performContentValidation();
        }, 100);
        
        setTimeout(() => {
          checkGooglePlaceProperty() || performContentValidation();
        }, 500);
        
        setTimeout(() => {
          checkGooglePlaceProperty() || performContentValidation();
        }, 1000);
      }
    });
  });
  
  // === METHOD 5: Blur Event (Final Validation Attempt) ===
  
  element.addEventListener('blur', () => {
    if (!isLocationValidated && hasUserInteracted) {
      setTimeout(() => {
        const finalContent = getElementContent();
        if (finalContent && finalContent.length >= 3) {
          console.log(`🔄 ${displayName} - Final blur validation: "${finalContent}"`);
          markLocationAsValid(tabType, stateKey, 'Blur final validation', { input: finalContent });
          isLocationValidated = true;
        }
      }, 300);
    }
  });
  
  // === METHOD 6: Periodic Checking (Fallback) ===
  
  let periodicCheckCount = 0;
  const periodicChecker = setInterval(() => {
    periodicCheckCount++;
    
    // Stop checking if validated or after 30 attempts (60 seconds)
    if (isLocationValidated || periodicCheckCount > 30) {
      clearInterval(periodicChecker);
      return;
    }
    
    // Only check if user has interacted
    if (hasUserInteracted) {
      checkGooglePlaceProperty() || performContentValidation();
    }
  }, 2000);
  
  // === METHOD 7: MutationObserver (DOM Changes) ===
  
  if (window.MutationObserver && !isLocationValidated) {
    const observer = new MutationObserver((mutations) => {
      if (hasUserInteracted && !isLocationValidated) {
        setTimeout(() => {
          checkGooglePlaceProperty() || performContentValidation();
        }, 200);
      }
    });
    
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['value', 'class', 'data-place-id']
    });
    
    // Clean up observer after 60 seconds
    setTimeout(() => observer.disconnect(), 60000);
  }
}

// === HELPER FUNCTIONS ===

function markLocationAsValid(tabType, stateKey, validationMethod, placeData) {
  console.log(`🎯 MARKING ${tabType}.${stateKey} as VALID via: ${validationMethod}`);
  
  // Update the form state based on tab type
  if (tabType === 'oneway') {
    if (!formState.oneway) formState.oneway = {};
    formState.oneway[stateKey] = true;
    console.log(`📍 Updated formState.oneway.${stateKey} = true`);
  } else if (tabType === 'experienceplus') {
    if (!formState.experienceplus) formState.experienceplus = {};
    formState.experienceplus[stateKey] = true;
    console.log(`📍 Updated formState.experienceplus.${stateKey} = true`);
  }
  
  // Emit event to trigger form validation update
  emitEvent('form:field-changed', { 
    field: `${tabType}-location-${stateKey}`, 
    method: validationMethod,
    data: placeData 
  });
  
  // Trigger existing validation functions
  setTimeout(() => {
    triggerAllValidationChecks();
  }, 100);
}

function triggerAllValidationChecks() {
  console.log('🔥 Triggering all form validation checks...');
  
  // Call your existing validation functions
  if (typeof checkFormValidity === 'function') {
    checkFormValidity();
  }
  
  if (typeof checkOneWayFormValidity === 'function') {
    checkOneWayFormValidity();
  }
  
  if (typeof checkExperiencePlusFormValidity === 'function') {
    checkExperiencePlusFormValidity();
  }
  
  // Emit general form update event
  emitEvent('form:validation-update', { timestamp: Date.now() });
}

// === DEBUG FUNCTIONS ===

window.debugPlacesValidation = function() {
  const fromLocation = document.getElementById('from-location');
  const toAddress = document.getElementById('to-address');
  const fromLocationExp = document.getElementById('from-location-exp');
  
  console.log('🔍 Google Places Validation Debug:', {
    formState: formState,
    elements: {
      oneWayFrom: {
        element: fromLocation,
        place: fromLocation?.place,
        value: fromLocation?.value,
        content: fromLocation?.textContent,
        valid: formState.oneway?.fromLocation
      },
      oneWayTo: {
        element: toAddress,
        place: toAddress?.place,
        value: toAddress?.value,
        content: toAddress?.textContent,
        valid: formState.oneway?.toAddress
      },
      experienceFrom: {
        element: fromLocationExp,
        place: fromLocationExp?.place,
        value: fromLocationExp?.value,
        content: fromLocationExp?.textContent,
        valid: formState.experienceplus?.fromLocation
      }
    }
  });
  
  return {
    oneWayValid: formState.oneway?.fromLocation && formState.oneway?.toAddress,
    experienceValid: formState.experienceplus?.fromLocation
  };
};

window.testPlaceDetection = function(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    console.log(`Testing ${elementId}:`, {
      place: element.place,
      value: element.value,
      textContent: element.textContent,
      innerHTML: element.innerHTML
    });
  } else {
    console.log(`Element ${elementId} not found`);
  }
};

// Debug the from-location element specifically
const fromElement = document.getElementById('from-location');
console.log('🔍 From Location Debug:', {
  element: fromElement,
  place: fromElement?.place,
  value: fromElement?.value,
  textContent: fromElement?.textContent,
  innerText: fromElement?.innerText,
  innerHTML: fromElement?.innerHTML,
  className: fromElement?.className
});

// Test content detection
const content = fromElement?.value || fromElement?.textContent || fromElement?.innerText || '';
console.log('📝 Content detected:', content);

// Check form state
console.log('📊 Current form state:', window.formState);

// ADD this function right after your existing initializeAutomaticPlacesValidation function

function forceFromLocationValidation() {
  console.log('🔧 Setting up SIMPLE interaction-based validation...');
  
  // Set up simple interaction validation for all Google Places elements
  validateOnInteraction('from-location', 'oneway', 'fromLocation');
  validateOnInteraction('to-address', 'oneway', 'toAddress');
  validateOnInteraction('from-location-exp', 'experienceplus', 'fromLocation');
  
  console.log('✅ Simple validation set up for all elements');
}

// Update this function:

function checkVehicleSelectionVisibility(refs) {
  const result = {
    fromLocation: window.formState.oneway.fromLocation,
    toAddress: window.formState.oneway.toAddress,
    bookingTime: window.formState.oneway.bookingTime,
    shouldShow: window.formState.oneway.fromLocation && window.formState.oneway.toAddress && window.formState.oneway.bookingTime
  };
  
  console.log('🚗 Vehicle selection visibility check:', result);
  
  const vehicleContainer = document.getElementById('vehicle-selection-oneway');
  
  if (vehicleContainer) {
    if (result.shouldShow) {
      // Show with animation
      if (vehicleContainer.classList.contains('hidden')) {
        vehicleContainer.classList.remove('hidden');
        // Small delay to ensure the element is rendered before adding show class
        setTimeout(() => {
          vehicleContainer.classList.add('show');
        }, 50);
      }
      console.log('✅ Vehicle selection shown');
    } else {
      // Hide with animation (only if not already being reset)
      if (!vehicleContainer.classList.contains('hiding') && !vehicleContainer.classList.contains('hidden')) {
        vehicleContainer.classList.remove('show');
        vehicleContainer.classList.add('hiding');
        setTimeout(() => {
          vehicleContainer.classList.add('hidden');
          vehicleContainer.classList.remove('hiding');
        }, 1200);
      }
      console.log('❌ Vehicle selection hidden');
    }
  }
  
  return result;
}

// Add this fallback reset function at the end of the file

// Fallback reset functionality if modules fail
function initializeFallbackReset() {
  const resetButton = document.getElementById('reset-button');
  if (!resetButton) return;
  
  // Remove existing listeners
  resetButton.replaceWith(resetButton.cloneNode(true));
  const newResetButton = document.getElementById('reset-button');
  
  newResetButton.addEventListener('click', () => {
    console.log('🧹 Fallback reset activated');
    
    // Simple form reset
    const form = document.getElementById('booking-form');
    if (form) {
      form.reset();
    }
    
    // Hide vehicle selection
    const vehicleContainer = document.getElementById('vehicle-selection-oneway');
    if (vehicleContainer) {
      vehicleContainer.classList.add('hidden');
      vehicleContainer.classList.remove('show');
    }
    
    // Clear error messages
    document.querySelectorAll('[id$="-error"]').forEach(errorEl => {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
    });
    
    console.log('✅ Fallback reset completed');
  });
}

// Initialize fallback if needed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (!window.dashboardResetInitialized) {
        console.log('🔄 Initializing fallback reset...');
        initializeFallbackReset();
      }
    }, 2000);
  });
} else {
  setTimeout(() => {
    if (!window.dashboardResetInitialized) {
      console.log('🔄 Initializing fallback reset...');
      initializeFallbackReset();
    }
  }, 2000);
}