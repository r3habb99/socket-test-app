import { useState, useCallback, useRef } from 'react';
import { Form } from 'antd';
import { createCommentDirect, replyToComment } from '../../../api/commentApi';
import { toast } from 'react-toastify';

/**
 * Custom hook for managing comment form state and submission
 * @param {string} postId - ID of the post to comment on
 * @param {string} [replyToId] - ID of the comment to reply to (for nested comments)
 * @param {Function} onCommentAdded - Callback function when a comment is added
 * @param {Function} [onCancel] - Callback function when reply is canceled
 * @param {number} [maxChars=280] - Maximum number of characters allowed
 * @returns {Object} Form state and functions
 */
export const useCommentForm = ({
  postId,
  replyToId,
  onCommentAdded,
  onCancel,
  maxChars = 280
}) => {
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textAreaRef = useRef(null);

  // Handle content change
  const handleContentChange = useCallback((e) => {
    const value = e.target.value;
    setContent(value);
    setCharCount(value.length);
  }, []);

  // Focus the text area
  const focusTextArea = useCallback(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

  // Reset the form
  const resetForm = useCallback(() => {
    form.resetFields();
    setContent('');
    setCharCount(0);
  }, [form]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!content.trim() || charCount > maxChars) {
      return;
    }

    setSubmitting(true);

    try {
      let response;
      const commentContent = content.trim();



      // For both comments and replies, we'll use the same endpoint
      const commentData = {
        postId,
        content: commentContent,
        ...(replyToId && { replyToId }) // Only include replyToId if it exists
      };

      // Use the direct comment endpoint for both comments and replies
      response = await createCommentDirect(commentData);

      if (!response.error) {
        // Extract comment data from response
        const commentResponse = response.data.data ? response.data.data : response.data;

        // Get current user data from localStorage
        const currentUser = {
          id: localStorage.getItem('userId'),
          username: localStorage.getItem('username'),
          firstName: localStorage.getItem('firstName') || localStorage.getItem('username'),
          lastName: localStorage.getItem('lastName') || '',
          profilePic: localStorage.getItem('profilePic') || ''
        };

        // Create a complete comment object with user data
        const newComment = {
          ...commentResponse,
          // Ensure we have the correct author/postedBy structure
          postedBy: commentResponse.author || {
            _id: currentUser.id,
            id: currentUser.id,
            username: currentUser.username,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            profilePic: currentUser.profilePic
          },
          // Ensure replyToId is set correctly
          replyToId: commentResponse.replyToId || (commentResponse.replyTo ? (commentResponse.replyTo.id || commentResponse.replyTo._id) : replyToId),
          likes: commentResponse.likes || [],
          replies: commentResponse.replies || [],
          createdAt: commentResponse.createdAt || new Date().toISOString()
        };



        // Reset form
        resetForm();

        // Call callback function
        if (onCommentAdded) {
          onCommentAdded(newComment);
        }

        // If this is a reply and has a cancel function, call it
        if (replyToId && onCancel) {
          onCancel();
        }

        // Show success toast
        toast.success(replyToId ? 'Reply added successfully!' : 'Comment added successfully!');
      } else {
        // Show error toast
        toast.error(response.message || 'Failed to add comment. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [content, charCount, maxChars, postId, replyToId, onCommentAdded, onCancel, resetForm]);

  return {
    form,
    content,
    submitting,
    charCount,
    maxChars,
    textAreaRef,
    handleContentChange,
    handleSubmit,
    focusTextArea,
    resetForm,
    isValid: content.trim().length > 0 && charCount <= maxChars
  };
};

export default useCommentForm;
