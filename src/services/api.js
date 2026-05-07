import axios from 'axios';

// Change this to your Railway URL when backend is deployed
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export default api;