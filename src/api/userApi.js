import apiClient from './apiClient';

export const userApi = {
  getAll: (params = {}) => apiClient.get('/user/', { params }),
  getById: (id) => apiClient.get(`/user/${id}/`),
  getMe: () => apiClient.get('/user/me/'),
  create: (data) => apiClient.post('/user/', data),
  update: (id, data) => apiClient.patch(`/user/${id}/`, data),
  delete: (id) => apiClient.delete(`/user/${id}/`),
  search: (query) => apiClient.get('/user/', { params: { search: query } }),
  findMembers: () => apiClient.get('/user/?find-members=true'),
};
