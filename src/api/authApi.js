import apiClient from './apiClient';

export const authApi = {
  login: (credentials) => apiClient.post('/login/', credentials),
  logout: () => apiClient.post('/logout/'), // Knox logout endpoint
};