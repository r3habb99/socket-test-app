import { api, getAuthHeaders, handleApiError } from "./axios";

export const resetPassword = async (formData) => {
  try {
    const response = await api.put("/user/reset-password", formData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting password:", error);
    handleApiError(error);
  }
};
