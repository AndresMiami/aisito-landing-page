class RequestHandler {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async sendRequest(method, url, data = null) {
    try {
      const response = await this.apiClient.request(method, url, data);
      return this.parseResponse(response);
    } catch (error) {
      this.handleError(error);
      throw error; // Re-throw the error after handling
    }
  }

  parseResponse(response) {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  handleError(error) {
    // Log the error or handle it as needed
    console.error('API Request Error:', error);
    // You can also integrate with an ErrorHandler class if needed
  }
}

export default RequestHandler;