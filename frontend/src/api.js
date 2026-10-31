
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("soundwaveToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // FormData ke liye Axios ko Content-Type aur boundary
  // automatically set karne do.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

export default api;
