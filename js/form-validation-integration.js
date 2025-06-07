/**
 * Form Validation Integration Script
 * Connects LocationAutocompleteComponent with FormValidationManager
 */

import FormValidationManager from '../core/FormValidationManager.js';
import LocationAutocompleteComponent from '../components/LocationAutocompleteComponent.js';

// Initialize form validation when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for EventBus to be available
    if (!window.eventBus) {
        console.error('EventBus not available for form validation integration');
        return;
    }
    
    console.log('🔄 Initializing form validation integration...');
    
    try {
        // Initialize FormValidationManager
        const formValidationManager = new FormValidationManager(window.eventBus);
        
        // Make available globally for debugging
        window.formValidationManager = formValidationManager;
        
        // Initialize LocationAutocompleteComponents for each input
        const locationInputs = [
            {
                inputId: 'from-location',
                placeholder: 'Enter pickup location...',
                componentId: 'pickup-location-autocomplete'
            },
            {
                inputId: 'to-address',
                placeholder: 'Enter destination...',
                componentId: 'destination-location-autocomplete'
            },
            {
                inputId: 'from-location-exp',
                placeholder: 'Enter experience location...',
                componentId: 'experience-location-autocomplete'
            }
        ];
        
        // Initialize each location autocomplete component
        const locationComponents = [];
        
        for (const inputConfig of locationInputs) {
            const input = document.getElementById(inputConfig.inputId);
            if (input) {
                console.log(`🏢 Initializing LocationAutocompleteComponent for ${inputConfig.inputId}`);
                
                const component = new LocationAutocompleteComponent({
                    componentId: inputConfig.componentId,
                    inputId: inputConfig.inputId,
                    placeholder: inputConfig.placeholder,
                    eventBus: window.eventBus,
                    options: {
                        debounceDelay: 300,
                        maxSuggestions: 8,
                        minQueryLength: 2,
                        showCurrentLocation: true
                    }
                });
                
                // Initialize the component
                const success = await component.onInitialize();
                if (success) {
                    locationComponents.push(component);
                    console.log(`✅ LocationAutocompleteComponent initialized for ${inputConfig.inputId}`);
                } else {
                    console.error(`❌ Failed to initialize LocationAutocompleteComponent for ${inputConfig.inputId}`);
                }
            } else {
                console.warn(`Input element not found: ${inputConfig.inputId}`);
            }
        }
        
        // Store component references globally
        window.locationAutocompleteComponents = locationComponents;
        
        // Setup vehicle selection integration
        setupVehicleSelectionIntegration();
        
        // Setup booking timing integration
        setupBookingTimingIntegration();
        
        // Setup tab change integration
        setupTabChangeIntegration();
        
        console.log('✅ Form validation integration completed successfully');
        
        // Emit integration ready event
        window.eventBus.emit('FORM_VALIDATION_INTEGRATION_READY', {
            timestamp: Date.now(),
            componentsInitialized: locationComponents.length
        });
        
    } catch (error) {
        console.error('❌ Form validation integration failed:', error);
        
        // Emit error event
        if (window.eventBus) {
            window.eventBus.emit('FORM_VALIDATION_INTEGRATION_ERROR', {
                error: error.message,
                timestamp: Date.now()
            });
        }
    }
});

function setupVehicleSelectionIntegration() {
    // Listen for vehicle selection changes
    const vehicleInputs = document.querySelectorAll('input[name^="vehicle_type_"]');
    
    vehicleInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            if (event.target.checked) {
                const vehicleType = event.target.value;
                const vehicleCard = event.target.closest('.vehicle-card');
                const vehicleData = {
                    name: vehicleCard?.querySelector('.text-base.font-medium')?.textContent || vehicleType,
                    capacity: vehicleCard?.querySelector('.text-xs')?.textContent || '',
                    features: Array.from(vehicleCard?.querySelectorAll('.text-xs') || [])
                        .map(el => el.textContent).slice(1) // Skip capacity
                };
                
                window.eventBus.emit('vehicle:selected', {
                    vehicleType: vehicleType,
                    vehicleData: vehicleData,
                    inputElement: event.target
                });
                
                console.log('🚗 Vehicle selected via integration:', vehicleType);
            }
        });
    });
}

function setupBookingTimingIntegration() {
    // Listen for booking timing changes
    const timingButtons = document.querySelectorAll('.booking-time-button');
    
    timingButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const preference = event.target.closest('[data-preference]')?.dataset.preference;
            if (preference) {
                const timingData = {
                    preference: preference,
                    timestamp: Date.now()
                };
                
                // If "later" is selected, also get date/time values
                if (preference === 'later') {
                    const dateInput = document.getElementById('pickup-date-oneway');
                    const timeInput = document.getElementById('pickup-time-oneway');
                    
                    timingData.date = dateInput?.value || null;
                    timingData.time = timeInput?.value || null;
                }
                
                window.eventBus.emit('BOOKING_TIME_SELECTED', timingData);
                
                console.log('⏰ Booking timing selected via integration:', timingData);
            }
        });
    });
    
    // Listen for date/time input changes
    const dateInput = document.getElementById('pickup-date-oneway');
    const timeInput = document.getElementById('pickup-time-oneway');
    
    if (dateInput) {
        dateInput.addEventListener('change', () => {
            checkScheduledBookingData();
        });
    }
    
    if (timeInput) {
        timeInput.addEventListener('change', () => {
            checkScheduledBookingData();
        });
    }
}

function checkScheduledBookingData() {
    const dateInput = document.getElementById('pickup-date-oneway');
    const timeInput = document.getElementById('pickup-time-oneway');
    
    if (dateInput && timeInput && dateInput.value && timeInput.value) {
        window.eventBus.emit('BOOKING_TIME_SELECTED', {
            preference: 'later',
            date: dateInput.value,
            time: timeInput.value,
            timestamp: Date.now()
        });
    }
}

function setupTabChangeIntegration() {
    // Listen for tab changes
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const tabId = event.target.id.replace('tab-button-', '');
            
            window.eventBus.emit('ui:tab:changed', {
                tabId: tabId,
                activeTab: tabId,
                timestamp: Date.now()
            });
            
            console.log('📑 Tab changed via integration:', tabId);
        });
    });
}

// Utility function to manually trigger validation
window.triggerFormValidation = function() {
    if (window.formValidationManager) {
        window.formValidationManager.validateCurrentTab();
        console.log('🔄 Manual form validation triggered');
    } else {
        console.warn('FormValidationManager not available');
    }
};

// Utility function to get current form state
window.getFormValidationState = function() {
    if (window.formValidationManager) {
        return window.formValidationManager.getValidationState();
    }
    return null;
};

// Export for module usage
export { FormValidationManager };