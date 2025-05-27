class BookingService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async createBooking(bookingData) {
    try {
      const response = await this.apiClient.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getBooking(bookingId) {
    try {
      const response = await this.apiClient.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateBooking(bookingId, updatedData) {
    try {
      const response = await this.apiClient.put(`/bookings/${bookingId}`, updatedData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async cancelBooking(bookingId) {
    try {
      const response = await this.apiClient.delete(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    // Centralized error handling logic
    console.error('BookingService Error:', error);
    // Emit an event for the error if needed
  }
}

// Export a singleton instance of BookingService
const apiClient = new (require('../core/ApiClient')).default();
const bookingService = new BookingService(apiClient);
export default bookingService;