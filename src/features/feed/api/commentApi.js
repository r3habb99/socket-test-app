import {
  apiClient,
  endpoints,
  handleApiError,
  handleApiResponse,
} from "../../../shared/api";

/**
 * Create a new comment on a post
 * @param {string} postId - Post ID
 * @param {Object} commentData - Comment data
 * @param {string} commentData.content - Comment content
 * @param {string} [commentData.replyToId] - ID of the comment this is replying to (for nested comments)
 * @returns {Promise<Object>} Response object
 */
export const createComment = async (postId, commentData) => {
  try {
    // If using the post-specific comment endpoint
    const response = await apiClient.post(
      endpoints.post.comment(postId),
      commentData
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create a new comment directly using the comment endpoint
 * @param {Object} commentData - Comment data
 * @param {string} commentData.postId - Post ID
 * @param {string} commentData.content - Comment content
 * @param {string} [commentData.replyToId] - ID of the comment this is replying to (for nested comments)
 * @returns {Promise<Object>} Response object
 */
export const createCommentDirect = async (commentData) => {
  try {
    const response = await apiClient.post(
      endpoints.comment.create,
      commentData
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Reply to a comment
 * @param {Object} replyData - Reply data
 * @param {string} replyData.postId - Post ID
 * @param {string} replyData.content - Reply content
 * @param {string} replyData.replyToId - ID of the comment this is replying to
 * @returns {Promise<Object>} Response object
 */
export const replyToComment = async (replyData) => {
  try {
    const response = await apiClient.post(
      endpoints.comment.create,
      replyData
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get all comments for a post
 * @param {string} postId - Post ID
 * @param {Object} options - Options for fetching comments
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Number of comments per page
 * @param {string} [options.sort='newest'] - Sort order ('newest', 'oldest', 'most_liked')
 * @param {boolean} [options.parentOnly=true] - Whether to only return top-level comments
 * @returns {Promise<Object>} Response object
 */
export const getComments = async (postId, options = {}) => {
  try {
    const params = {
      page: options.page || 1,
      limit: options.limit || 10,
      sort: options.sort || 'newest',
      parentOnly: options.parentOnly !== undefined ? options.parentOnly : true
    };

    // Use the new dedicated endpoint for getting comments for a post
    const response = await apiClient.get(
      endpoints.comment.getForPost(postId),
      { params }
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get replies for a comment
 * @param {string} commentId - Comment ID
 * @param {Object} options - Options for fetching replies
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Number of replies per page
 * @returns {Promise<Object>} Response object
 */
export const getCommentReplies = async (commentId, options = {}) => {
  try {
    const params = {
      page: options.page || 1,
      limit: options.limit || 10
    };

    const response = await apiClient.get(
      endpoints.comment.getReplies(commentId),
      { params }
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Toggle like on a comment (like or unlike)
 * @param {string} commentId - Comment ID
 * @returns {Promise<Object>} Response object
 */
export const toggleCommentLike = async (commentId) => {
  try {
    const response = await apiClient.put(endpoints.comment.like(commentId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// Keep these functions for backward compatibility, but they now use the same endpoint
/**
 * Like a comment
 * @param {string} commentId - Comment ID
 * @returns {Promise<Object>} Response object
 * @deprecated Use toggleCommentLike instead
 */
export const likeComment = toggleCommentLike;

/**
 * Unlike a comment
 * @param {string} commentId - Comment ID
 * @returns {Promise<Object>} Response object
 * @deprecated Use toggleCommentLike instead
 */
export const unlikeComment = toggleCommentLike;

/**
 * Edit a comment
 * @param {string} commentId - Comment ID
 * @param {Object} commentData - Updated comment data
 * @param {string} commentData.content - Updated comment content
 * @returns {Promise<Object>} Response object
 */
export const editComment = async (commentId, commentData) => {
  try {
    const response = await apiClient.put(endpoints.comment.update(commentId), commentData);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a comment
 * @param {string} commentId - Comment ID
 * @returns {Promise<Object>} Response object
 */
export const deleteComment = async (commentId) => {
  try {
    const response = await apiClient.delete(endpoints.comment.delete(commentId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get a comment by ID
 * @param {string} commentId - Comment ID
 * @returns {Promise<Object>} Response object
 */
export const getCommentById = async (commentId) => {
  try {
    const response = await apiClient.get(endpoints.comment.getById(commentId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};
