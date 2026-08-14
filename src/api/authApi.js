import apiClient from './apiClient';

export const authApi = {
  login: (credentials) => apiClient.post('/login/', credentials, {
    suppressGlobalErrors: true,
    suppressAuthRedirect: true,
    suppressSuccessFalseError: false,
  }),
  logout: () => apiClient.post('/logout/'), // Knox logout endpoint
};