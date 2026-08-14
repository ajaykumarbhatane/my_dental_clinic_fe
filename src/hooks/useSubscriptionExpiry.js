/**
 * useSubscriptionExpiry hook
 *
 * Manages subscription expiry modal state and data fetching
 * Used by DashboardLayout to display expiry warnings
 */

import { useState, useEffect, useCallback } from 'react';
import { subscriptionService } from '../api/subscriptionService';
import normalizeApiError from '../utils/errorUtils';
import { shouldShowSubscriptionWarning } from '../utils/subscriptionUtils';

/**
 * Hook for managing subscription expiry modal
 * @returns {Object} {subscription, loading, error, isModalOpen, closeModal, showOnce}
 */
export const useSubscriptionExpiry = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  // Fetch current subscription on mount
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await subscriptionService.getCurrentSubscription();
        const data = response.data;
        setSubscription(data);

        // Determine if modal should be shown (only once per session)
        if (!hasShownModal && shouldShowSubscriptionWarning(data)) {
          setIsModalOpen(true);
          setHasShownModal(true);
        }
      } catch (err) {
        // Log error but don't show false expiry warning
        const normalizedError = normalizeApiError(err);
        setError(normalizedError);
        console.warn('Failed to fetch subscription:', normalizedError);
        // Silently fail - user experience should not be interrupted
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [hasShownModal]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    subscription,
    loading,
    error,
    isModalOpen,
    closeModal,
    hasShownModal,
  };
};
