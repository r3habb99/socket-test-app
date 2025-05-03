import { apiClient, endpoints, handleApiError, handleApiResponse } from '../../../shared/api';

/**
 * Reset user password
 * @param {Object} formData - Password reset data
 * @param {string} formData.currentPassword - Current password
 * @param {string} formData.newPassword - New password
 * @returns {Promise<Object>} Response object
 */
export const resetPassword = async (formData) => {
  try {
    const response = await apiClient.put(endpoints.user.changePassword, formData);
    return handleApiResponse(response);
  } catch (error) {
    console.error("Error resetting password:", error);
    return handleApiError(error);
  }
};

/**
 * Request password reset (forgot password)
 * @param {Object} data - Email data
 * @param {string} data.email - User email
 * @returns {Promise<Object>} Response object
 */
export const requestPasswordReset = async (data) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', data);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Confirm password reset with token
 * @param {Object} data - Reset data
 * @param {string} data.token - Reset token
 * @param {string} data.password - New password
 * @returns {Promise<Object>} Response object
 */
export const confirmPasswordReset = async (data) => {
  try {
    const response = await apiClient.post('/auth/reset-password', data);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};
