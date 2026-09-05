import React from 'react';
import { useEntitlements } from '../../context/EntitlementContext';
import LockedFeatureCard from './LockedFeatureCard';

const FeatureRoute = ({ feature, children, featureName }) => {
  const { hasFeature, loading } = useEntitlements();

  if (loading) {
    return (
      <div className="space-y-6 p-6" aria-label="Loading feature entitlement">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <LockedFeatureCard
        featureName={featureName || feature}
        description="Your clinic subscription does not include access to this section. Upgrade your subscription plan to unlock this feature."
        compact={false}
      />
    </div>
  );
};

export default FeatureRoute;
