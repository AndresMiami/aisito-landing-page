/**
 * FormValidationManager.js - Enhanced Form Validation for Miami AI Concierge
 * 
 * Integrates with LocationAutocompleteComponent and existing components
 * to provide comprehensive form validation and trip calculation
 */

import EventDefinitions from './EventDefinitions.js';
import DOMManager from './DOMManager.js';

class FormValidationManager {
    constructor(eventBus, config = {}) {
        this.eventBus = eventBus;
        this.config = {
            baseFare: 15.00,
            pricePerKm: 2.50,
            pricePerMinute: 0.50,
            vehicleMultipliers: {
                'luxury-sedan': 1.0,
                'premium-suv': 1.3,
                'vip-sprinter': 1.8
            },
            ...config
        };
        
        // Validation state
        this.validationState = {
            oneway: {
                pickupLocation: { isValid: false, data: null },
                dropoffLocation: { isValid: false, data: null },
                vehicleType: { isValid: false, data: null },
                timing: { isValid: true, data: 'now' }, // Default to now
                dateTime: { isValid: true, data: null }
            },
            experiencePlus: {
                location: { isValid: false, data: null },
                experienceType: { isValid: false, data: null },
                dateTime: { isValid: false, data: null }
            },
            yachts: {
                date: { isValid: false, data: null },
                guests: { isValid: true, data: { adults: 2, children: 0, infants: 0 } }
            }
        };
        
        // Trip calculation data
        this.tripData = {
            distance: null,
            duration: null,
            route: null,
            pricing: null
        };
        
        // Current active tab
        this.activeTab = 'oneway';
        
        // Google Maps services
        this.directionsService = null;
        this.directionsRenderer = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔄 Initializing FormValidationManager');
        
        // Wait for Google Maps API
        await this.waitForGoogleMaps();
        
        // Initialize Google Maps services
        this.initializeGoogleMapsServices();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize form state
        this.initializeFormState();
        
        console.log('✅ FormValidationManager initialized');
        
        // Emit initialization event
        this.eventBus.emit(EventDefinitions.EVENTS.SYSTEM.COMPONENT_INITIALIZED, {
            componentId: 'FormValidationManager',
            timestamp: Date.now()
        });
    }
    
    async waitForGoogleMaps() {
        return new Promise((resolve) => {
            const checkGoogleMaps = () => {
                if (window.google && window.google.maps && window.google.maps.DirectionsService) {
                    resolve();
                } else {
                    setTimeout(checkGoogleMaps, 100);
                }
            };
            checkGoogleMaps();
        });
    }
    
    initializeGoogleMapsServices() {
        try {
            this.directionsService = new google.maps.DirectionsService();
            this.directionsRenderer = new google.maps.DirectionsRenderer();
            console.log('✅ Google Maps services initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Google Maps services:', error);
        }
    }
    
    setupEventListeners() {
        // Location selection events from LocationAutocompleteComponent
        this.eventBus.on(EventDefinitions.EVENTS.LOCATION.SELECTED, (data) => {
            this.handleLocationSelected(data);
        });
        
        this.eventBus.on(EventDefinitions.EVENTS.LOCATION.CLEARED, (data) => {
            this.handleLocationCleared(data);
        });
        
        // Vehicle selection events
        this.eventBus.on(EventDefinitions.EVENTS.VEHICLE.SELECTED, (data) => {
            this.handleVehicleSelected(data);
        });
        
        // Tab change events
        this.eventBus.on(EventDefinitions.EVENTS.UI.TAB_CHANGED, (data) => {
            this.handleTabChanged(data);
        });
        
        // Experience selection events
        this.eventBus.on(EventDefinitions.EVENTS.BOOKING.EXPERIENCE_SELECTED, (data) => {
            this.handleExperienceSelected(data);
        });
        
        // Date/time selection events
        this.eventBus.on('BOOKING_TIME_SELECTED', (data) => {
            this.handleDateTimeSelected(data);
        });
        
        // Yacht date/guest events
        this.eventBus.on(EventDefinitions.EVENTS.YACHT.DATE_SELECTED, (data) => {
            this.handleYachtDateSelected(data);
        });
        
        this.eventBus.on(EventDefinitions.EVENTS.YACHT.GUEST_UPDATED, (data) => {
            this.handleYachtGuestUpdated(data);
        });
    }
    
