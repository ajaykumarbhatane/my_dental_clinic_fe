import apiClient from './apiClient';

export const clinicDoctorApi = {
  getAll: (params) => apiClient.get('/clinic-doctor/', { params }),
  getById: (id) => apiClient.get(`/clinic-doctor/${id}/`),
  create: (data) => apiClient.post('/clinic-doctor/', data),
  update: (id, data) => apiClient.put(`/clinic-doctor/${id}/`, data),
  delete: (id) => apiClient.delete(`/clinic-doctor/${id}/`),
};

export default clinicDoctorApi;
