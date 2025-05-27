// filepath: api-service/src/services/VehicleService.js
import ApiClient from '../core/ApiClient';
import { VEHICLE_ENDPOINTS } from '../config/endpoints';
import { Vehicle, VehicleResponse } from '../types/vehicle';

class VehicleService {
  constructor() {
    this.apiClient = new ApiClient();
  }

  async fetchAvailableVehicles() {
    try {
      const response = await this.apiClient.get(VEHICLE_ENDPOINTS.availableVehicles);
      return response.data; // Assuming response.data contains an array of Vehicle
    } catch (error) {
      this.handleError(error);
      throw error; // Rethrow the error after handling
    }
  }

  async fetchVehicleDetails(vehicleId) {
    try {
      const response = await this.apiClient.get(`${VEHICLE_ENDPOINTS.vehicleDetails}/${vehicleId}`);
      return response.data; // Assuming response.data contains Vehicle details
    } catch (error) {
      this.handleError(error);
      throw error; // Rethrow the error after handling
    }
  }

  handleError(error) {
    // Centralized error handling logic
    console.error('VehicleService Error:', error);
    // Additional error handling can be implemented here
  }
}

export default new VehicleService();