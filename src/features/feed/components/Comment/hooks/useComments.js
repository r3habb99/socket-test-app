import { useState, useCallback, useEffect, useRef } from 'react';
import { getComments } from '../../../api/commentApi';
import {
  processCommentsResponse,
  sortComments as sortCommentsHelper
} from '../utils/commentHelpers';

/**
 * Custom hook for fetching and managing comments
 * @param {string} postId - ID of the post to fetch comments for
 * @param {Object} options - Options for fetching comments
 * @param {string} [options.initialSortOrder='newest'] - Initial sort order for comments
 * @param {boolean} [options.parentOnly=true] - Whether to only fetch top-level comments
 * @param {number} [options.limit=10] - Number of comments to fetch per page
 * @returns {Object} Comments state and functions
 */
export const useComments = (postId, options = {}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState(options.initialSortOrder || 'newest');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: options.limit || 10,
    hasMore: true
  });

  // Use refs to avoid dependency cycles
  const paginationRef = useRef(pagination);
  const sortOrderRef = useRef(sortOrder);
  const optionsRef = useRef(options);
  const fetchInProgressRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    sortOrderRef.current = sortOrder;
  }, [sortOrder]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Fetch comments for the post
  const fetchComments = useCallback(async (refresh = false) => {
    if (!postId || fetchInProgressRef.current) return;

    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Get current values from refs
      const currentPagination = paginationRef.current;
      const currentSortOrder = sortOrderRef.current;
      const currentOptions = optionsRef.current;

      // Reset pagination if refreshing
      if (refresh) {
        setPagination(prev => ({
          ...prev,
          page: 1,
          hasMore: true
        }));
      }


      const response = await getComments(postId, {
        sort: currentSortOrder,
        parentOnly: currentOptions.parentOnly !== undefined ? currentOptions.parentOnly : true,
        page: refresh ? 1 : currentPagination.page,
        limit: currentPagination.limit
      });


      const commentsData = processCommentsResponse(response);

      // Update comments state
      if (refresh) {
        setComments(commentsData);
      } else {
        setComments(prev => {
          // Combine previous and new comments, avoiding duplicates
          const existingIds = new Set(prev.map(comment => comment._id || comment.id));
          const newComments = commentsData.filter(
            comment => !existingIds.has(comment._id || comment.id)
          );
          return [...prev, ...newComments];
        });
      }

      // Update pagination
      setPagination(prev => ({
        ...prev,
        page: refresh ? 2 : prev.page + 1,
        hasMore: commentsData.length === currentPagination.limit
      }));
    } catch (err) {
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [postId]); // Only depend on postId to avoid re-creating this function

  // Load more comments
  const loadMoreComments = useCallback(() => {
    if (!loading && pagination.hasMore && !fetchInProgressRef.current) {
      fetchComments(false);
    }
  }, [fetchComments, loading, pagination.hasMore]);

  // Refresh comments
  const refreshComments = useCallback(() => {
    if (!fetchInProgressRef.current) {
      fetchComments(true);
    }
  }, [fetchComments]);

  // Change sort order
  const changeSortOrder = useCallback((newSortOrder) => {
    if (newSortOrder !== sortOrder) {
      setSortOrder(newSortOrder);
      // Refresh comments with new sort order after state update
      setTimeout(() => {
        if (!fetchInProgressRef.current) {
          fetchComments(true);
        }
      }, 0);
    }
  }, [sortOrder, fetchComments]);

  // Sort comments locally
  const sortCommentsLocally = useCallback((commentsToSort) => {
    return sortCommentsHelper(commentsToSort, sortOrder);
  }, [sortOrder]);

  // Add a new comment to the list
  const addComment = useCallback((newComment) => {
    setComments(prev => {
      // Check if comment already exists
      const exists = prev.some(
        comment => (comment._id || comment.id) === (newComment._id || newComment.id)
      );
      if (exists) return prev;

      // Add new comment and sort
      const updatedComments = [...prev, newComment];
      return sortCommentsHelper(updatedComments, sortOrder);
    });
  }, [sortOrder]);

  // Update a comment in the list
  const updateComment = useCallback((updatedComment) => {
    setComments(prev =>
      prev.map(comment =>
        (comment._id || comment.id) === (updatedComment._id || updatedComment.id)
          ? updatedComment
          : comment
      )
    );
  }, []);

  // Remove a comment from the list
  const removeComment = useCallback((commentId) => {
    setComments(prev =>
      prev.filter(comment =>
        (comment._id || comment.id) !== commentId
      )
    );
  }, []);

  // Initial fetch - only run once when postId changes
  useEffect(() => {
    if (postId) {
      fetchComments(true);
    }

    // Cleanup function to reset state when postId changes
    return () => {
      setComments([]);
      setPagination({
        page: 1,
        limit: options.limit || 10,
        hasMore: true
      });
    };
  }, [postId, fetchComments, options.limit]);

  return {
    comments,
    loading,
    error,
    sortOrder,
    pagination,
    fetchComments: refreshComments, // Alias for refreshComments
    refreshComments,                // Explicit refresh function
    loadMoreComments,
    changeSortOrder,
    sortCommentsLocally,
    addComment,
    updateComment,
    removeComment
  };
};

export default useComments;
