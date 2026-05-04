import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration) => addNotification(message, 'success', duration), [addNotification]);
  const showError = useCallback((message, duration) => addNotification(message, 'error', duration), [addNotification]);
  const showWarning = useCallback((message, duration) => addNotification(message, 'warning', duration), [addNotification]);
  const showInfo = useCallback((message, duration) => addNotification(message, 'info', duration), [addNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
    </NotificationContext.Provider>
  );
};