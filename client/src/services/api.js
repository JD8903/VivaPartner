import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 180000,
});

// =====================================================
// Request Interceptor
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================================
// Response Interceptor
// =====================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response) {
      console.error(
        "API Error:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error(
        "Network Error:",
        error.message
      );
    }

    return Promise.reject(error);
  }
);

export default api;