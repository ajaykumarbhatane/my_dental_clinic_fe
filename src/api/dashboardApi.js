import apiClient from './apiClient';

export const dashboardApi = {
  get: () => apiClient.get('/dashboard/'),
};
