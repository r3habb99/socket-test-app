import {
  apiClient,
  endpoints,
  handleApiError,
  handleApiResponse,
} from "../../../shared/api";

/**
 * Get all posts
 * @returns {Promise<Object>} Response object
 */
export const getPosts = async () => {
  try {
    const response = await apiClient.get(endpoints.post.getAll);
    return handleApiResponse(response);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return handleApiError(error);
  }
};

/**
 * Get post by ID
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Response object
 */
export const getPostById = async (postId) => {
  try {
    const response = await apiClient.get(endpoints.post.getById(postId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create a new post
 * @param {Object|FormData} postData - Post data or FormData containing post data and media
 * @param {string} postData.content - Post content
 * @param {File} [postData.media] - Media file (image)
 * @param {string} [postData.visibility] - Post visibility (public, private, etc.)
 * @returns {Promise<Object>} Response object
 */
export const createPost = async (postData) => {
  try {
    // Check if postData is FormData (for media uploads) or regular object
    const isFormData = postData instanceof FormData;

    const response = await apiClient.post(endpoints.post.create, postData, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data'
      } : undefined
    });

    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Like a post
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Response object
 */
export const likePost = async (postId) => {
  try {
    const response = await apiClient.put(endpoints.post.like(postId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Unlike a post
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Response object
 */
export const unlikePost = async (postId) => {
  try {
    const response = await apiClient.put(endpoints.post.unlike(postId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Retweet a post
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Response object
 */
export const retweetPost = async (postId) => {
  try {
    const response = await apiClient.post(`/post/${postId}/retweet`);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a post
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Response object
 */
export const deletePost = async (postId) => {
  try {
    const response = await apiClient.delete(endpoints.post.delete(postId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Add a comment to a post
 * @param {string} postId - Post ID
 * @param {Object} commentData - Comment data
 * @param {string} commentData.content - Comment content
 * @returns {Promise<Object>} Response object
 */
export const addComment = async (postId, commentData) => {
  try {
    const response = await apiClient.post(
      endpoints.post.comment(postId),
      commentData
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};
