import apiClient from './apiClient';

export const treatmentApi = {
  getAll: (params = {}) => apiClient.get('/treatments/', { params }),
  getById: (id) => apiClient.get(`/treatments/${id}/`),
  create: (data) => apiClient.post('/treatments/', data),
  update: (id, data) => apiClient.patch(`/treatments/${id}/`, data),
  delete: (id) => apiClient.delete(`/treatments/${id}/`),
  getTypes: () => apiClient.get('/type-of-treatments/'),
  getVisits: (treatmentId) => apiClient.get(`/visits/?treatment=${treatmentId}`),
  getByPatient: (patientId, params = {}) => apiClient.get('/treatments/', { params: { patient: patientId, ...params } }),
};