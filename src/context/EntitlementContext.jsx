import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { subscriptionService } from '../api/subscriptionService';

const EntitlementContext = createContext();

export const useEntitlements = () => {
  const context = useContext(EntitlementContext);
  if (!context) {
    console.warn('useEntitlements must be used within an EntitlementProvider. Returning fallback.');
    return {
      hasActiveSubscription: true,
      plan: null,
      features: [],
      loading: false,
      error: null,
      hasFeature: () => true,
      refetchEntitlements: async () => {},
    };
  }
  return context;
};

export const EntitlementProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  const [entitlements, setEntitlements] = useState({
    hasActiveSubscription: false,
    plan: null,
    features: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEntitlements = useCallback(async () => {
    if (!isAuthenticated()) {
      setEntitlements({
        hasActiveSubscription: false,
        plan: null,
        features: [],
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await subscriptionService.getEntitlements();
      const data = response?.data || {};

      setEntitlements({
        hasActiveSubscription: Boolean(data.has_active_subscription),
        plan: data.plan || null,
        features: Array.isArray(data.features) ? data.features : [],
      });
    } catch (err) {
      console.error('[Entitlements] Failed to fetch entitlements', err);
      setError('Failed to load subscription feature entitlements.');
      // Keep previous state on temporary network error to prevent flashing
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (token && user) {
      fetchEntitlements();
    } else {
      setEntitlements({
        hasActiveSubscription: false,
        plan: null,
        features: [],
      });
      setLoading(false);
    }
  }, [token, user, fetchEntitlements]);

  const hasFeature = useCallback(
    (featureCode) => {
      if (!featureCode) return true;
      if (loading) return true; // Avoid locking UI while initial entitlements are loading

      const target = String(featureCode).trim();
      const featureSet = new Set(
        entitlements.features.map((f) => String(f).trim().toUpperCase())
      );

      // Support direct match or upper-case match
      if (featureSet.has(target.toUpperCase())) {
        return true;
      }

      // Core features (Patients, Treatments, Dashboard) are always accessible
      const CORE_FEATURES = new Set([
        'PATIENTS',
        'PATIENT_MANAGEMENT',
        'TREATMENTS',
        'TREATMENT_MANAGEMENT',
        'DASHBOARD',
        'DASHBOARD_ACCESS',
      ]);
      if (CORE_FEATURES.has(target.toUpperCase())) {
        return true;
      }

      // Check legacy / alias mapping
      const legacyMap = {
        AI_ASSISTANT: ['AI', 'AI_ASSISTANT'],
        AI_PATIENT_CREATION: ['AI', 'AI_ASSISTANT', 'AI_PATIENT_CREATION'],
        SMS: ['SMS', 'SMS SERVICE'],
        WHATSAPP: ['WHATSAPP', 'WHATSAPP INTEGRATION'],
        REPORT: ['REPORT', 'REPORT GENERATION'],
        DASHBOARD_ACCESS: ['DASHBOARD ACCESS', 'DASHBOARD_ACCESS', 'DASHBOARD'],
        PATIENT_MANAGEMENT: ['PATIENT MANAGEMENT', 'PATIENT_MANAGEMENT', 'PATIENTS'],
        TREATMENT_MANAGEMENT: ['TREATMENT MANAGEMENT', 'TREATMENT_MANAGEMENT', 'TREATMENTS'],
        TREATMENT_VIDEOS: ['TREATMENT VIDEOS', 'TREATMENT_VIDEOS', 'VIDEOS'],
      };

      const aliases = legacyMap[target.toUpperCase()] || [target.toUpperCase()];
      return aliases.some((alias) => featureSet.has(alias.toUpperCase()));
    },
    [entitlements.features, loading]
  );

  const value = {
    hasActiveSubscription: entitlements.hasActiveSubscription,
    plan: entitlements.plan,
    features: entitlements.features,
    loading,
    error,
    hasFeature,
    refetchEntitlements: fetchEntitlements,
  };

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
};
