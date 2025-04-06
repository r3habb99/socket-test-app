import axios from "axios";
// const API_URL = "http://192.168.0.88:8080/api";
const API_URL = "http://localhost:8080/api";

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
