import apiClient from './apiClient';

export const treatmentVideosApi = {
  getAll: () => apiClient.get('/treatment-videos/'),
  getById: (id) => apiClient.get(`/treatment-videos/${id}/`),
};
