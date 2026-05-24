import axios from "axios";

export const API_URL = "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;