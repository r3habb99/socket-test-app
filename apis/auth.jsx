import { api, getAuthHeaders, handleApiError } from "./axios";
import { toast } from "react-toastify";

// Function to check if token is expired
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

// Function to refresh the token
export const refreshToken = async () => {
  try {
    const response = await api.post(
      "/user/refresh-token",
      {},
      {
        headers: getAuthHeaders(),
      }
    );

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

// Register User API
export const registerUser = async (userData) => {
  try {
    const response = await api.post("/user/register", userData);
    toast.success("Registration successful!");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Login User API
export const loginUser = async (userData) => {
  try {
    console.log("Attempting to login user with email:", userData.email);

    // Make sure we're not sending any auth headers for login
    const response = await api.post("/user/login", userData, {
      headers: {
        "Content-Type": "application/json",
      }
    });

    console.log("Login response received:", response.status);
    toast.success("Login successful!");
    return response.data;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);

    // Provide more user-friendly error messages for common issues
    if (!error.response) {
      // Network error
      toast.error("Unable to connect to the server. Please check your internet connection.");
      throw new Error("Network Error: Unable to connect to the server");
    } else if (error.response.status === 401) {
      toast.error("Invalid email or password");
      throw new Error("Invalid email or password");
    } else {
      // Use the generic error handler for other cases
      handleApiError(error);
    }
  }
};

// Logout User API
export const logoutUser = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No token found in localStorage during logout");
      throw new Error("No authentication token found");
    }

    // Use the proper endpoint with the token in the Authorization header
    const response = await api.delete("/user/logout", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true,
    });
    toast.success("Logout successful!");
    return response.data;
  } catch (error) {
    console.error("Logout error:", error.response?.data || error.message);
    handleApiError(error);
    throw error; // make sure the error propagates
  }
};

// Update User Profile
export const updateUserProfile = async (updateData) => {
  try {
    const response = await api.put("/user/update", updateData, {
      headers: getAuthHeaders(),
    });
    toast.success("Profile updated successfully!");
    return response.data;
  } catch (error) {
    console.error("Update user error:", error.response?.data || error.message);
    handleApiError(error);
  }
};

// Fetch user profile
export const fetchUserProfile = async () => {
  try {
    const response = await api.get("/user/profile", {
      headers: getAuthHeaders(),
    });
    return response?.data?.data?.user; // Assuming this is how the user is accessed
  } catch (error) {
    console.error("Error fetching user profile:", error);
    handleApiError(error);
  }
};

export const fetchUser = async (query) => {
  try {
    const res = await api.get("/user", {
      params: { query },
      headers: getAuthHeaders(),
    });
    return res.data.data; // assuming `data` is nested under `data` based on your response
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    // Ensure userId is a string
    if (typeof userId !== "string") {
      console.log(
        "Invalid userId type, expected a string but got:",
        typeof userId
      );
      throw new Error("Invalid userId type. Expected a string.");
    }

    // Log the userId to see what is being passed
    console.log("Fetching user with ID:", userId);

    // Fetch user data with authentication headers
    const response = await api.get(`/user/${userId}`, {
      headers: getAuthHeaders(), // Use the helper to get auth headers
    });

    return response.data; // Return the user data from the response
  } catch (error) {
    handleApiError(error); // Use the generic error handler from your helpers
    throw error; // Ensure that the error is propagated
  }
};
