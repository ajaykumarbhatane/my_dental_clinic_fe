import React from 'react';

const LoadingSpinner = ({ size = 5, label = 'Loading...' }) => (
  <div className="flex items-center gap-2">
    <div className={`animate-spin rounded-full border-2 border-t-transparent h-${size} w-${size} border-white`} />
    <span className="text-sm text-gray-600">{label}</span>
  </div>
);

export default LoadingSpinner;
