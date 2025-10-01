import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { Button, Tooltip, Spin, Popconfirm } from "antd";
import { toast } from "react-toastify";
import { deletePost } from "../../api/postApi";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import "./DeleteButton.css";

/**
 * DeleteButton component for deleting posts
 * @param {Object} props - Component props
 * @param {Object} props.post - The post object
 * @param {Function} props.setPosts - Function to update posts state
 * @param {Function} props.getPostId - Function to get post ID
 * @returns {JSX.Element} DeleteButton component
 */
export const DeleteButton = ({
  post,
  setPosts,
  getPostId
}) => {
  const [actionInProgress, setActionInProgress] = useState(false);
  const { connected, emit } = useSocketContext();
  const postId = getPostId(post);

  /**
   * Check if post belongs to the logged-in user
   * @param {Object} post - The post object
   * @returns {boolean} True if post belongs to the user
   */
  const isOwnPost = (post) => {
    // Get user authentication data
    const userId = localStorage.getItem('userId');
    const currentUsername = localStorage.getItem('username');
    const userEmail = localStorage.getItem('email');

    // If no authentication data or no post, return false
    if ((!userId && !currentUsername) || !post) return false;

    // Helper function to compare IDs (handles string vs object ID comparison)
    const compareIds = (id1, id2) => {
      if (!id1 || !id2) return false;
      return String(id1).trim() === String(id2).trim();
    };

    // Helper function to compare usernames
    const compareUsernames = (username1, username2) => {
      if (!username1 || !username2) return false;
      return String(username1).toLowerCase().trim() === String(username2).toLowerCase().trim();
    };

    // Check different possible structures

    // 1. Check postedBy structure (most common)
    if (post.postedBy) {
      // Check ID match
      const postedById = post.postedBy.id || post.postedBy._id;
      if (userId && postedById && compareIds(postedById, userId)) {
        return true;
      }

      // Check username match
      if (currentUsername && post.postedBy.username &&
          compareUsernames(post.postedBy.username, currentUsername)) {
        return true;
      }

      // Check email match
      if (userEmail && post.postedBy.email &&
          post.postedBy.email.toLowerCase() === userEmail.toLowerCase()) {
        return true;
      }
    }

    // 2. Check userId field
    if (userId && post.userId && compareIds(post.userId, userId)) {
      return true;
    }

    // 3. Check user field
    if (post.user) {
      // Check ID match
      const postUserId = post.user.id || post.user._id;
      if (userId && postUserId && compareIds(postUserId, userId)) {
        return true;
      }

      // Check username match
      if (currentUsername && post.user.username &&
          compareUsernames(post.user.username, currentUsername)) {
        return true;
      }

      // Check email match
      if (userEmail && post.user.email &&
          post.user.email.toLowerCase() === userEmail.toLowerCase()) {
        return true;
      }
    }

    // 4. Check direct fields on post
    if (currentUsername && post.username &&
        compareUsernames(post.username, currentUsername)) {
      return true;
    }

    // 5. Check author field (some APIs use this)
    if (post.author) {
      const authorId = post.author.id || post.author._id;
      if (userId && authorId && compareIds(authorId, userId)) {
        return true;
      }

      if (currentUsername && post.author.username &&
          compareUsernames(post.author.username, currentUsername)) {
        return true;
      }
    }

    // 6. Check for direct ID match
    if (userId && (post.id || post._id) &&
        (compareIds(post.id, userId) || compareIds(post._id, userId))) {
      // This is a special case where the post itself might be the user object
      return true;
    }

    return false;
  };

  /**
   * Handle delete action
   */
  const handleDelete = async () => {
    if (actionInProgress) return;

    setActionInProgress(true);
    try {
      const response = await deletePost(postId);

      if (response.error) {
        toast.error("Failed to delete post. Please try again.");
        return;
      }

      setPosts((prevPosts) => prevPosts.filter((p) => getPostId(p) !== postId));

      // Show success message
      toast.success("Post deleted successfully!");

      // Emit socket event if connected
      if (connected && emit) {
        emit("post deleted", postId);
      }
    } catch (error) {
      toast.error("Failed to delete post. Please try again.");
    } finally {
      setActionInProgress(false);
    }
  };

  // Only render the delete button if it's the user's own post
  const canDelete = isOwnPost(post);

  // For debugging - log post ownership details
  console.log('Delete button visibility check:', {
    postId: getPostId(post),
    canDelete,
    userId: localStorage.getItem('userId'),
    username: localStorage.getItem('username'),
    postDetails: {
      postedBy: post.postedBy,
      userId: post.userId,
      user: post.user
    }
  });

  if (!canDelete) {
    return null;
  }

  return (
    <div className="delete-button-container post-action-group" data-testid="delete-button-container">
      <Popconfirm
        title="Delete post"
        description="Are you sure you want to delete this post?"
        onConfirm={handleDelete}
        okText="Delete"
        cancelText="Cancel"
        placement="top"
        okButtonProps={{
          danger: true
        }}
      >
        <Tooltip title="Delete">
          <Button
            type="text"
            className="post-action-button delete-button"
            disabled={actionInProgress}
            aria-label="Delete"
            icon={
              actionInProgress ? (
                <Spin size="small" />
              ) : (
                <FaTrash />
              )
            }
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        </Tooltip>
      </Popconfirm>
    </div>
  );
};

export default DeleteButton;
