import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const Notification = ({ notification }) => {
  const { removeNotification } = useNotification();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`flex items-center p-4 mb-4 text-sm border rounded-lg ${getBgColor(notification.type)}`} role="alert">
      {getIcon(notification.type)}
      <span className="sr-only">{notification.type}</span>
      <div className="ml-3 text-sm font-medium flex-1">
        {notification.message}
      </div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-gray-100"
        onClick={() => removeNotification(notification.id)}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const NotificationContainer = () => {
  const { notifications } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      {notifications.map(notification => (
        <Notification key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export default NotificationContainer;