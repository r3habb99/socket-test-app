import { api, getAuthHeaders, handleApiError } from "./axios";

// Get All Posts
export const getPosts = async () => {
  try {
    const response = await api.get("/post", {
      headers: getAuthHeaders(),
    });
    return response.data.data || []; // ✅ This returns only the posts array
  } catch (error) {
    handleApiError(error);
    return []; // fallback
  }
};

// Get Single Post by ID
export const getPostById = async (postId) => {
  try {
    const response = await api.get(`/post/${postId}`, {
      headers: getAuthHeaders(),
    });
    return response.data; // returns a specific post
  } catch (error) {
    handleApiError(error);
  }
};

//Create a New Post
export const createPost = async (postData) => {
  try {
    const response = await api.post("/post", postData, {
      headers: {
        ...getAuthHeaders(),
        // If you need to handle file uploads, you can add the 'Content-Type': 'multipart/form-data'
      },
    });
    return response.data; // returns created post
  } catch (error) {
    handleApiError(error);
  }
};

// Like a Post
export const likePost = async (postId) => {
  try {
    const response = await api.put(
      `/post/${postId}/like`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data; // returns updated post data
  } catch (error) {
    handleApiError(error);
  }
};

// Retweet a Post
export const retweetPost = async (postId) => {
  try {
    const response = await api.post(
      `/post/${postId}/retweet`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data; // returns retweeted post
  } catch (error) {
    handleApiError(error);
  }
};
// Delete a Post
export const deletePost = async (postId) => {
  try {
    const response = await api.delete(`/post/${postId}`, {
      headers: getAuthHeaders(),
    });
    return response.data; // returns success message or deleted post info
  } catch (error) {
    handleApiError(error);
  }
};
