import React from 'react';

const EmptyState = ({ title = 'No items found', subtitle = '', action }) => (
  <div className="text-center py-12">
    <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
    {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
