import apiClient from "./client";
import endpoints from "./endpoints";

export { apiClient, endpoints };

// Helper function to handle API errors
export const handleApiError = (error) => {
  const errorMessage =
    error.response?.data?.message ||
    error.message ||
    "An unexpected error occurred";

  return {
    error: true,
    message: errorMessage,
    status: error.response?.status,
    data: error.response?.data,
  };
};

// Helper function to handle API responses
export const handleApiResponse = (response) => {
  // Log the response structure for debugging
  console.log("API Response structure:", response.data);

  return {
    error: false,
    data: response.data,
    status: response.status,
  };
};
