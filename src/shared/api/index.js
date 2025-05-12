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

  // Handle the new response structure with nested data
  // {error: false, data: {statusCode: 200, message: "...", data: {...}}, status: 200, success: true}
  if (response.data && typeof response.data === 'object') {
    if (response.data.error === false && response.data.data) {
      // New structure with nested data
      return {
        error: false,
        data: response.data,
        status: response.status,
        success: true
      };
    }
  }

  // Default response handling
  return {
    error: false,
    data: response.data,
    status: response.status,
    success: true
  };
};
