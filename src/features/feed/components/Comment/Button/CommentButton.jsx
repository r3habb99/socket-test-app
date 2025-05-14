import React, { useState } from "react";
import { Button, Tooltip, Spin } from "antd";
import { FaRegComment } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./CommentButton.css";

/**
 * Button component for commenting on posts
 * @param {Object} props - Component props
 * @param {Object} props.post - The post object
 * @param {Function} props.getPostId - Function to get post ID
 * @returns {JSX.Element} CommentButton component
 */
export const CommentButton = ({
  post,
  getPostId
}) => {
  const [actionInProgress, setActionInProgress] = useState(false);
  const navigate = useNavigate();

  const postId = getPostId(post);

  // Handle comment button click
  const handleCommentClick = () => {
    setActionInProgress(true);
    // Navigate to the comments page
    navigate(`/comments/${postId}`);
    // Reset action in progress after a short delay to show loading state
    setTimeout(() => {
      setActionInProgress(false);
    }, 300);
  };



  return (
    <div className="post-action-group">
      <Tooltip title="Comment">
        <Button
          type="text"
          onClick={handleCommentClick}
          className="post-action-button comment-button"
          aria-label="Comment"
          icon={actionInProgress ? <Spin size="small" /> : <FaRegComment />}
          disabled={actionInProgress}
        />
      </Tooltip>
      <span className="post-action-count">{post.commentCount || post.comments?.length || post.commentsCount || 0}</span>
    </div>
  );
};

export default CommentButton;
