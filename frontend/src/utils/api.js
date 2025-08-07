import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: '', // Use relative URLs to work with Vite proxy
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('adminToken');
        if (refreshToken) {
          const response = await api.post('/api/admin/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
          
          const { token } = response.data.data;
          localStorage.setItem('adminToken', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Retry the original request
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('adminToken');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/admin/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api; 