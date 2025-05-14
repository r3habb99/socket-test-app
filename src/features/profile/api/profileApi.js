import { apiClient, endpoints, handleApiError, handleApiResponse } from '../../../shared/api';

/**
 * Fetch user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response object
 */
export const fetchUserProfileById = async (userId) => {
  try {
    const response = await apiClient.get(endpoints.user.getById(userId));


    // Process the response to handle different structures
    const processedResponse = handleApiResponse(response);


    return processedResponse;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return handleApiError(error);
  }
};

/**
 * Fetch user stats with content (posts, replies, likes, or media)
 * @param {string} userId - User ID
 * @param {Object} options - Options for the stats API
 * @param {string} [options.contentType='posts'] - Type of content to retrieve (posts, replies, likes, media)
 * @param {number} [options.limit=10] - Number of items to return per page
 * @param {string} [options.maxId] - Get content older than this ID (for pagination)
 * @param {string} [options.sinceId] - Get content newer than this ID (for pagination)
 * @param {boolean} [options.includeComments=true] - Whether to include comment counts
 * @returns {Promise<Object>} Response object containing user stats and content
 */
export const fetchUserStats = async (userId, options = {}) => {
  try {
    const response = await apiClient.get(endpoints.user.stats(userId, options));
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
    const response = await apiClient.put(endpoints.user.follow(userId), {});
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
