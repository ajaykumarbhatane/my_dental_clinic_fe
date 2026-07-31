import apiClient from './apiClient';

export const subscriptionService = {
  getPlans: () => apiClient.get('/subscription-plans/'),
  purchaseSubscription: (data) => apiClient.post('/clinic-subscriptions/purchase/', data),
  getCurrentSubscription: () => apiClient.get('/clinic-subscriptions/current/'),
  getSubscriptionHistory: () => apiClient.get('/clinic-subscriptions/history/'),
};
