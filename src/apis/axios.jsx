import axios from "axios";
// const API_URL = "http://192.168.0.88:8080/api";
const API_URL = "http://192.168.0.88:8080/api" || "http://localhost:8080/api";

export const api = axios.create({
  baseURL: API_URL, // Your base URL
  headers: {
    "Content-Type": "application/json",
  },
});

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
    throw new Error(error.response.data.message || "An error occurred");
  } else if (error.request) {
    // No response from server
    console.error("No response from server:", error.request);
    throw new Error("No response from server");
  } else {
    // Something else went wrong
    console.error("Error:", error.message);
    throw new Error(error.message);
  }
};
