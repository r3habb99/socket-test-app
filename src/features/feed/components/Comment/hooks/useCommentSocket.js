import { useEffect, useCallback } from 'react';
import { useSocketContext } from '../../../../../core/providers/SocketProvider';
import { getCommentId } from '../utils/commentHelpers';

/**
 * Custom hook for handling comment socket events
 * @param {string} postId - ID of the post to listen for comment events
 * @param {Function} addComment - Function to add a new comment
 * @param {Function} updateComment - Function to update an existing comment
 * @param {Function} removeComment - Function to remove a comment
 * @param {boolean} [enabled=true] - Whether the socket listeners are enabled
 * @returns {Object} Socket event handlers and subscription functions
 */
export const useCommentSocket = (
  postId,
  addComment,
  updateComment,
  removeComment,
  enabled = true
) => {
  const { subscribe } = useSocketContext();

  // Handler for new comment events
  const handleNewComment = useCallback((data) => {
    if (data.postId === postId) {
      addComment(data);
    }
  }, [postId, addComment]);

  // Handler for comment liked events
  const handleCommentLiked = useCallback((data) => {
    if (data.postId === postId) {
      updateComment(data);
    }
  }, [postId, updateComment]);

  // Handler for comment deleted events
  const handleCommentDeleted = useCallback((data) => {
    if (data.postId === postId) {
      removeComment(getCommentId(data));
    }
  }, [postId, removeComment]);

  // Handler for comment updated events
  const handleCommentUpdated = useCallback((data) => {
    if (data.postId === postId) {
      updateComment(data);
    }
  }, [postId, updateComment]);

  // Subscribe to socket events
  useEffect(() => {
    if (!enabled || !postId) return;

    // Subscribe to events
    const unsubscribeNewComment = subscribe("new comment", handleNewComment);
    const unsubscribeCommentLiked = subscribe("comment liked", handleCommentLiked);
    const unsubscribeCommentDeleted = subscribe("comment deleted", handleCommentDeleted);
    const unsubscribeCommentUpdated = subscribe("comment updated", handleCommentUpdated);

    // Clean up subscriptions
    return () => {
      unsubscribeNewComment();
      unsubscribeCommentLiked();
      unsubscribeCommentDeleted();
      unsubscribeCommentUpdated();
    };
  }, [
    postId,
    enabled,
    subscribe,
    handleNewComment,
    handleCommentLiked,
    handleCommentDeleted,
    handleCommentUpdated
  ]);

  return {
    handleNewComment,
    handleCommentLiked,
    handleCommentDeleted,
    handleCommentUpdated
  };
};

export default useCommentSocket;
