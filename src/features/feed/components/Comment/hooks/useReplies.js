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


        // Check for the specific structure from the /comment/replies/{commentId} endpoint
        if (response.data?.data?.replies && Array.isArray(response.data.data.replies)) {
         repliesData = response.data.data.replies;

          // Also update pagination if available
          if (response.data.data.pagination) {
            paginationData = {
              hasMore: response.data.data.pagination.hasMore || false,
              total: response.data.data.pagination.total || 0,
              page: response.data.data.pagination.page || 1,
              limit: response.data.data.pagination.limit || 10
            };
          }
        } else if (response.data?.replies && Array.isArray(response.data.replies)) {
         repliesData = response.data.replies;

          // Also update pagination if available
          if (response.data.pagination) {
            paginationData = {
              hasMore: response.data.pagination.hasMore || false,
              total: response.data.pagination.total || 0,
              page: response.data.pagination.page || 1,
              limit: response.data.pagination.limit || 10
            };
          }
        } else {

          // Direct extraction attempt for the specific structure we know from the API
          if (response.data && response.data.statusCode === 200 && response.data.data && response.data.data.replies) {
            repliesData = response.data.data.replies;

            // Also update pagination if available
            if (response.data.data.pagination) {
              paginationData = {
                hasMore: response.data.data.pagination.hasMore || false,
                total: response.data.data.pagination.total || 0,
                page: response.data.data.pagination.page || 1,
                limit: response.data.data.pagination.limit || 10
              };
            }
          } else {
           repliesData = processCommentsResponse(response);
          }
        }

        // Ensure all replies have the correct replyToId and author data
        repliesData = repliesData.map(reply => {
          // If the reply doesn't have a replyToId but has a replyTo object, extract the ID
          if (!reply.replyToId && reply.replyTo) {
            reply.replyToId = reply.replyTo.id || reply.replyTo._id;
          }

          // If the reply doesn't have a replyToId at all, set it to the current commentId
          if (!reply.replyToId) {
            reply.replyToId = commentId;
          }

          // Ensure author data is available
          if (!reply.author && reply.postedBy) {
            reply.author = reply.postedBy;
          } else if (!reply.postedBy && reply.author) {
            reply.postedBy = reply.author;
          } else if (!reply.author && !reply.postedBy && reply.replyTo?.author) {
            // If neither author nor postedBy exists, try to extract from replyTo
            reply.author = reply.replyTo.author;
            reply.postedBy = reply.replyTo.author;
          }

          // Ensure content is available
          if (!reply.content && reply.replyTo?.content) {
            reply.content = reply.replyTo.content;
          }

          return reply;
        });
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

    // Check if this is a reply to the current comment
    // Either by replyToId or by replyTo object
    const isReplyToCurrentComment =
      (newReply.replyToId === commentId) ||
      (newReply.replyTo && (newReply.replyTo.id === commentId || newReply.replyTo._id === commentId));

    if (newReply.postId === postId && isReplyToCurrentComment) {

      // Ensure the reply has the correct replyToId
      if (!newReply.replyToId) {
        newReply.replyToId = commentId;
      }

      // Ensure author data is available
      if (!newReply.author && newReply.postedBy) {
        newReply.author = newReply.postedBy;
      } else if (!newReply.postedBy && newReply.author) {
        newReply.postedBy = newReply.author;
      }

      // If we have a replyTo object with author data but no author in the reply itself
      if ((!newReply.author || !newReply.postedBy) && newReply.replyTo?.author) {
        if (!newReply.author) newReply.author = newReply.replyTo.author;
        if (!newReply.postedBy) newReply.postedBy = newReply.replyTo.author;
      }

      // Ensure content is available
      if (!newReply.content && newReply.replyTo?.content) {
        newReply.content = newReply.replyTo.content;
      }

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
