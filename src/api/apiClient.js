import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://mydentalclinicpro.com/api', // 'http://127.0.0.1:8000/api' for local development
  headers: {
    'Content-Type': 'application/json',
  },
  // allow larger uploads in Node and proxies; for browser it is vendor-specific
  maxContentLength: 100 * 1024 * 1024,
  maxBodyLength: 100 * 1024 * 1024,
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

export default apiClient;