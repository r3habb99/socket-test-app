import { useState, useEffect, useCallback } from "react";
import { login as loginApi, register as registerApi } from "../api/authApi";

/**
 * Custom hook for authentication
 * @returns {Object} Auth methods and state
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (token && userId) {
      setUser({ id: userId });
    }

    setLoading(false);
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);

    try {

      const response = await loginApi(credentials);

      if (response.error) {
        console.error("Login API returned an error:", response.message);
        setError(response.message);
        return { success: false, message: response.message };
      }

      // Extract token and user data, handling different response structures
      const responseData = response.data;

      // Handle nested response structure based on the old Login.jsx component
      let token, userId, userData, username;

      // Try to extract token from various possible locations
      token = responseData?.data?.token || responseData?.token;

      // Try to extract user data from various possible locations
      userData =
        responseData?.data?.userData ||
        responseData?.data?.user ||
        responseData?.userData ||
        responseData?.user ||
        {};

      // Try to extract user ID from user data
      userId = userData?.id || userData?._id;

      // Try to extract username
      username = userData?.username || userData?.name;



      if (!token) {
        console.error("Token is missing from the response:", responseData);
        setError("Authentication failed: Token is missing");
        return {
          success: false,
          message: "Authentication failed: Token is missing",
        };
      }

      if (!userId) {
        console.error("User ID is missing from the response:", responseData);
        setError("Authentication failed: User ID is missing");
        return {
          success: false,
          message: "Authentication failed: User ID is missing",
        };
      }

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);

      // Save username if available
      if (username) {
        localStorage.setItem("username", username);
      }

      // Save additional user information if available
      if (userData.firstName) {
        localStorage.setItem("firstName", userData.firstName);
      }
      if (userData.lastName) {
        localStorage.setItem("lastName", userData.lastName);
      }
      if (userData.profilePic) {

        // Process the profile picture URL to ensure it's in the correct format
        let profilePicUrl = userData.profilePic;

        // If the URL is a relative path starting with /uploads/, make sure it's stored as is
        // without any protocol or domain, so it can be properly processed by getImageUrl
        if (profilePicUrl.includes('/uploads/')) {
          // Extract just the /uploads/... part if it's a full URL
          const uploadsMatch = profilePicUrl.match(/\/uploads\/.*$/);
          if (uploadsMatch) {
            profilePicUrl = uploadsMatch[0];
          }

          // If it doesn't start with a slash, add one
          if (!profilePicUrl.startsWith('/')) {
            profilePicUrl = '/' + profilePicUrl;
          }
        }

      localStorage.setItem("profilePic", profilePicUrl);
      }
      if (userData.email) {
        localStorage.setItem("email", userData.email);
      }

      // Update state
      setUser({
        id: userId,
        username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profilePic: userData.profilePic,
        email: userData.email
      });

  
      return { success: true };
    } catch (err) {
      // Enhanced error logging
      console.error("Login error details:", err);

      // Check for network errors specifically
      const isNetworkError = err.message === 'Network Error';
      const message = isNetworkError
        ? "Unable to connect to the server. Please check your internet connection and try again."
        : (err.message || "An error occurred during login");

      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await registerApi(userData);

      if (response.error) {
        setError(response.message);
        return { success: false, message: response.message };
      }

      return { success: true };
    } catch (err) {
      const message = err.message || "An error occurred during registration";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  // const logout = useCallback(() => {
  //   // Remove all user-related data from localStorage
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("userId");
  //   localStorage.removeItem("username");
  //   localStorage.removeItem("firstName");
  //   localStorage.removeItem("lastName");
  //   localStorage.removeItem("profilePic");
  //   localStorage.removeItem("email");

  //   setUser(null);
  // }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!localStorage.getItem("token");
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    // logout,
    isAuthenticated,
  };
};
