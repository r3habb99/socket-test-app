/**
 * Feed Slice
 * Manages feed state including posts, comments, likes, and retweets
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getPosts, 
  getPostById, 
  createPost as createPostApi,
  likePost as likePostApi,
  unlikePost as unlikePostApi,
  retweetPost as retweetPostApi,
  deletePost as deletePostApi,
} from '../api/postApi';
import { setLoading, setError, clearError } from '../../ui/store/uiSlice';

// Initial state
const initialState = {
  posts: [],
  currentPost: null,
  postCount: 0,
  hasMore: true,
  page: 1,
};

// Async thunks
export const fetchPosts = createAsyncThunk(
  'feed/fetchPosts',
  async ({ page = 1, limit = 10 }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'feed', isLoading: true }));
      dispatch(clearError({ feature: 'feed' }));
      
      const response = await getPosts(page, limit);
      
      if (response.error) {
        dispatch(setError({ feature: 'feed', error: response.message }));
        return rejectWithValue(response.message);
      }
      
      // Extract data from response
      const posts = response.data?.data || response.data || [];
      const postCount = response.data?.count || posts.length;
      
      return { posts, postCount, page };
    } catch (err) {
      const message = err.message || "Failed to fetch posts";
      dispatch(setError({ feature: 'feed', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'feed', isLoading: false }));
    }
  }
);

export const fetchPostById = createAsyncThunk(
  'feed/fetchPostById',
  async (postId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'feed', isLoading: true }));
      dispatch(clearError({ feature: 'feed' }));
      
      const response = await getPostById(postId);
      
      if (response.error) {
        dispatch(setError({ feature: 'feed', error: response.message }));
        return rejectWithValue(response.message);
      }
      
      // Extract post data from response
      const post = response.data?.data || response.data;
      
      if (!post) {
        const errorMsg = "Post not found";
        dispatch(setError({ feature: 'feed', error: errorMsg }));
        return rejectWithValue(errorMsg);
      }
      
      return { post };
    } catch (err) {
      const message = err.message || "Failed to fetch post";
      dispatch(setError({ feature: 'feed', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'feed', isLoading: false }));
    }
  }
);

export const createPost = createAsyncThunk(
  'feed/createPost',
  async (postData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'feed', isLoading: true }));
      dispatch(clearError({ feature: 'feed' }));
      
      const response = await createPostApi(postData);
      
      if (response.error) {
        dispatch(setError({ feature: 'feed', error: response.message }));
        return rejectWithValue(response.message);
      }
      
      // Extract new post data from response
      const newPost = response.data?.data || response.data;
      
      return { post: newPost };
    } catch (err) {
      const message = err.message || "Failed to create post";
      dispatch(setError({ feature: 'feed', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'feed', isLoading: false }));
    }
  }
);

export const likePost = createAsyncThunk(
  'feed/likePost',
  async (postId, { dispatch, rejectWithValue }) => {
    try {
      const response = await likePostApi(postId);
      
      if (response.error) {
        return rejectWithValue(response.message);
      }
      
      return { postId, liked: true };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to like post");
    }
  }
);

export const unlikePost = createAsyncThunk(
  'feed/unlikePost',
  async (postId, { dispatch, rejectWithValue }) => {
    try {
      const response = await unlikePostApi(postId);
      
      if (response.error) {
        return rejectWithValue(response.message);
      }
      
      return { postId, liked: false };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to unlike post");
    }
  }
);

export const retweetPost = createAsyncThunk(
  'feed/retweetPost',
  async (postId, { dispatch, rejectWithValue }) => {
    try {
      const response = await retweetPostApi(postId);
      
      if (response.error) {
        return rejectWithValue(response.message);
      }
      
      // Extract data from response
      const data = response.data?.data || response.data;
      const retweeted = data?.retweeted !== false;
      
      return { postId, retweeted };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to retweet post");
    }
  }
);

export const deletePost = createAsyncThunk(
  'feed/deletePost',
  async (postId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'feed', isLoading: true }));
      
      const response = await deletePostApi(postId);
      
      if (response.error) {
        dispatch(setError({ feature: 'feed', error: response.message }));
        return rejectWithValue(response.message);
      }
      
      return { postId };
    } catch (err) {
      const message = err.message || "Failed to delete post";
      dispatch(setError({ feature: 'feed', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'feed', isLoading: false }));
    }
  }
);

// Create the slice
const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    resetFeed: (state) => {
      state.posts = [];
      state.page = 1;
      state.hasMore = true;
    },
    
    updatePostInList: (state, action) => {
      const { postId, updates } = action.payload;
      const postIndex = state.posts.findIndex(post => 
        post.id === postId || post._id === postId
      );
      
      if (postIndex !== -1) {
        state.posts[postIndex] = { ...state.posts[postIndex], ...updates };
      }
    },
    
    incrementCommentCount: (state, action) => {
      const { postId } = action.payload;
      const postIndex = state.posts.findIndex(post => 
        post.id === postId || post._id === postId
      );
      
      if (postIndex !== -1) {
        const post = state.posts[postIndex];
        post.commentCount = (post.commentCount || 0) + 1;
        post.commentsCount = (post.commentsCount || 0) + 1;
      }
      
      if (state.currentPost && (state.currentPost.id === postId || state.currentPost._id === postId)) {
        state.currentPost.commentCount = (state.currentPost.commentCount || 0) + 1;
        state.currentPost.commentsCount = (state.currentPost.commentsCount || 0) + 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts cases
      .addCase(fetchPosts.fulfilled, (state, action) => {
        const { posts, postCount, page } = action.payload;
        
        if (page === 1) {
          state.posts = posts;
        } else {
          // Append new posts, avoiding duplicates
          const existingPostIds = new Set(state.posts.map(post => post.id || post._id));
          const newPosts = posts.filter(post => 
            !existingPostIds.has(post.id) && !existingPostIds.has(post._id)
          );
          state.posts = [...state.posts, ...newPosts];
        }
        
        state.postCount = postCount;
        state.page = page;
        state.hasMore = posts.length > 0;
      })
      
      // Fetch post by ID cases
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.currentPost = action.payload.post;
      })
      
      // Create post cases
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts = [action.payload.post, ...state.posts];
        state.postCount += 1;
      })
      
      // Like post cases
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId } = action.payload;
        
        // Update in posts list
        const postIndex = state.posts.findIndex(post => 
          post.id === postId || post._id === postId
        );
        
        if (postIndex !== -1) {
          state.posts[postIndex].likes = (state.posts[postIndex].likes || 0) + 1;
          state.posts[postIndex].liked = true;
        }
        
        // Update current post if it matches
        if (state.currentPost && (state.currentPost.id === postId || state.currentPost._id === postId)) {
          state.currentPost.likes = (state.currentPost.likes || 0) + 1;
          state.currentPost.liked = true;
        }
      })
      
      // Unlike post cases
      .addCase(unlikePost.fulfilled, (state, action) => {
        const { postId } = action.payload;
        
        // Update in posts list
        const postIndex = state.posts.findIndex(post => 
          post.id === postId || post._id === postId
        );
        
        if (postIndex !== -1) {
          state.posts[postIndex].likes = Math.max(0, (state.posts[postIndex].likes || 0) - 1);
          state.posts[postIndex].liked = false;
        }
        
        // Update current post if it matches
        if (state.currentPost && (state.currentPost.id === postId || state.currentPost._id === postId)) {
          state.currentPost.likes = Math.max(0, (state.currentPost.likes || 0) - 1);
          state.currentPost.liked = false;
        }
      })
      
      // Retweet post cases
      .addCase(retweetPost.fulfilled, (state, action) => {
        const { postId, retweeted } = action.payload;
        
        // Update in posts list
        const postIndex = state.posts.findIndex(post => 
          post.id === postId || post._id === postId
        );
        
        if (postIndex !== -1) {
          if (retweeted) {
            state.posts[postIndex].retweetCount = (state.posts[postIndex].retweetCount || 0) + 1;
          } else {
            state.posts[postIndex].retweetCount = Math.max(0, (state.posts[postIndex].retweetCount || 0) - 1);
          }
          state.posts[postIndex].retweeted = retweeted;
        }
        
        // Update current post if it matches
        if (state.currentPost && (state.currentPost.id === postId || state.currentPost._id === postId)) {
          if (retweeted) {
            state.currentPost.retweetCount = (state.currentPost.retweetCount || 0) + 1;
          } else {
            state.currentPost.retweetCount = Math.max(0, (state.currentPost.retweetCount || 0) - 1);
          }
          state.currentPost.retweeted = retweeted;
        }
      })
      
      // Delete post cases
      .addCase(deletePost.fulfilled, (state, action) => {
        const { postId } = action.payload;
        state.posts = state.posts.filter(post => 
          post.id !== postId && post._id !== postId
        );
        state.postCount = Math.max(0, state.postCount - 1);
        
        if (state.currentPost && (state.currentPost.id === postId || state.currentPost._id === postId)) {
          state.currentPost = null;
        }
      });
  },
});

// Export actions
export const { 
  resetFeed, 
  updatePostInList, 
  incrementCommentCount 
} = feedSlice.actions;

// Selectors
export const selectPosts = (state) => state.feed.posts;
export const selectCurrentPost = (state) => state.feed.currentPost;
export const selectPostCount = (state) => state.feed.postCount;
export const selectHasMore = (state) => state.feed.hasMore;
export const selectPage = (state) => state.feed.page;

// Export reducer
export default feedSlice.reducer;