    initializeFormState() {
        // Get current active tab
        const activeTabElement = DOMManager.querySelector('.tab-button.active, .tab-button[aria-selected="true"]');
        if (activeTabElement) {
            const tabId = activeTabElement.id.replace('tab-button-', '');
            this.activeTab = tabId;
        }
        
        // Initialize continue button state
        this.updateContinueButton();
        
        console.log('📋 Form state initialized for tab:', this.activeTab);
    }
    
    handleLocationSelected(data) {
        console.log('📍 Location selected:', data);
        
        const { inputId, place } = data;
        
        // Map input IDs to validation keys
        const locationMapping = {
            'from-location': { tab: 'oneway', key: 'pickupLocation' },
            'to-address': { tab: 'oneway', key: 'dropoffLocation' },
            'from-location-exp': { tab: 'experiencePlus', key: 'location' }
        };
        
        const mapping = locationMapping[inputId];
        if (!mapping) {
            console.warn('Unknown input ID for location validation:', inputId);
            return;
        }
        
        // Update validation state
        this.validationState[mapping.tab][mapping.key] = {
            isValid: true,
            data: place
        };
        
        // Emit field validation event
        this.eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_VALIDATED, {
            fieldId: inputId,
            isValid: true,
            value: place.formatted_address,
            place: place
        });
        
        // Check if we can calculate trip (for oneway tab)
        if (mapping.tab === 'oneway') {
            this.checkTripCalculation();
        }
        
