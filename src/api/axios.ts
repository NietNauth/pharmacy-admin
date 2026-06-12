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
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (!error.response) {
      throw new Error('Không thể kết nối đến server');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
