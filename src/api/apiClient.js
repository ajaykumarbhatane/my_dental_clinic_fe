import axios from 'axios';
import { routeTo } from '../utils/routerNavigation';

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

const ENV_API_BASE_URL = "https://mydentalclinicpro.com/api";
// const ENV_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const BASE_URL = ENV_API_BASE_URL;

if (!ENV_API_BASE_URL) {
  console.warn('[api] VITE_API_BASE_URL is not set. Falling back to default API URL.', {
    mode: import.meta.env.MODE,
    defaultBaseUrl: DEFAULT_API_BASE_URL,
    envValue: ENV_API_BASE_URL || null,
    hint: 'For physical Android device testing against local backend, set VITE_API_BASE_URL to your machine LAN IP in .env or .env.development.',
  });
}

console.log('[api] Using baseURL:', BASE_URL, {
  source: ENV_API_BASE_URL ? 'env' : 'default',
  envValue: ENV_API_BASE_URL || null,
  mode: import.meta.env.MODE,
});

const apiClient = axios.create({
  baseURL: BASE_URL,
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
      console.log('[api] Request', {
        url: config.url,
        authHeaderPresent: Boolean(token),
        baseURL: config.baseURL,
      });
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
      console.log('[api] Authorization header attached', { url: config.url });
    } else {
      console.warn('[api] Authorization header missing', { url: config.url });
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
  (response) => {
    console.log('[api] Response', {
      url: response.config?.url,
      status: response.status,
      baseURL: response.config?.baseURL,
    });
    return response;
  },
  (error) => {
    // Attach error category to the error object
    const errorInfo = categorizeError(error);
    error.category = errorInfo.category;
    error.userMessage = errorInfo.message;
    error.details = errorInfo.details;
    error.isRetryable = errorInfo.isRetryable;

    const requestUrl = error.config?.url || 'unknown';
    const requestBase = error.config?.baseURL || BASE_URL;
    const responseStatus = error.response?.status;

    console.error('[api] Response error', {
      url: requestUrl,
      baseURL: requestBase,
      status: responseStatus,
      message: error.message,
      category: errorInfo.category,
      responseData: error.response?.data,
    });

    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('[api] Network error - check mobile connectivity, API host and Android cleartext policy.');
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
      routeTo('/', { replace: true });
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