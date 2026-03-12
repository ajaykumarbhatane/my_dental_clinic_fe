import apiClient from './apiClient';

export const patientApi = {
  getAll: () => apiClient.get('/patient/'),
  getById: (id) => apiClient.get(`/patient/${id}/`),
  create: (data) => apiClient.post('/patient/', data),
  update: (id, data) => apiClient.put(`/patient/${id}/`, data),
  delete: (id) => apiClient.delete(`/patient/${id}/`),
};