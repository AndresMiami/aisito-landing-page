class AnalyticsService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  trackEvent(eventName, eventData) {
    return this.apiClient.post('/analytics/events', {
      name: eventName,
      data: eventData,
    });
  }

  getAnalyticsData(startDate, endDate) {
    return this.apiClient.get('/analytics/data', {
      params: { start: startDate, end: endDate },
    });
  }

  getUserInteractions(userId) {
    return this.apiClient.get(`/analytics/users/${userId}/interactions`);
  }
}

export default new AnalyticsService();