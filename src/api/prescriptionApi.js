import apiClient from './apiClient';

export const prescriptionApi = {
  getAll: (params = {}) => apiClient.get('/prescriptions/', { params }),
  getById: (id) => apiClient.get(`/prescriptions/${id}/`),
  create: (data) => apiClient.post('/prescriptions/', data),
  update: (id, data) => apiClient.patch(`/prescriptions/${id}/`, data),
  delete: (id) => apiClient.delete(`/prescriptions/${id}/`),
  getByPatient: (patientId, params = {}) => apiClient.get('/prescriptions/', { params: { patient: patientId, ...params } }),
  getClinicMedicines: (params = {}) => apiClient.get('/clinic-medicines/', { params }),
};
