import React from 'react';

const ErrorMessage = ({ message, details, className = '' }) => {
  if (!message) return null;
  return (
    <div className={`flex items-start gap-3 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg ${className}`} role="alert">
      <div className="text-sm text-red-700">
        <p className="font-semibold">{message}</p>
        {details && <p className="text-xs mt-1">{details}</p>}
      </div>
    </div>
  );
};

export default ErrorMessage;
