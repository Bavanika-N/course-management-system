import axios from "axios";
import { clearAuth } from "./auth";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 Unauthorized responses
let isRedirecting = false;

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    if (error.response?.status === 401) {

      // Do NOT logout when login itself fails
      if (error.config?.url !== "/auth/login" && !isRedirecting) {

        isRedirecting = true;

        // Clear token and user
        clearAuth();

        // Save current page
        const currentPath = window.location.pathname;

        // Redirect to login
        window.location.href =
          `/login?sessionExpired=true&from=${encodeURIComponent(currentPath)}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;