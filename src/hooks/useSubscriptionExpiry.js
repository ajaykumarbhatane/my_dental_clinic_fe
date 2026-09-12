import { useState, useCallback } from 'react';
import { subscriptionService } from '../api/subscriptionService';
import normalizeApiError from '../utils/errorUtils';
import { shouldShowSubscriptionWarning } from '../utils/subscriptionUtils';

/**
 * Hook for managing subscription expiry modal
 * Whenever called/triggered on Dashboard navigation or click, checks if remaining_days <= 5
 */
export const useSubscriptionExpiry = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const checkSubscriptionExpiry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subscriptionService.getCurrentSubscription();
      const data = response?.data;
      setSubscription(data);

      if (shouldShowSubscriptionWarning(data)) {
        setIsModalOpen(true);
      }
    } catch (err) {
      const normalizedError = normalizeApiError(err);
      setError(normalizedError);
      console.warn('Failed to fetch subscription:', normalizedError);
    } finally {
      setLoading(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    subscription,
    loading,
    error,
    isModalOpen,
    closeModal,
    checkSubscriptionExpiry,
    setIsModalOpen,
  };
};
