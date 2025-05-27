/**
 * VehicleService - API service for vehicle-related operations
 * Handles all external API communications for vehicle data
 */
import EventDefinitions from '../core/EventDefinitions.js';

class VehicleService {
  constructor() {
    this.baseUrl = '/api/vehicles';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  /**
   * Get available vehicles
   */
  async getVehicles(filters = {}) {
    const cacheKey = JSON.stringify(filters);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }
    
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`${this.baseUrl}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const vehicles = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: vehicles,
        timestamp: Date.now()
      });
      
      return vehicles;
      
    } catch (error) {
      console.error('VehicleService: Failed to fetch vehicles:', error);
      
      // Emit error event
      if (window.eventBus) {
        window.eventBus.emit(EventDefinitions.EVENTS.ERROR.API, {
          service: 'vehicle',
          operation: 'getVehicles',
          error: error.message,
          filters
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Check vehicle availability
   */
  async checkAvailability(vehicleId, context = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/${vehicleId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(context)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // AFTER: Standardized vehicle events
      eventBus.emit(EventDefinitions.EVENTS.VEHICLE.AVAILABILITY_CHECKED, 
        EventDefinitions.createVehiclePayload({
          vehicleId,
          available: result.available,
          context
        })
      );
      
      return result;
      
    } catch (error) {
      console.error('VehicleService: Failed to check availability:', error);
      throw error;
    }
  }
  
  /**
   * Calculate pricing for vehicle
   */
  async calculatePricing(vehicleId, bookingDetails = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/${vehicleId}/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingDetails)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('VehicleService: Failed to calculate pricing:', error);
      throw error;
    }
  }
}

// Export as singleton
export default new VehicleService();