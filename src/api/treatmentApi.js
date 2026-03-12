import apiClient from './apiClient';

export const treatmentApi = {
  getAll: () => apiClient.get('/treatments/'),
  getById: (id) => apiClient.get(`/treatments/${id}/`),
  create: (data) => apiClient.post('/treatments/', data),
  update: (id, data) => apiClient.put(`/treatments/${id}/`, data),
  delete: (id) => apiClient.delete(`/treatments/${id}/`),
  getTypes: () => apiClient.get('/type-of-treatments/'),
  getVisits: (treatmentId) => apiClient.get(`/visits/?treatment=${treatmentId}`),
};