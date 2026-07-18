import apiClient from './apiClient';

export const choiceApi = {
  get: (which) => apiClient.get(`/choices/${which}/`),
};

export default choiceApi;
