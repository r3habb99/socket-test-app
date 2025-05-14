import React, { useState } from "react";
import { Button, Tooltip, Spin, Modal } from "antd";
import { FaReply } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { CreatePost } from "../CreatePost/CreatePost";
import "./ReplyButton.css";

/**
 * Button component for replying to posts
 * @param {Object} props - Component props
 * @param {Object} props.post - The post object
 * @param {Function} props.setPosts - Function to update posts state
 * @param {Function} props.onPostsUpdated - Callback function to refresh posts
 * @param {Function} props.getPostId - Function to get post ID
 * @returns {JSX.Element} ReplyButton component
 */
export const ReplyButton = ({
  post,
  setPosts,
  onPostsUpdated,
  getPostId
}) => {
  const [actionInProgress, setActionInProgress] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const navigate = useNavigate();

  const postId = getPostId(post);

  // Handle reply button click
  const handleReplyClick = () => {
    setActionInProgress(true);
    // Show the reply modal
    setModalVisible(true);
    // Reset action in progress after a short delay to show loading state
    setTimeout(() => {
      setActionInProgress(false);
    }, 300);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
  };

  // Handle post created (reply added)
  const handleReplyAdded = (newReply) => {
    console.log("Reply added successfully:", newReply);

    // Close the modal
    setModalVisible(false);

    // Refresh the posts to show the new reply
    if (onPostsUpdated) {
      onPostsUpdated();
    }
  };

  return (
    <>
      <div className="post-action-group">
        <Tooltip title="Reply">
          <Button
            type="text"
            onClick={handleReplyClick}
            className="post-action-button reply-button"
            aria-label="Reply"
            icon={actionInProgress ? <Spin size="small" /> : <FaReply />}
            disabled={actionInProgress}
          />
        </Tooltip>
        <span className="post-action-count">
          {post.repliesCount || post.replies?.length || 0}
        </span>
      </div>

      {/* Reply Modal */}
      <Modal
        title="Reply to Post"
        open={modalVisible}
        onCancel={handleModalClose}
        afterClose={() => console.log("Modal closed")}
        maskClosable={false}
        footer={null}
        width={600}
        className="reply-modal"
      >
        <div className="reply-to-post">
          <div className="reply-to-info">
            <p>
              <strong>Replying to @{post.postedBy?.username || "user"}</strong>
            </p>
            <p className="reply-to-content">{post.content}</p>
          </div>

          {modalVisible && (
            <CreatePost
              onPostCreated={handleReplyAdded}
              replyTo={postId}
              isReply={true}
            />
          )}
        </div>
      </Modal>
    </>
  );
};

export default ReplyButton;
