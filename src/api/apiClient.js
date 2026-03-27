import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://mydentalclinicpro.com/api', // 'http://127.0.0.1:8000/api' for local development
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token and support FormData boundary auto
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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

export default apiClient;