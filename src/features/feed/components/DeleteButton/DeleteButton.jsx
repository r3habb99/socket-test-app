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
    const userId = localStorage.getItem('userId');
    if (!userId || !post) return false;

    // Check different possible structures
    if (post.postedBy) {
      const postedById = post.postedBy.id || post.postedBy._id;
      return postedById === userId;
    }

    // If post has userId field
    if (post.userId) {
      return post.userId === userId;
    }

    // If post has user field
    if (post.user) {
      const postUserId = post.user.id || post.user._id;
      return postUserId === userId;
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
  if (!isOwnPost(post)) {
    return null;
  }

  return (
    <div className="delete-button-container post-action-group">
      <Popconfirm
        title="Delete post"
        description="Are you sure you want to delete this post?"
        onConfirm={handleDelete}
        okText="Yes"
        cancelText="No"
        placement="top"
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
          />
        </Tooltip>
      </Popconfirm>
    </div>
  );
};

export default DeleteButton;
