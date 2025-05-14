import axios from "axios";
import { getApiUrl } from "../utils/envUtils";

// Get the API URL from environment
const API_URL = getApiUrl();

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
apiClient.interceptors.request.use(
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
        // Ensure token is properly formatted
        const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        config.headers.Authorization = formattedToken;
      } else {
        console.warn('No token found in localStorage for request to:', config.url);
      }
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
apiClient.interceptors.response.use(
  (response) => {


    return response;
  },
  async (error) => {
    // Log the error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      responseData: error.response?.data
    });

    // Handle common errors here (e.g., 401 Unauthorized)
    if (error.response && error.response.status === 401) {
      console.warn('401 Unauthorized response received');

      // Check if we should try to refresh the token
      const shouldRefreshToken = true; // You can add logic here to determine if refresh should be attempted

      if (shouldRefreshToken) {
        try {
          // Try to refresh the token (you'll need to implement this function)
          console.log('Attempting to refresh token...');

          // For now, just log out the user
          console.warn('Token refresh not implemented, logging out user');
          localStorage.removeItem("token");
          localStorage.removeItem("userId");

          // Redirect to login page
          window.location.href = "/login?reason=session_expired";
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          window.location.href = "/login?reason=refresh_failed";
        }
      } else {
        // Just log out the user
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        window.location.href = "/login?reason=unauthorized";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
