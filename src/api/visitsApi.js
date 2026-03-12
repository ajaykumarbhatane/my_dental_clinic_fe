import apiClient from './apiClient';

export const visitsApi = {
  getAll: () => apiClient.get('/visits/'),
  getById: (id) => apiClient.get(`/visits/${id}/`),
  create: (data) => apiClient.post('/visits/', data),
  update: (id, data) => apiClient.put(`/visits/${id}/`, data),
  delete: (id) => apiClient.delete(`/visits/${id}/`),
  getByTreatment: (treatmentId) => apiClient.get('/visits/', { params: { treatment: treatmentId } }),
};

export const visitImagesApi = {
  getAll: () => apiClient.get('/visit-images/'),
  getById: (id) => apiClient.get(`/visit-images/${id}/`),
  getByVisit: (visitId) => apiClient.get('/visit-images/', { params: { visit: visitId } }),
  create: (data) => {
    const formData = new FormData();
    if (data.image) {
      formData.append('image', data.image);
    }
    if (data.visit) {
      formData.append('visit', data.visit);
    }
    if (data.caption) {
      formData.append('caption', data.caption);
    }
    return apiClient.post('/visit-images/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    if (data.image instanceof File) {
      formData.append('image', data.image);
    }
    if (data.caption) {
      formData.append('caption', data.caption);
    }
    return apiClient.patch(`/visit-images/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id) => apiClient.delete(`/visit-images/${id}/`),
};
