import axios from 'axios';
import { routeTo } from '../utils/routerNavigation';
import normalizeApiError from '../utils/errorUtils';
import { showError, showInfo } from '../services/notificationService';

// Retry helper function
const retryAsync = async (fn, maxRetries = 3, delay = 1000, backoff = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorInfo = normalizeApiError(error);
      
      if (!errorInfo.retryable || attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt)));
    }
  }
  
  throw lastError;
};


// const ENV_API_BASE_URL = "https://mydentalclinicpro.com/api";
const ENV_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const BASE_URL = ENV_API_BASE_URL;

if (!ENV_API_BASE_URL) {
  console.warn('[api] VITE_API_BASE_URL is not set. Falling back to default API URL.');
}


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
    } catch (e) {
      // localStorage might not be available in some mobile/private browse modes
      // Token may be in sessionStorage as fallback
      try {
        token = sessionStorage.getItem('token');
      } catch (e2) {
        // Storage unavailable; continue without token
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
  (response) => {
    if (response?.data?.success === false && response.config?.suppressSuccessFalseError !== true) {
      const generatedError = new Error(response.data?.detail || response.data?.message || 'Request failed.');
      generatedError.response = response;
      generatedError.config = response.config;
      return Promise.reject(generatedError);
    }
    return response;
  },
  (error) => {
    const normalized = normalizeApiError(error);
    error.normalized = normalized;

    // Log non-sensitive info for developers
    try {
      const safeLog = {
        url: error.config?.url || 'unknown',
        status: normalized.status,
        type: normalized.type,
      };
      console.error('[api] Response error', safeLog);
    } catch (e) {
      // ignore logging errors
    }

    const suppressAuthRedirect = error.config?.suppressAuthRedirect === true;
    if (normalized.status === 401 && !suppressAuthRedirect) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        try {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        } catch (e2) {}
      }
      showInfo('Your session has expired. Please log in again.');
      routeTo('/', { replace: true });
      return Promise.reject(error);
    }

    const suppress = error.config && error.config.suppressGlobalErrors;
    if (!suppress && (normalized.type === 'NETWORK_ERROR' || normalized.type === 'SERVER_ERROR' || normalized.type === 'RATE_LIMIT')) {
      showError(normalized.message);
    }

    return Promise.reject(error);
  }
);

// Enhanced API client with retry support
export const apiClientWithRetry = (config) => {
  const request = () => apiClient(config);
  return retryAsync(request, 3, 1000, 2);
};

export { retryAsync };
export default apiClient;