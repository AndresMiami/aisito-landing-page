class LocationService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async fetchLocationDetails(locationId) {
    try {
      const response = await this.apiClient.get(`/locations/${locationId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async validateAddress(address) {
    try {
      const response = await this.apiClient.post('/locations/validate', { address });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  handleError(error) {
    // Centralized error handling logic
    console.error('LocationService Error:', error);
    // Additional error handling can be implemented here
  }
}

export default LocationService;