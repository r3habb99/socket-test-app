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

  // Handle 204 No Content responses
  if (response.status === 204) {
    return {
      error: false,
      data: null,
      message: "Operation successful",
      status: 204,
      success: true
    };
  }

  return {
    error: false,
    data: response.data,
    status: response.status,
    success: true
  };
};
