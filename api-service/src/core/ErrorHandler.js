class ErrorHandler {
  constructor() {
    this.errors = [];
  }

  logError(error) {
    console.error('API Error:', error);
    this.errors.push(error);
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }

  handleApiError(response) {
    if (!response.ok) {
      const error = new Error(`API Error: ${response.status} ${response.statusText}`);
      this.logError(error);
      throw error;
    }
  }
}

export default new ErrorHandler();