import axios from 'axios';

// Error categorization helper
const categorizeError = (error) => {
  if (!error.response) {
    return {
      category: 'network',
      message: 'Network error - please check your connection',
      isRetryable: true
    };
  }

  const status = error.response.status;
  const data = error.response.data;

  if (status === 401) {
    return {
      category: 'auth',
      message: data?.detail || 'Authentication required',
      isRetryable: false
    };
  }

  if (status === 403) {
    return {
      category: 'permission',
      message: data?.detail || 'Permission denied',
      isRetryable: false
    };
  }

  if (status === 400) {
    return {
      category: 'validation',
      message: data?.detail || data?.error?.message || 'Invalid request data',
      details: data?.error?.details,
      isRetryable: false
    };
  }

  if (status === 404) {
    return {
      category: 'not_found',
      message: data?.detail || 'Resource not found',
      isRetryable: false
    };
  }

  if (status === 409) {
    return {
      category: 'conflict',
      message: data?.detail || 'Resource conflict',
      isRetryable: false
    };
  }

  if (status === 413) {
    return {
      category: 'payload_too_large',
      message: 'File too large',
      isRetryable: false
    };
  }

  if (status === 422) {
    return {
      category: 'unprocessable',
      message: data?.detail || 'Unprocessable request',
      isRetryable: false
    };
  }

  if (status >= 500) {
    return {
      category: 'server',
      message: 'Server error - please try again later',
      isRetryable: true
    };
  }

  return {
    category: 'unknown',
    message: data?.detail || 'An unexpected error occurred',
    isRetryable: false
  };
};

// Retry helper function
const retryAsync = async (fn, maxRetries = 3, delay = 1000, backoff = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorInfo = categorizeError(error);
      
      if (!errorInfo.isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt)));
    }
  }
  
  throw lastError;
};

console.log("API BASE URL:", import.meta.env.VITE_API_BASE_URL);

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 'http://127.0.0.1:8000/api' for local development
  headers: {
    'Content-Type': 'application/json',
  },
  // no size restriction in API client (the server will determine actual limits)
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  // Critical for mobile auth: enables cookies and credentials in cross-origin requests
  withCredentials: true,
  timeout: 30000, // 30 second timeout for mobile networks
});

// Add request interceptor to include auth token and support FormData boundary auto
apiClient.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage, gracefully handle if unavailable
    let token = null;
    try {
      token = localStorage.getItem('token');
      console.log("TOKEN:", token);
      console.log("REQUEST URL:", config.url);
      console.log("FULL API URL:", config.baseURL + config.url);


    } catch (e) {
      // localStorage might not be available in some mobile/private browse modes
      // Token may be in sessionStorage as fallback
      try {
        token = sessionStorage.getItem('token');
      } catch (e2) {
        console.warn('Neither localStorage nor sessionStorage available');
      }
    }
    
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    // If using FormData, let Axios set the Content-Type header (including boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors and network issues
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Attach error category to the error object
    const errorInfo = categorizeError(error);
    error.category = errorInfo.category;
    error.userMessage = errorInfo.message;
    error.details = errorInfo.details;
    error.isRetryable = errorInfo.isRetryable;
    
    // Check for CORS errors or network issues common on mobile
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('Network error - check mobile connectivity and CORS settings');
    }
    
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized responses and redirect to landing
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        try {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        } catch (e2) {}
      }
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// Enhanced API client with retry support
export const apiClientWithRetry = (config) => {
  const request = () => apiClient(config);
  return retryAsync(request, 3, 1000, 2);
};

export { categorizeError, retryAsync };
export default apiClient;