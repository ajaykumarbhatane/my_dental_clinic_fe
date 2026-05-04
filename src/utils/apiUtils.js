import { useNotification } from '../context/NotificationContext';

// Hook for API calls with error handling
export const useApiWithErrorHandling = () => {
  const { showError, showSuccess } = useNotification();

  const handleApiCall = async (apiCall, options = {}) => {
    const {
      successMessage,
      errorMessage,
      showSuccessNotification = false,
      showErrorNotification = true,
      onSuccess,
      onError
    } = options;

    try {
      const result = await apiCall();
      
      if (showSuccessNotification && successMessage) {
        showSuccess(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      let message = errorMessage;
      
      if (!message) {
        if (error.userMessage) {
          message = error.userMessage;
        } else if (error.response?.data?.detail) {
          message = error.response.data.detail;
        } else if (error.response?.data?.error?.message) {
          message = error.response.data.error.message;
        } else {
          message = 'An unexpected error occurred';
        }
      }
      
      if (showErrorNotification) {
        showError(message);
      }
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  };

  return { handleApiCall };
};

// Utility function for API calls with error handling (non-hook version)
export const apiCallWithErrorHandling = async (apiCall, notificationContext, options = {}) => {
  const { showError, showSuccess } = notificationContext;
  
  const {
    successMessage,
    errorMessage,
    showSuccessNotification = false,
    showErrorNotification = true,
    onSuccess,
    onError
  } = options;

  try {
    const result = await apiCall();
    
    if (showSuccessNotification && successMessage) {
      showSuccess(successMessage);
    }
    
    if (onSuccess) {
      onSuccess(result);
    }
    
    return result;
  } catch (error) {
    let message = errorMessage;
    
    if (!message) {
      if (error.userMessage) {
        message = error.userMessage;
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail;
      } else if (error.response?.data?.error?.message) {
        message = error.response.data.error.message;
      } else {
        message = 'An unexpected error occurred';
      }
    }
    
    if (showErrorNotification) {
      showError(message);
    }
    
    if (onError) {
      onError(error);
    }
    
    throw error;
  }
};