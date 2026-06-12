import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pharmacy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      throw new Error(response.data.message);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('pharmacy_token');
      localStorage.removeItem('pharmacy_user');
      localStorage.removeItem('pharmacy_auth');
      window.location.href = '/login';
    } else if (error.response?.data) {
      const data = error.response.data;
      let message = data.message || 'Có lỗi xảy ra';
      
      // If there are specific validation errors, pick the first one
      if (data.errors && typeof data.errors === 'object') {
        const firstError = Object.values(data.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          message = firstError[0];
        }
      }
      throw new Error(message);
    } else if (!error.response) {
      throw new Error('Không thể kết nối đến server');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
