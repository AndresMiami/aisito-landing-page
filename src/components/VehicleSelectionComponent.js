/**
 * VehicleSelectionComponent - Integrates the VehicleSelector with our EventBus architecture
 * Handles vehicle selection and communicates with other components via events
 */
import eventBus from '../core/EventBus.js';
import { VehicleSelector } from './vehicle-selector/vehicle-selector.js';

export class VehicleSelectionComponent {
  constructor(config = {}) {
    // Default configuration
    this.config = {
      containerIds: {
        oneway: 'vehicle-selection-oneway',
        roundtrip: 'vehicle-selection-roundtrip',
        hourly: 'vehicle-selection-hourly'
      },
      vehicleTypes: {
        standard: { id: 'standard', price: 49 },
        premium: { id: 'premium', price: 89 },
        luxury: { id: 'luxury', price: 129 },
        suv: { id: 'suv', price: 149 }
      },
      ...config
    };
    
    // State
    this.state = {
      currentTab: 'oneway',
      selectedVehicles: {},
      isInitialized: false
    };
    
    // Component references
    this.selectors = {};
    
    // Bind methods to preserve context
    this.handleVehicleSelection = this.handleVehicleSelection.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.handleExperienceChange = this.handleExperienceChange.bind(this);
    
    // Event subscriptions
    this.unsubscribers = [];
  }
  
  /**
   * Initialize the component - called by the module loader
   */
  init() {
    console.log('Initializing VehicleSelectionComponent');
    
    // Initialize selectors for each container
    for (const [key, id] of Object.entries(this.config.containerIds)) {
      const container = document.getElementById(id);
      
      if (container) {
        this.selectors[key] = new VehicleSelector(container, {
          multiSelect: false,
          animateSelection: true,
          onSelectionChange: (selected) => this.handleVehicleSelection(key, selected)
        });
        
        this.selectors[key].init();
      }
    }
    
    // Subscribe to events
    this.unsubscribers.push(
      eventBus.subscribe('tabs.change', this.handleTabChange),
      eventBus.subscribe('experience.selected', this.handleExperienceChange),
      eventBus.subscribe('form.locationChange', this.updateVehicleAvailability.bind(this))
    );
    
    // Mark as initialized
    this.state.isInitialized = true;
    
    return this;
  }
  
  /**
   * Clean up resources when the component is destroyed
   */
  destroy() {
    // Unsubscribe from all events
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    
    // Clean up selector instances
    for (const selector of Object.values(this.selectors)) {
      if (selector && typeof selector.destroy === 'function') {
        selector.destroy();
      }
    }
  }
  
  /**
   * Handle vehicle selection changes
   * @param {string} selectorType - The type of selector (oneway, roundtrip, hourly)
   * @param {Array} selectedVehicles - Array of selected vehicle elements
   */
  handleVehicleSelection(selectorType, selectedVehicles) {
    if (!selectedVehicles || selectedVehicles.length === 0) {
      delete this.state.selectedVehicles[selectorType];
    } else {
      const vehicle = selectedVehicles[0];
      const vehicleId = vehicle.getAttribute('data-vehicle-id') || vehicle.id;
      const vehicleType = this.config.vehicleTypes[vehicleId] || { id: vehicleId };
      
      this.state.selectedVehicles[selectorType] = {
        id: vehicleId,
        element: vehicle,
        type: vehicleType
      };
    }
    
    // Publish event
    eventBus.publish('vehicle.selected', {
      selectorType,
      selectedVehicle: this.state.selectedVehicles[selectorType],
      allSelections: { ...this.state.selectedVehicles }
    });
  }
  
  /**
   * Handle tab changes to update which vehicle selector is active
   * @param {Object} data - Tab change event data
   */
  handleTabChange(data) {
    const tabId = data.tabId;
    
    // Map tab IDs to selector types
    const tabToSelector = {
      'tab-button-one-way': 'oneway',
      'tab-button-roundtrip': 'roundtrip',
      'tab-button-experience-plus': 'hourly'
    };
    
    const selectorType = tabToSelector[tabId];
    if (selectorType) {
      this.state.currentTab = selectorType;
    }
  }
  
  /**
   * Handle experience changes to update vehicle availability
   * @param {Object} data - Experience change event data
   */
  handleExperienceChange(data) {
    const experienceValue = data.value;
    
    // Different experiences may have different vehicle requirements
    // For example, hourly chauffeur might only offer premium and luxury vehicles
    switch (experienceValue) {
      case 'hourly_chauffeur':
        this.updateAvailableVehicles(['premium', 'luxury'], 'hourly');
        break;
      case 'water_sky':
        // Water experiences don't need vehicles
        break;
      case 'airport_transfer':
        // All vehicles available for airport transfers
        this.updateAvailableVehicles(['standard', 'premium', 'luxury', 'suv'], 'oneway');
        break;
      default:
        // Default to all vehicles
        this.updateAvailableVehicles(['standard', 'premium', 'luxury', 'suv'], this.state.currentTab);
    }
  }
  
  /**
   * Update which vehicles are available based on the selected experience
   * @param {Array<string>} availableTypes - Array of vehicle type IDs
   * @param {string} selectorType - The type of selector to update
   */
  updateAvailableVehicles(availableTypes, selectorType) {
    const selector = this.selectors[selectorType];
    if (!selector) return;
    
    // Get all vehicle cards
    const vehicles = selector.getVehicles();
    
    vehicles.forEach(vehicle => {
      const vehicleId = vehicle.getAttribute('data-vehicle-id') || vehicle.id;
      
      if (availableTypes.includes(vehicleId)) {
        // Vehicle is available
        vehicle.classList.remove('vehicle-card--disabled');
        vehicle.removeAttribute('aria-disabled');
      } else {
        // Vehicle is not available
        vehicle.classList.add('vehicle-card--disabled');
        vehicle.setAttribute('aria-disabled', 'true');
      }
    });
  }
  
  /**
   * Update vehicle availability based on location
   * Some vehicles might not be available in certain areas
   * @param {Object} data - Location change event data
   */
  updateVehicleAvailability(data) {
    // This would typically involve an API call to check availability
    // For now, we'll just log the event
    console.log('Updating vehicle availability based on location:', data);
    
    // Publish a vehicle availability update event
    eventBus.publish('vehicle.availabilityUpdated', {
      location: data.location,
      availableVehicles: ['standard', 'premium', 'luxury', 'suv'] // Example
    });
  }
}

export default VehicleSelectionComponent;
