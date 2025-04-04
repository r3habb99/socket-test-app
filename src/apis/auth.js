import api, { getAuthHeaders, handleApiError } from "./axios";

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
    console.log(response.data, "response data"); // Check the response data here
    return response?.data?.data?.user; // Assuming this is how the user is accessed
  } catch (error) {
    console.error("Error fetching user profile:", error);
    handleApiError(error);
  }
};
