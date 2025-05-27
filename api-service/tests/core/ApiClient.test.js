import ApiClient from '../../src/core/ApiClient';

describe('ApiClient', () => {
  let apiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  test('should make a GET request successfully', async () => {
    const response = await apiClient.get('/test-endpoint');
    expect(response).toHaveProperty('data');
    expect(response.status).toBe(200);
  });

  test('should handle errors on GET request', async () => {
    try {
      await apiClient.get('/invalid-endpoint');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toMatch(/404/);
    }
  });

  test('should make a POST request successfully', async () => {
    const data = { name: 'Test' };
    const response = await apiClient.post('/test-endpoint', data);
    expect(response).toHaveProperty('data');
    expect(response.status).toBe(201);
  });

  test('should handle errors on POST request', async () => {
    const data = { invalid: 'data' };
    try {
      await apiClient.post('/invalid-endpoint', data);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toMatch(/404/);
    }
  });

  test('should make a PUT request successfully', async () => {
    const data = { name: 'Updated Test' };
    const response = await apiClient.put('/test-endpoint/1', data);
    expect(response).toHaveProperty('data');
    expect(response.status).toBe(200);
  });

  test('should handle errors on PUT request', async () => {
    const data = { invalid: 'data' };
    try {
      await apiClient.put('/invalid-endpoint/1', data);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toMatch(/404/);
    }
  });

  test('should make a DELETE request successfully', async () => {
    const response = await apiClient.delete('/test-endpoint/1');
    expect(response).toHaveProperty('data');
    expect(response.status).toBe(204);
  });

  test('should handle errors on DELETE request', async () => {
    try {
      await apiClient.delete('/invalid-endpoint/1');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toMatch(/404/);
    }
  });
});