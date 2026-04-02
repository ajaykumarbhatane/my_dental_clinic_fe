import apiClient from './apiClient';

export const treatmentVideosApi = {
  getAll: (params = {}) => apiClient.get('/treatment-videos/', { params }),
  getById: (id) => apiClient.get(`/treatment-videos/${id}/`),
};
