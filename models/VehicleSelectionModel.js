/**
 * VehicleSelectionModel - Business Logic for Vehicle Selection
 * Handles data management, API calls, and business rules
 */
import { BaseComponent } from '../core/ComponentRegistry.js';
import EventDefinitions from '../core/EventDefinitions.js';

export class VehicleSelectionModel extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.state = {
      vehicles: [],
      selectedVehicleId: null,
      selectedVehicle: null,
      availability: new Map(),
      pricing: new Map(),
      filters: {
        serviceType: null,
        passengerCount: 1,
        location: null
      }
    };
  }
  
  async onInitialize() {
    console.log('🚗 Initializing VehicleSelectionModel');
    
    // Listen for business events
    this.eventBus.on(EventDefinitions.EVENTS.VEHICLE.SELECTION_REQUESTED, 
                     this.handleVehicleSelectionRequest.bind(this));
    this.eventBus.on(EventDefinitions.EVENTS.BOOKING.PREFERENCES_SET, 
                     this.handleBookingPreferencesChange.bind(this));
    this.eventBus.on(EventDefinitions.EVENTS.LOCATION.SELECTED, 
                     this.handleLocationChange.bind(this));
    
    // Load initial data
    await this.loadVehicleData();
  }
  
  /**
   * Load vehicle data from API or configuration
   */
  async loadVehicleData() {
    try {
      console.log('📡 Loading vehicle data...');
      
      // Miami Concierge vehicle configuration
      const vehicles = await this.getMiamiVehicles();
      
      this.state.vehicles = vehicles;
      
      // Emit vehicles loaded event
      this.eventBus.emit(EventDefinitions.EVENTS.VEHICLE.OPTIONS_LOADED, 
        EventDefinitions.createVehiclePayload({
          vehicles: this.state.vehicles,
          source: 'model-initialization'
        })
      );
      
      console.log(`✅ Loaded ${vehicles.length} vehicles`);
      
    } catch (error) {
      this.onError(error, 'vehicle-data-loading');
      
      this.eventBus.emit(EventDefinitions.EVENTS.ERROR.API, {
        service: 'vehicle',
        operation: 'loadVehicles',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Get Miami Concierge vehicle configuration
   */
  async getMiamiVehicles() {
    // This could be an API call in production
    return [
      {
        id: 'standard',
        name: 'Tesla Model Y',
        type: 'Standard',
        description: 'Perfect for 2-4 passengers with premium comfort and eco-friendly luxury.',
        capacity: 4,
        basePrice: 49,
        features: ['Premium Audio', 'Climate Control', 'WiFi', 'Phone Charger'],
        availability: true,
        image: 'images/tesla-model-y.jpg',
        serviceTypes: ['oneway', 'roundtrip', 'hourly']
      },
      {
        id: 'premium',
        name: 'Cadillac Escalade',
        type: 'Premium',
        description: 'Spacious luxury SUV ideal for 4-6 passengers with sophisticated style.',
        capacity: 6,
        basePrice: 89,
        features: ['Leather Seats', 'Premium Audio', 'Bar Service', 'WiFi', 'Climate Zones'],
        availability: true,
        image: 'images/cadillac-escalade.jpg',
        serviceTypes: ['oneway', 'roundtrip', 'hourly']
      },
      {
        id: 'luxury',
        name: 'Mercedes S-Class',
        type: 'Luxury',
        description: 'Ultimate luxury sedan for 2-3 passengers seeking the finest experience.',
        capacity: 3,
        basePrice: 129,
        features: ['Massage Seats', 'Champagne Service', 'Premium Audio', 'Privacy Glass'],
        availability: true,
        image: 'images/mercedes-s-class.jpg',
        serviceTypes: ['oneway', 'roundtrip', 'hourly']
      },
      {
        id: 'suv',
        name: 'Mercedes Sprinter',
        type: 'Group SUV',
        description: 'Perfect for groups of 6-12 passengers with ample luggage space.',
        capacity: 12,
        basePrice: 149,
        features: ['Group Seating', 'Luggage Space', 'Entertainment System', 'WiFi'],
        availability: true,
        image: 'images/mercedes-sprinter.jpg',
        serviceTypes: ['oneway', 'roundtrip', 'hourly', 'group']
      }
    ];
  }
  
  /**
   * Handle vehicle selection request from UI
   */
  handleVehicleSelectionRequest(data) {
    const { vehicleId, source = 'user' } = data;
    
    console.log(`🎯 Processing vehicle selection: ${vehicleId} from ${source}`);
    
    const vehicle = this.state.vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) {
      this.eventBus.emit(EventDefinitions.EVENTS.ERROR.VALIDATION, {
        field: 'vehicle-selection',
        message: `Vehicle ${vehicleId} not found`,
        severity: 'error'
      });
      return;
    }
    
    // Check availability for current context
    if (!this.isVehicleAvailable(vehicle)) {
      this.eventBus.emit(EventDefinitions.EVENTS.ERROR.VALIDATION, {
        field: 'vehicle-selection',
        message: `${vehicle.name} is not available for your selected options`,
        severity: 'warning'
      });
      return;
    }
    
    // Update state
    this.state.selectedVehicleId = vehicleId;
    this.state.selectedVehicle = vehicle;
    
    // Emit selection confirmed
    this.eventBus.emit(EventDefinitions.EVENTS.VEHICLE.SELECTED, 
      EventDefinitions.createVehiclePayload({
        vehicleId,
        vehicle,
        source,
        previousSelection: this.state.selectedVehicleId
      })
    );
    
    // Trigger dependent business processes
    this.calculatePricing(vehicle);
    this.validateSelection(vehicle);
  }
  
  /**
   * Calculate pricing based on vehicle and booking context
   */
  calculatePricing(vehicle) {
    const bookingContext = this.getBookingContext();
    
    let totalPrice = vehicle.basePrice;
    let multiplier = 1;
    let surcharges = [];
    
    // Apply service type multiplier
    switch (bookingContext.serviceType) {
      case 'hourly':
        multiplier = bookingContext.hours || 2;
        break;
      case 'roundtrip':
        multiplier = 2;
        break;
      case 'airport':
        // Airport surcharge
        surcharges.push({ name: 'Airport Fee', amount: 15 });
        break;
    }
    
    // Apply time-based surcharges
    if (bookingContext.isNightTime) {
      surcharges.push({ name: 'Night Surcharge', amount: 20 });
    }
    
    // Apply distance-based pricing if available
    if (bookingContext.distance) {
      const distanceFee = Math.max(0, (bookingContext.distance - 10) * 2);
      if (distanceFee > 0) {
        surcharges.push({ name: 'Distance Fee', amount: distanceFee });
      }
    }
    
    const surchargeTotal = surcharges.reduce((sum, charge) => sum + charge.amount, 0);
    totalPrice = (vehicle.basePrice * multiplier) + surchargeTotal;
    
    const pricingData = {
      vehicleId: vehicle.id,
      basePrice: vehicle.basePrice,
      multiplier,
      surcharges,
      surchargeTotal,
      totalPrice,
      context: bookingContext
    };
    
    // Store in state
    this.state.pricing.set(vehicle.id, pricingData);
    
    // Emit pricing calculated event
    this.eventBus.emit(EventDefinitions.EVENTS.VEHICLE.PRICE_CALCULATED, 
      EventDefinitions.createVehiclePayload(pricingData)
    );
  }
  
  /**
   * Check if vehicle is available for current booking context
   */
  isVehicleAvailable(vehicle) {
    const context = this.getBookingContext();
    
    // Check service type compatibility
    if (context.serviceType && !vehicle.serviceTypes.includes(context.serviceType)) {
      return false;
    }
    
    // Check passenger capacity
    if (context.passengerCount > vehicle.capacity) {
      return false;
    }
    
    // Check vehicle-specific availability
    return vehicle.availability;
  }
  
  /**
   * Get current booking context from other components
   */
  getBookingContext() {
    return {
      serviceType: this.state.filters.serviceType,
      passengerCount: this.state.filters.passengerCount,
      location: this.state.filters.location,
      hours: 2, // Default or from booking form
      isNightTime: false, // Calculate based on booking time
      distance: null // From location service
    };
  }
  
  /**
   * Handle booking preferences change
   */
  handleBookingPreferencesChange(data) {
    const { preferences } = data;
    
    Object.assign(this.state.filters, preferences);
    
    // Re-validate current selection if any
    if (this.state.selectedVehicle) {
      if (!this.isVehicleAvailable(this.state.selectedVehicle)) {
        this.clearSelection('preference-change');
      } else {
        this.calculatePricing(this.state.selectedVehicle);
      }
    }
    
    // Emit availability update
    this.emitAvailabilityUpdate();
  }
  
  /**
   * Handle location change
   */
  handleLocationChange(data) {
    this.state.filters.location = data.location;
    
    // Recalculate pricing if vehicle is selected
    if (this.state.selectedVehicle) {
      this.calculatePricing(this.state.selectedVehicle);
    }
  }
  
  /**
   * Clear current selection
   */
  clearSelection(reason = 'manual') {
    const previousVehicle = this.state.selectedVehicle;
    
    this.state.selectedVehicleId = null;
    this.state.selectedVehicle = null;
    
    this.eventBus.emit(EventDefinitions.EVENTS.VEHICLE.DESELECTED, {
      previousVehicle,
      reason,
      timestamp: Date.now()
    });
  }
  
  /**
   * Emit vehicle availability update
   */
  emitAvailabilityUpdate() {
    const availableVehicles = this.state.vehicles.filter(v => this.isVehicleAvailable(v));
    
    this.eventBus.emit(EventDefinitions.EVENTS.VEHICLE.AVAILABILITY_CHECKED, {
      totalVehicles: this.state.vehicles.length,
      availableVehicles: availableVehicles.length,
      availableVehicleIds: availableVehicles.map(v => v.id),
      filters: { ...this.state.filters }
    });
  }
  
  /**
   * Validate current selection
   */
  validateSelection(vehicle) {
    const isValid = this.isVehicleAvailable(vehicle);
    
    this.eventBus.emit(EventDefinitions.EVENTS.VEHICLE.CAPACITY_VALIDATED, {
      vehicleId: vehicle.id,
      isValid,
      capacity: vehicle.capacity,
      requiredCapacity: this.state.filters.passengerCount
    });
  }
  
  /**
   * Get current state for external access
   */
  getState() {
    return {
      vehicles: [...this.state.vehicles],
      selectedVehicle: this.state.selectedVehicle,
      selectedVehicleId: this.state.selectedVehicleId,
      filters: { ...this.state.filters },
      pricing: Object.fromEntries(this.state.pricing)
    };
  }
}

export default VehicleSelectionModel;