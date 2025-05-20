import React, { useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { Button, Tooltip, Spin } from "antd";
import { toast } from "react-toastify";
import { likePost } from "../../api/postApi";
import { useSocketContext } from "../../../../features/socket/components/SocketProviderCompat";
import "./LikeButton.css";

/**
 * LikeButton component for liking/unliking posts
 * @param {Object} props - Component props
 * @param {Object} props.post - The post object
 * @param {Function} props.setPosts - Function to update posts state
 * @param {Function} props.onPostsUpdated - Callback function to refresh posts
 * @param {Function} props.getPostId - Function to get post ID
 * @returns {JSX.Element} LikeButton component
 */
export const LikeButton = ({
  post,
  setPosts,
  onPostsUpdated,
  getPostId
}) => {
  const [actionInProgress, setActionInProgress] = useState(false);
  const { connected, emit } = useSocketContext();
  const postId = getPostId(post);

  /**
   * Check if post is liked by current user
   * @param {Object} post - The post object
   * @returns {boolean} True if post is liked
   */
  const isPostLiked = (post) => {
    // Check if post has a 'liked' property
    if (post.liked !== undefined) {
      return post.liked;
    }

    // Check if post has likes array and current user's ID is in it
    const userId = localStorage.getItem('userId');
    return post.likes && Array.isArray(post.likes) && post.likes.includes(userId);
  };

  /**
   * Handle like/unlike action
   */
  const handleLike = async () => {
    if (actionInProgress) return;

    setActionInProgress(true);
    try {
      const response = await likePost(postId);

      if (response.error) {
        toast.error("Error liking post. Please try again.");
        return;
      }

      const updatedPost = response.data;

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          getPostId(p) === postId ? { ...p, ...updatedPost } : p
        )
      );

      // Emit socket event if connected
      if (connected && emit) {
        emit("post liked", updatedPost);
      }
    } catch (error) {
      toast.error("Error liking/unliking post. Please try again.");
    } finally {
      setActionInProgress(false);
      if (onPostsUpdated) onPostsUpdated();
    }
  };

  const liked = isPostLiked(post);

  return (
    <div className="like-button-container post-action-group">
      <Tooltip title={liked ? "Unlike" : "Like"}>
        <Button
          type="text"
          onClick={handleLike}
          className={`post-action-button like-button ${liked ? 'liked' : ''}`}
          disabled={actionInProgress}
          aria-label="Like"
          icon={
            actionInProgress ? (
              <Spin size="small" />
            ) : (
              liked ? <FaHeart /> : <FaRegHeart />
            )
          }
        />
      </Tooltip>
      <span className="post-action-count">{post.likes?.length || 0}</span>
    </div>
  );
};

export default LikeButton;
