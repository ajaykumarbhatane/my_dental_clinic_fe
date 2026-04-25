import apiClient from './apiClient';

export const dashboardApi = {
  get: (params = {}) => apiClient.get('/dashboard/', { params }),
};
