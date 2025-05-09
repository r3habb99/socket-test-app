import { apiClient, endpoints, handleApiError, handleApiResponse } from '../../../shared/api';

/**
 * Fetch user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response object
 */
export const fetchUserProfileById = async (userId) => {
  try {
    const response = await apiClient.get(endpoints.user.getById(userId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Follow/unfollow a user
 * @param {string} userId - User ID to follow/unfollow
 * @returns {Promise<Object>} Response object
 */
export const followUser = async (userId) => {
  try {
    const response = await apiClient.post(endpoints.user.follow(userId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update user profile
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Response object
 */
export const updateUserProfile = async (userData) => {
  try {
    const response = await apiClient.put(endpoints.user.updateProfile, userData);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Upload profile picture
 * @param {File} imageFile - Profile picture file
 * @returns {Promise<Object>} Response object
 */
export const uploadProfilePic = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await apiClient.post('/user/upload/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Upload cover photo
 * @param {File} imageFile - Cover photo file
 * @returns {Promise<Object>} Response object
 */
export const uploadCoverPhoto = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await apiClient.post('/user/upload/cover-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get user followers
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response object
 */
export const getUserFollowers = async (userId) => {
  try {
    const response = await apiClient.get(endpoints.user.followers(userId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get user following
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response object
 */
export const getUserFollowing = async (userId) => {
  try {
    const response = await apiClient.get(endpoints.user.following(userId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};
