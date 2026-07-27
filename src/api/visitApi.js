import apiClient from './apiClient';

export const visitApi = {
  getReminders: (date) => apiClient.get('/visits/reminders/', { params: date ? { date } : {} }),
};
