import { useState, useCallback, useEffect, useRef } from 'react';
import { getCommentReplies } from '../../../api/commentApi';
import { processCommentsResponse, extractPaginationData } from '../utils/commentHelpers';

/**
 * Custom hook for fetching and managing comment replies
 * @param {string} commentId - ID of the parent comment
 * @param {string} postId - ID of the post
 * @returns {Object} Replies state and functions
 */
export const useReplies = (commentId, postId) => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    hasMore: true,
    total: 0
  });
  const [showReplies, setShowReplies] = useState(true);

  // Use a ref to track if we've already fetched replies for this comment
  const initialFetchDoneRef = useRef(false);

  // Use a ref to track if a fetch is in progress
  const fetchInProgressRef = useRef(false);

  // Fetch replies for the comment
  const fetchReplies = useCallback(async (refresh = false) => {
    if (!commentId || fetchInProgressRef.current) return;

    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Reset pagination if refreshing
      if (refresh) {
        setPagination(prev => ({
          ...prev,
          page: 1,
          hasMore: true
        }));
      }


      const response = await getCommentReplies(commentId, {
        page: refresh ? 1 : pagination.page,
        limit: pagination.limit
      });

     
      // Process the response to extract comments and pagination data
      let repliesData = [];
      let paginationData = extractPaginationData(response);

      if (response && !response.error) {
        // Check for the specific structure in the response
        if (response.data?.data?.replies && Array.isArray(response.data.data.replies)) {
          repliesData = response.data.data.replies;
        } else if (response.data?.data?.comments && Array.isArray(response.data.data.comments)) {
          repliesData = response.data.data.comments;
        } else {
          // Fall back to the generic processor if the structure is different
          repliesData = processCommentsResponse(response);
        }
      }

     
      // Update replies state
      if (refresh) {
        setReplies(repliesData);
      } else {
        setReplies(prev => {
          // Combine previous and new replies, avoiding duplicates
          const existingIds = new Set(prev.map(reply => reply._id || reply.id));
          const newReplies = repliesData.filter(
            reply => !existingIds.has(reply._id || reply.id)
          );
          return [...prev, ...newReplies];
        });
      }

      // Update pagination
      setPagination(prev => ({
        ...prev,
        page: refresh ? 2 : prev.page + 1,
        hasMore: paginationData.hasMore,
        total: paginationData.total
      }));
    } catch (err) {
      console.error('Error fetching replies:', err);
      setError('Failed to load replies. Please try again.');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [commentId, pagination.page, pagination.limit]);

  // Load more replies
  const loadMoreReplies = useCallback(() => {
    if (!loading && pagination.hasMore) {
      fetchReplies(false);
    }
  }, [fetchReplies, loading, pagination.hasMore]);

  // Toggle showing replies
  const toggleReplies = useCallback(() => {
    const newShowReplies = !showReplies;
    setShowReplies(newShowReplies);

    // Fetch replies if showing and not already loaded or if we need to refresh
    // Only fetch if we haven't already done the initial fetch and we're not currently loading
    if (newShowReplies && replies.length === 0 && !initialFetchDoneRef.current && !loading && !fetchInProgressRef.current) {
     fetchReplies(true);
      initialFetchDoneRef.current = true;
    }
  }, [showReplies, replies.length, loading, fetchReplies]);

  // Add a new reply
  const addReply = useCallback((newReply) => {
    if (newReply.postId === postId && newReply.replyToId === commentId) {
      // Mark that we've received at least one reply
      initialFetchDoneRef.current = true;

      setReplies(prev => {
        // Check if reply already exists
        const exists = prev.some(
          reply => (reply._id || reply.id) === (newReply._id || newReply.id)
        );
        if (exists) return prev;

        // Add new reply
        return [...prev, newReply];
      });

      // Show replies if not already showing
      if (!showReplies) {
        setShowReplies(true);
      }
    }
  }, [postId, commentId, showReplies]);

  // Update a reply
  const updateReply = useCallback((updatedReply) => {
    if (updatedReply.replyToId === commentId) {
      setReplies(prev =>
        prev.map(reply =>
          (reply._id || reply.id) === (updatedReply._id || updatedReply.id)
            ? updatedReply
            : reply
        )
      );
    }
  }, [commentId]);

  // Remove a reply
  const removeReply = useCallback((replyId) => {
    setReplies(prev =>
      prev.filter(reply =>
        (reply._id || reply.id) !== replyId
      )
    );
  }, []);

  // Reset initialFetchDoneRef when commentId changes
  useEffect(() => {
    initialFetchDoneRef.current = false;
  }, [commentId]);

  // Automatically fetch replies when the component mounts, but only once
  useEffect(() => {
    if (commentId && !initialFetchDoneRef.current && !loading && !fetchInProgressRef.current) {
     fetchReplies(true);
      initialFetchDoneRef.current = true;
    }
  }, [commentId, loading, fetchReplies]);

  return {
    replies,
    loading,
    error,
    pagination,
    showReplies,
    fetchReplies,
    loadMoreReplies,
    toggleReplies,
    addReply,
    updateReply,
    removeReply,
    setReplies
  };
};

export default useReplies;
