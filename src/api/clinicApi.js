import apiClient from './apiClient';

export const clinicApi = {
  getAll: () => apiClient.get('/clinic/'),
  getById: (id) => apiClient.get(`/clinic/${id}/`),
  create: (data) => apiClient.post('/clinic/', data),
  update: (id, data) => apiClient.put(`/clinic/${id}/`, data),
  delete: (id) => apiClient.delete(`/clinic/${id}/`),
  search: (query) => apiClient.get('/clinic/', { params: { search: query } }),
  signupRequest: (data) => apiClient.post('/clinic-signup-request/', data),
  bookDemo: (data) => apiClient.post('/book-demo/', data),
};
