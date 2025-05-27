class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    this.handleErrors(response);
    return this.parseResponse(response);
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  handleErrors(response) {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }
}

export default ApiClient;