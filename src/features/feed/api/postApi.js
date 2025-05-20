import {
  apiClient,
  endpoints,
  handleApiError,
  handleApiResponse,
} from "../../../shared/api";

/**
 * Get all posts with pagination support
 * @param {Object} options - Options for fetching posts
 * @param {number} [options.page=1] - Page number to fetch
 * @param {number} [options.limit=10] - Number of posts per page
 * @param {string} [options.lastPostId] - ID of the last post for cursor-based pagination
 * @returns {Promise<Object>} Response object with posts and pagination info
 */
export const getPosts = async (options = {}) => {
  try {
    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        error: true,
        message: "Authentication token not found. Please log in again.",
        status: 401,
      };
    }

    // Set up query parameters for pagination
    const params = {};
    if (options.page) params.page = options.page;
    if (options.limit) params.limit = options.limit;
    if (options.lastPostId) params.lastPostId = options.lastPostId;

    // Add explicit headers to ensure token is sent
    const response = await apiClient.get(endpoints.post.getAll, {
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
      },
      params
    });

    const apiResponse = handleApiResponse(response);

    // Extract posts and pagination info from the new nested structure
    if (!apiResponse.error && apiResponse.data && apiResponse.data.data) {
      // Handle the new structure: { error: false, data: { statusCode, message, data: { posts, pagination } } }
      const responseData = apiResponse.data.data;

      if (responseData.posts && Array.isArray(responseData.posts)) {
        return {
          ...apiResponse,
          data: {
            posts: responseData.posts,
            pagination: responseData.pagination || { has_more: false }
          }
        };
      }
    }

    return apiResponse;
  } catch (error) {
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
 * Create a new post or reply to an existing post
 * @param {Object|FormData} postData - Post data or FormData containing post data and media
 * @param {string} [postData.content] - Post content (optional if media is provided)
 * @param {Array<File>|File} [postData.media] - Media files to upload (images/videos)
 * @param {string} [postData.visibility="public"] - Post visibility (public, private, followers)
 * @param {string} [postData.replyTo] - ID of the post this is replying to (for creating replies)
 * @returns {Promise<Object>} Response object
 */
export const createPost = async (postData) => {
  try {
    // Check if postData is FormData (for media uploads) or regular object
    let isFormData = postData instanceof FormData;
    let dataToSend = postData;
    const isReply = !!postData.replyTo;

    // If it's not FormData, convert it to FormData to handle all data consistently
    if (!isFormData) {
      const formData = new FormData();

      // Add content if provided
      if (postData.content !== undefined) {
        formData.append("content", postData.content);
      }

      // Add media files (handle both array and single file)
      if (Array.isArray(postData.media)) {
        postData.media.forEach((file) => {
          formData.append("media", file);
        });
      } else if (postData.media) {
        formData.append("media", postData.media);
      }

      // Add visibility if provided, default to "public"
      formData.append("visibility", postData.visibility || "public");

      // Add replyTo if provided (for replies)
      if (postData.replyTo) {
        formData.append("replyTo", postData.replyTo);
      }

      dataToSend = formData;
      isFormData = true;
    }

    // For FormData, we need to explicitly remove the Content-Type header
    // so that the browser can set the correct boundary
    const config = {};

    // If it's FormData, we need to override the default Content-Type
    if (isFormData) {
      config.headers = {
        'Content-Type': undefined // Let the browser set it automatically
      };
    }

    // Make the API request to the post endpoint
    // According to the API docs, both new posts and replies use the same endpoint
    const response = await apiClient.post(endpoints.post.create, dataToSend, config);


    // Handle successful response
    if (response.status >= 200 && response.status < 300) {
      // Extract the post data from the response according to the API structure
      let postData = null;

      if (response.data) {
        if (response.data.data) {
          // Standard API response structure: { statusCode, message, data }
          postData = response.data.data;
        } else {
          // Fallback to using the response data directly
          postData = response.data;
        }
      }

      return {
        error: false,
        data: postData,
        message: isReply ? "Reply created successfully" : "Post created successfully",
        status: response.status,
        success: true
      };
    }

    // If we get here, use the standard response handler
    const processedResponse = handleApiResponse(response);
    return processedResponse;
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
    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        error: true,
        message: "Authentication token not found. Please log in again.",
        status: 401,
      };
    }

    // Add explicit headers to ensure token is sent
    const response = await apiClient.post(`/post/${postId}/retweet`, {}, {
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
      }
    });


    // Handle 204 No Content response
    if (response.status === 204) {

      // Get the original post to mark it as retweeted
      try {
        const originalPost = await getPostById(postId);
        return {
          success: true,
          message: 'Post retweeted successfully',
          data: {
            ...originalPost.data,
            retweeted: true,
            // Add the current user to retweets array if it exists
            retweets: originalPost.data?.retweets
              ? [...originalPost.data.retweets, localStorage.getItem('userId')]
              : [localStorage.getItem('userId')]
          },
          status: 204
        };
      } catch (getPostError) {
        // Return success even if we couldn't get the original post
        return {
          success: true,
          message: 'Post retweeted successfully',
          data: null,
          status: 204
        };
      }
    }

    const processedResponse = handleApiResponse(response);

    // If we don't have data in the response, try to extract it from the raw response
    if (!processedResponse.data && response.data) {
      if (response.data.data) {
        // Handle nested data structure
        processedResponse.data = response.data.data;
      } else if (typeof response.data === 'object') {
        // Use the response data directly
        processedResponse.data = response.data;
      }
      }

    return processedResponse;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Undo a retweet
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Response object
 */
export const undoRetweet = async (postId) => {
  try {
    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        error: true,
        message: "Authentication token not found. Please log in again.",
        status: 401,
      };
    }

    // Add explicit headers to ensure token is sent
    const response = await apiClient.delete(`/post/${postId}/retweet`, {
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
      }
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Retweet removed successfully',
        status: 204
      };
    }

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