        // Update form validation
        this.validateCurrentTab();
    }
    
    handleLocationCleared(data) {
        console.log('🗑️ Location cleared:', data);
        
        const { inputId } = data;
        
        const locationMapping = {
            'from-location': { tab: 'oneway', key: 'pickupLocation' },
            'to-address': { tab: 'oneway', key: 'dropoffLocation' },
            'from-location-exp': { tab: 'experiencePlus', key: 'location' }
        };
        
        const mapping = locationMapping[inputId];
        if (!mapping) return;
        
        // Update validation state
        this.validationState[mapping.tab][mapping.key] = {
            isValid: false,
            data: null
        };
        
        // Clear trip data if needed
        if (mapping.tab === 'oneway') {
            this.tripData = {
                distance: null,
                duration: null,
                route: null,
                pricing: null
            };
        }
        
        // Emit field validation event
        this.eventBus.emit(EventDefinitions.EVENTS.FORM.FIELD_VALIDATED, {
            fieldId: inputId,
            isValid: false,
            value: ''
        });
        
        // Update form validation
        this.validateCurrentTab();
    }
    
    handleVehicleSelected(data) {
        console.log('🚗 Vehicle selected:', data);
        
        const { vehicleType, vehicleData } = data;
        
        // Update validation state
        this.validationState.oneway.vehicleType = {
            isValid: true,
            data: { type: vehicleType, ...vehicleData }
        };
        
        // Recalculate pricing if trip data exists
        if (this.tripData.distance && this.tripData.duration) {
            this.calculatePricing();
        }
        
        // Update form validation
        this.validateCurrentTab();
    }
    
    handleTabChanged(data) {
        console.log('📑 Tab changed:', data);
        
        this.activeTab = data.tabId || data.activeTab;
        this.validateCurrentTab();
    }
    
    handleExperienceSelected(data) {
        console.log('🎯 Experience selected:', data);
        
        this.validationState.experiencePlus.experienceType = {
            isValid: true,
            data: data
        };
        
        this.validateCurrentTab();
    }
    
    handleDateTimeSelected(data) {
        console.log('📅 Date/time selected:', data);
        
        if (this.activeTab === 'oneway') {
            this.validationState.oneway.timing = {
                isValid: true,
                data: data.preference
            };
            
            if (data.preference === 'later') {
                this.validationState.oneway.dateTime = {
                    isValid: !!(data.date && data.time),
                    data: data
                };
            }
        } else if (this.activeTab === 'experiencePlus') {
            this.validationState.experiencePlus.dateTime = {
                isValid: !!(data.date || data.preference === 'flexible'),
                data: data
            };
        }
        
        this.validateCurrentTab();
    }
    
    handleYachtDateSelected(data) {
        console.log('⛵ Yacht date selected:', data);
        
        this.validationState.yachts.date = {
            isValid: !!data.date,
            data: data
        };
        
        this.validateCurrentTab();
    }
    
    handleYachtGuestUpdated(data) {
        console.log('👥 Yacht guests updated:', data);
        
        this.validationState.yachts.guests = {
            isValid: true,
            data: data
        };
        
        this.validateCurrentTab();
    }
    
    async checkTripCalculation() {
        const pickupLocation = this.validationState.oneway.pickupLocation;
        const dropoffLocation = this.validationState.oneway.dropoffLocation;
        
        if (!pickupLocation.isValid || !dropoffLocation.isValid) {
            return;
        }
        
        console.log('🗺️ Calculating trip route...');
        
        try {
            const route = await this.calculateRoute(
                pickupLocation.data.coordinates,
                dropoffLocation.data.coordinates
            );
            
            if (route) {
                this.tripData.route = route;
                this.tripData.distance = route.distance.value / 1000; // Convert to km
                this.tripData.duration = route.duration.value / 60; // Convert to minutes
                
                // Calculate pricing
                this.calculatePricing();
                
                // Emit trip summary ready event
                this.eventBus.emit(EventDefinitions.EVENTS.BOOKING.PRICE_CALCULATED, {
                    tripData: this.tripData,
                    pickupLocation: pickupLocation.data,
                    dropoffLocation: dropoffLocation.data
                });
                
                console.log('✅ Trip calculation completed:', this.tripData);
            }
            
        } catch (error) {
            console.error('❌ Trip calculation failed:', error);
            
            this.eventBus.emit(EventDefinitions.EVENTS.ERROR.SHOW, {
                fieldId: 'trip-calculation',
                message: 'Unable to calculate trip route. Please check your locations.'
            });
        }
    }
    
    async calculateRoute(origin, destination) {
        return new Promise((resolve, reject) => {
            if (!this.directionsService) {
                reject(new Error('Directions service not available'));
                return;
            }
            
            const request = {
                origin: new google.maps.LatLng(origin.lat, origin.lng),
                destination: new google.maps.LatLng(destination.lat, destination.lng),
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false
            };
            
            this.directionsService.route(request, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    const route = result.routes[0].legs[0];
                    resolve(route);
                } else {
                    reject(new Error(`Directions request failed: ${status}`));
                }
            });
        });
    }
    
    calculatePricing() {
        if (!this.tripData.distance || !this.tripData.duration) {
            return;
        }
        
        const vehicleType = this.validationState.oneway.vehicleType.data?.type || 'luxury-sedan';
        const multiplier = this.config.vehicleMultipliers[vehicleType] || 1.0;
        
        // Base calculation
        let price = this.config.baseFare + 
                   (this.tripData.distance * this.config.pricePerKm) + 
                   (this.tripData.duration * this.config.pricePerMinute);
        
        // Apply vehicle multiplier
        price *= multiplier;
        
        // Round to 2 decimal places
        price = Math.round(price * 100) / 100;
        
        this.tripData.pricing = {
            basePrice: price,
            vehicleMultiplier: multiplier,
            vehicleType: vehicleType,
            breakdown: {
                baseFare: this.config.baseFare,
                distanceCost: this.tripData.distance * this.config.pricePerKm,
                timeCost: this.tripData.duration * this.config.pricePerMinute
            }
        };
        
        console.log('💰 Pricing calculated:', this.tripData.pricing);
        
        // Emit pricing update event
        this.eventBus.emit(EventDefinitions.EVENTS.BOOKING.PRICE_CALCULATED, {
            pricing: this.tripData.pricing,
            tripData: this.tripData
        });
    }
    
    validateCurrentTab() {
        const isValid = this.isTabValid(this.activeTab);
        
        // Update continue button
        this.updateContinueButton(isValid);
        
        // Emit validation event
        this.eventBus.emit(EventDefinitions.EVENTS.FORM.VALIDATED, {
            tabId: this.activeTab,
            isValid: isValid,
            validationState: this.validationState[this.activeTab]
        });
        
        return isValid;
    }
    
    isTabValid(tabId) {
        const tabState = this.validationState[tabId];
        if (!tabState) return false;
        
        switch (tabId) {
            case 'oneway':
                return this.isOnewayTabValid(tabState);
            case 'experience-plus':
                return this.isExperienceTabValid(tabState);
            case 'yachts':
                return this.isYachtsTabValid(tabState);
            default:
                return false;
        }
    }
    
    isOnewayTabValid(state) {
        // Required: pickup location, dropoff location, vehicle type
        const hasLocations = state.pickupLocation.isValid && state.dropoffLocation.isValid;
        const hasVehicle = state.vehicleType.isValid;
        
        // If booking for later, need date/time
        let hasDateTime = true;
        if (state.timing.data === 'later') {
            hasDateTime = state.dateTime.isValid;
        }
        
        return hasLocations && hasVehicle && hasDateTime;
    }
    
    isExperienceTabValid(state) {
        // Required: location, experience type, date/time
        return state.location.isValid && 
               state.experienceType.isValid && 
               state.dateTime.isValid;
    }
    
    isYachtsTabValid(state) {
        // Required: date, guests (guests always valid with defaults)
        return state.date.isValid && state.guests.isValid;
    }
    
    updateContinueButton(isValid = null) {
        if (isValid === null) {
            isValid = this.isTabValid(this.activeTab);
        }
        
        const continueButton = DOMManager.getElementById('submit-button');
        if (!continueButton) {
            console.warn('Continue button not found');
            return;
        }
        
        if (isValid) {
            DOMManager.removeAttribute(continueButton, 'disabled');
            DOMManager.removeClass(continueButton, 'opacity-50');
            DOMManager.addClass(continueButton, 'hover:shadow-lg');
        } else {
            DOMManager.setAttribute(continueButton, 'disabled', 'true');
            DOMManager.addClass(continueButton, 'opacity-50');
            DOMManager.removeClass(continueButton, 'hover:shadow-lg');
        }
        
        // Update button text based on tab
        this.updateContinueButtonText();
    }
    
    updateContinueButtonText() {
        const continueButton = DOMManager.getElementById('submit-button');
        if (!continueButton) return;
        
        const buttonText = continueButton.querySelector('.button-text');
        if (!buttonText) return;
        
        let text = 'Continue';
        
        switch (this.activeTab) {
            case 'oneway':
                if (this.tripData.pricing) {
                    text = `Continue - $${this.tripData.pricing.basePrice}`;
                } else {
                    text = 'Continue';
                }
                break;
            case 'experience-plus':
                text = 'Book Experience';
                break;
            case 'yachts':
                text = 'Book Yacht';
                break;
        }
        
        DOMManager.setTextContent(buttonText, text);
    }
    
    // Public API methods
    getValidationState(tabId = null) {
        if (tabId) {
            return this.validationState[tabId];
        }
        return this.validationState;
    }
    
    getTripData() {
        return this.tripData;
    }
    
    isFormValid(tabId = null) {
        const targetTab = tabId || this.activeTab;
        return this.isTabValid(targetTab);
    }
    
    resetValidation(tabId = null) {
        if (tabId) {
            // Reset specific tab
            const defaultState = this.getDefaultTabState(tabId);
            this.validationState[tabId] = defaultState;
        } else {
            // Reset all tabs
            this.validationState = this.getDefaultValidationState();
            this.tripData = {
                distance: null,
                duration: null,
                route: null,
                pricing: null
            };
        }
        
        this.validateCurrentTab();
        
        console.log('🔄 Validation state reset for:', tabId || 'all tabs');
    }
    
    getDefaultValidationState() {
        return {
            oneway: {
                pickupLocation: { isValid: false, data: null },
                dropoffLocation: { isValid: false, data: null },
                vehicleType: { isValid: false, data: null },
                timing: { isValid: true, data: 'now' },
                dateTime: { isValid: true, data: null }
            },
            experiencePlus: {
                location: { isValid: false, data: null },
                experienceType: { isValid: false, data: null },
                dateTime: { isValid: false, data: null }
            },
            yachts: {
                date: { isValid: false, data: null },
                guests: { isValid: true, data: { adults: 2, children: 0, infants: 0 } }
            }
        };
    }
    
    getDefaultTabState(tabId) {
        const defaultStates = this.getDefaultValidationState();
        return defaultStates[tabId] || {};
    }
}

export default FormValidationManager;

// Also make available globally for debugging
if (typeof window !== 'undefined') {
    window.FormValidationManager = FormValidationManager;
}

console.log('📋 FormValidationManager module loaded successfully');