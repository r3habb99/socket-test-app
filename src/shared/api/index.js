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


  // If response.data is null or undefined, return an error
  if (response.data === null || response.data === undefined) {
    return {
      error: true,
      message: "No data received from server",
      status: response.status,
      data: null,
      success: false
    };
  }

  // Handle different response structures
  if (typeof response.data === 'object') {
    // Case 1: { data: { data: {...} } }
    if (response.data.data && typeof response.data.data === 'object') {
      if (response.data.data.data && typeof response.data.data.data === 'object') {
        return {
          error: false,
          data: response.data.data,
          message: response.data.message || "Operation successful",
          status: response.status,
          success: true
        };
      }

      return {
        error: false,
        data: response.data.data,
        message: response.data.message || "Operation successful",
        status: response.status,
        success: true
      };
    }

    // Case 2: { error: false, data: {...} }
    if (response.data.error === false && response.data.data) {
      return {
        error: false,
        data: response.data.data,
        message: response.data.message || "Operation successful",
        status: response.status,
        success: true
      };
    }

    // Case 3: { statusCode: 200, message: "...", data: {...} }
    if (response.data.statusCode && response.data.data) {
     return {
        error: false,
        data: response.data,  // Return the whole object to preserve the structure
        message: response.data.message || "Operation successful",
        status: response.status,
        success: true
      };
    }

    // Case 4: { user: {...} } or other direct object with nested data
    if (response.data.user) {
      return {
        error: false,
        data: response.data,
        message: "Operation successful",
        status: response.status,
        success: true
      };
    }
  }

  // Default response handling - return the data as is
  return {
    error: false,
    data: response.data,
    status: response.status,
    success: true
  };
};
