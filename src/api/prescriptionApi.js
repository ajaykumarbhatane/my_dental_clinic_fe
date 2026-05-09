import apiClient from './apiClient';

export const prescriptionApi = {
  getAll: (params = {}) => apiClient.get('/prescriptions/', { params }),
  getById: (id) => apiClient.get(`/prescriptions/${id}/`),
  create: (data, generatePdf = false) => apiClient.post('/prescriptions/', data, { params: generatePdf ? { generate_pdf: true } : {} }),
  update: (id, data, generatePdf = false) => apiClient.patch(`/prescriptions/${id}/`, data, { params: generatePdf ? { generate_pdf: true } : {} }),
  delete: (id) => apiClient.delete(`/prescriptions/${id}/`),
  getByPatient: (patientId, params = {}) => apiClient.get('/prescriptions/', { params: { patient: patientId, ...params } }),
  getClinicMedicines: (params = {}) => apiClient.get('/clinic-medicines/', { params }),
  createClinicMedicine: (data) => apiClient.post('/clinic-medicines/', data),
  updateClinicMedicine: (id, data) => apiClient.put(`/clinic-medicines/${id}/`, data),
  deleteClinicMedicine: (id) => apiClient.delete(`/clinic-medicines/${id}/`),
};
