import apiClient from './apiClient';

export const choiceApi = {
  get: (which, params = {}) => apiClient.get(`/choices/${which}/`, { params }),
};

export default choiceApi;
