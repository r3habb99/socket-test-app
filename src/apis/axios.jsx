import axios from "axios";
import { toast } from "react-toastify";

// Use environment variable or fallback to localhost
const API_URL = process.env.REACT_APP_API_URL || "http://192.168.0.120:5050/api";

export const api = axios.create({
  baseURL: API_URL, // Your base URL
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout to avoid hanging requests
});

// Add a request interceptor to include Authorization header
api.interceptors.request.use(
  (config) => {
    // Don't add token for authentication endpoints
    const isAuthEndpoint = config.url && (
      config.url.includes('/login') ||
      config.url.includes('/register') ||
      config.url.includes('/refresh-token')
    );

    if (!isAuthEndpoint) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is not 401 or the request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Mark the request as retried
    originalRequest._retry = true;

    // If token refresh is already in progress, add this request to the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    isRefreshing = true;

    try {
      // Import here to avoid circular dependency
      const { refreshToken } = await import("./auth");
      const newToken = await refreshToken();

      if (newToken) {
        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Process the queue with the new token
        processQueue(null, newToken);

        // Retry the original request
        return api(originalRequest);
      } else {
        // If refresh token fails, process the queue with an error
        processQueue(new Error("Failed to refresh token"));

        // Redirect to login
        window.location.href = "/login";
        return Promise.reject(error);
      }
    } catch (refreshError) {
      // If refresh token fails, process the queue with an error
      processQueue(refreshError);

      // Redirect to login
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Generic Error Handling function
export const handleApiError = (error) => {
  // Log the full error object for debugging
  console.error("Full Error Object:", error);

  if (error.response) {
    // Server responded with a status other than 2xx
    console.error("Error Response:", error.response.data);
    console.error("Error Status:", error.response.status);
    console.error("Error Headers:", error.response.headers);
    toast.error(error.response.data.message || "An error occurred");
    throw new Error(error.response.data.message || "An error occurred");
  } else if (error.request) {
    // No response from server
    console.error("No response from server:", error.request);
    toast.error("No response from server");
    throw new Error("No response from server");
  } else {
    // Something else went wrong
    console.error("Error:", error.message);
    toast.error(error.message);
    throw new Error(error.message);
  }
};
