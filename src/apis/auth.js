import api from "./axios";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Register User API
export const registerUser = async (userData) => {
  try {
    const response = await api.post("/user/register", userData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Login User API
export const loginUser = async (userData) => {
  try {
    const response = await api.post("/user/login", userData);
    return response.data;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    handleApiError(error);
  }
};

// Logout User API
export const logoutUser = async () => {
  try {
    const response = await api.delete("/user/logout", {
      headers: getAuthHeaders(),
      withCredentials: true,
    });

    localStorage.removeItem("token"); // Remove token after logout
    return response.data;
  } catch (error) {
    console.error("Logout error:", error.response?.data || error.message);
    handleApiError(error);
  }
};

// Fetch user profile
export const fetchUserProfile = async () => {
  try {
    const response = await api.get("/user/profile", {
      headers: getAuthHeaders(),
    });
    return response.data.data.user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    handleApiError(error);
  }
};

// Generic Error Handling function
const handleApiError = (error) => {
  if (error.response) {
    console.error("Error Response:", error.response.data);
    throw new Error(error.response.data.message || "An error occurred");
  } else if (error.request) {
    console.error("No response from server:", error.request);
    throw new Error("No response from server");
  } else {
    console.error("Error:", error.message);
    throw new Error(error.message);
  }
};
