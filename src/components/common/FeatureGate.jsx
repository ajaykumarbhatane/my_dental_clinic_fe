import React from 'react';
import { useEntitlements } from '../../context/EntitlementContext';
import LockedFeatureCard from './LockedFeatureCard';

const FeatureGate = ({
  feature,
  children,
  fallback = null,
  showLockedCard = false,
  compact = false,
  hideIfDisabled = false,
  featureName,
  description,
}) => {
  const { hasFeature, loading } = useEntitlements();

  if (loading) {
    return <div aria-hidden="true">{children}</div>;
  }

  const isEnabled = hasFeature(feature);

  if (isEnabled) {
    return <>{children}</>;
  }

  if (hideIfDisabled) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLockedCard) {
    return (
      <LockedFeatureCard
        featureName={featureName || feature}
        description={description}
        compact={compact}
      />
    );
  }

  return null;
};

export default FeatureGate;
