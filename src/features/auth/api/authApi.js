import {
  apiClient,
  endpoints,
  handleApiError,
  handleApiResponse,
} from "../../../shared/api";
import { toast } from "react-toastify";

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    // Get the expiration time from the token
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const { exp } = JSON.parse(jsonPayload);

    // Check if the token is expired
    return Date.now() >= exp * 1000;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true;
  }
};

/**
 * Refresh the authentication token
 * @returns {Promise<string|null>} New token or null if refresh failed
 */
export const refreshToken = async () => {
  try {
    const response = await apiClient.post("/user/refresh-token");
    const newToken = response.data.token;

    if (newToken) {
      localStorage.setItem("token", newToken);
      return newToken;
    }

    return null;
  } catch (error) {
    console.error("Error refreshing token:", error);
    // If refresh token fails, log the user out
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/login";
    return null;
  }
};

/**
 * Login user with email and password
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Response object
 */
export const login = async (credentials) => {
  try {
    const response = await apiClient.post(endpoints.auth.login, credentials);
    toast.success("Login successful!");
    return handleApiResponse(response);
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    return handleApiError(error);
  }
};

/**
 * Register a new user
 * @param {Object} userData - User data
 * @param {string} userData.name - User name
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @returns {Promise<Object>} Response object
 */
export const register = async (userData) => {
  try {
    const response = await apiClient.post(endpoints.auth.register, userData);
    toast.success("Registration successful!");
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Logout user
 * @returns {Promise<Object>} Response object
 */
export const logout = async () => {
  try {
    const response = await apiClient.post(endpoints.auth.logout);
    toast.success("Logout successful!");
    return handleApiResponse(response);
  } catch (error) {
    console.error("Logout error:", error.response?.data || error.message);
    return handleApiError(error);
  }
};

/**
 * Update user profile
 * @param {Object} updateData - User profile data to update
 * @returns {Promise<Object>} Response object
 */
export const updateUserProfile = async (updateData) => {
  try {
    const response = await apiClient.put(
      endpoints.user.updateProfile,
      updateData
    );
    toast.success("Profile updated successfully!");
    return handleApiResponse(response);
  } catch (error) {
    console.error("Update user error:", error.response?.data || error.message);
    return handleApiError(error);
  }
};

/**
 * Fetch user profile
 * @returns {Promise<Object>} Response object
 */
export const fetchUserProfile = async () => {
  try {
    const response = await apiClient.get(endpoints.user.profile);
    return handleApiResponse(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return handleApiError(error);
  }
};

/**
 * Search for users
 * @param {string} query - Search query
 * @returns {Promise<Object>} Response object
 */
export const searchUsers = async (query) => {
  try {
    const response = await apiClient.get("/user", { params: { query } });
    return handleApiResponse(response);
  } catch (error) {
    console.error("Error searching users:", error);
    return handleApiError(error);
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response object
 */
export const getUserById = async (userId) => {
  try {
    if (typeof userId !== "string") {
      console.log(
        "Invalid userId type, expected a string but got:",
        typeof userId
      );
      throw new Error("Invalid userId type. Expected a string.");
    }

    const response = await apiClient.get(endpoints.user.getById(userId));
    return handleApiResponse(response);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return handleApiError(error);
  }
};
