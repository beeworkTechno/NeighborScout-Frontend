import axios from 'axios';
import { getToken } from '../../utils/tokenUtils';

export const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically to protected API requests
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: better error logging for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(
      'API Error:',
      error?.response?.status,
      error?.response?.data || error.message
    );

    return Promise.reject(error);
  }
);

export default api;