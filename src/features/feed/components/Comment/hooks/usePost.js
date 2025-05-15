import { useState, useCallback, useEffect, useRef } from 'react';
import { getPostById } from '../../../api/postApi';
import { processPostResponse } from '../utils/commentHelpers';

/**
 * Custom hook for fetching and managing a post for comments
 * @param {string} postId - ID of the post to fetch
 * @returns {Object} Post state and functions
 */
export const usePost = (postId) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchInProgressRef = useRef(false);
  const isMountedRef = useRef(true);

  // Fetch post data
  const fetchPost = useCallback(async () => {
    if (!postId || fetchInProgressRef.current) return;

    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
    const response = await getPostById(postId);
      const postData = processPostResponse(response);

      // Check if component is still mounted before updating state
      if (isMountedRef.current) {
        if (postData) {
          setPost(postData);
        } else {
          setError('Failed to load post data.');
          console.error('Failed to process post data');
        }
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      // Check if component is still mounted before updating state
      if (isMountedRef.current) {
        setError('Failed to load post. Please try again.');
      }
    } finally {
      // Check if component is still mounted before updating state
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchInProgressRef.current = false;
    }
  }, [postId]); // Only depend on postId to avoid re-creating this function

  // Update post comment count
  const updateCommentCount = useCallback((increment = 1) => {
    setPost(prevPost => {
      if (!prevPost) return prevPost;

      return {
        ...prevPost,
        commentCount: (prevPost.commentCount || 0) + increment,
        commentsCount: (prevPost.commentsCount || 0) + increment
      };
    });
  }, []);

  // Initial fetch
  useEffect(() => {
    // Set isMounted to true when the component mounts
    isMountedRef.current = true;

    if (postId) {
      fetchPost();
    }

    // Cleanup function to set isMounted to false when the component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, [postId, fetchPost]);

  return {
    post,
    loading,
    error,
    fetchPost,
    updateCommentCount,
    setPost
  };
};

export default usePost;
