import React from "react";
import { Modal, Button, Typography, Spin, Avatar } from "antd";
import CommentForm from "../Form";
import CommentList from "../List";
import { DEFAULT_PROFILE_PIC } from "../../../../../constants";
import { getImageUrl } from "../../../../../shared/utils/imageUtils";
import { ImageProxy } from "../../../../../shared/components";
import { getProcessedProfilePicUrl } from "../utils/commentHelpers";
import { usePost, useComments, useCommentSocket } from "../hooks";
import "./CommentModal.css";

const { Title, Text } = Typography;



/**
 * Modal component for displaying and creating comments on a post
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {string} props.postId - ID of the post to show comments for
 * @param {Function} props.onCommentAdded - Callback function when a comment is added
 * @returns {JSX.Element} CommentModal component
 */
export const CommentModal = ({ visible, onClose, postId, onCommentAdded }) => {
  // Use custom hooks for post and comments
  const {
    post,
    loading: postLoading,
    error: postError,
    updateCommentCount
  } = usePost(postId);

  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    sortOrder,
    changeSortOrder,
    addComment,
    updateComment,
    removeComment,
    fetchComments
  } = useComments(postId);

  // Use socket hook for real-time updates
  useCommentSocket(
    postId,
    addComment,
    updateComment,
    removeComment,
    visible // Only enable socket when modal is visible
  );

  // Fetch data when modal is opened
  React.useEffect(() => {
    if (visible && postId) {
      fetchComments(true); // Refresh comments when modal opens
    }
  }, [visible, postId, fetchComments]);

  // Handle sort order change
  const handleSortChange = (order) => {
    changeSortOrder(order);
  };

  // Handle comment added
  const handleCommentAdded = (newComment) => {
    addComment(newComment);
    updateCommentCount(1);

    // Call the callback function if provided
    if (onCommentAdded) {
      onCommentAdded(newComment);
    }
  };

  return (
    <Modal
      title="Comments"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      className="comment-modal"
    >
      {postLoading ? (
        <div className="comment-loading-container">
          <Spin size="large" />
        </div>
      ) : postError ? (
        <div className="error-container">
          <Text type="danger">{postError}</Text>
          <Button type="primary" onClick={() => fetchComments(true)}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="comment-post-content">
            {post && (
              <>
                <div className="post-author-header">
                  <Avatar
                    size={40}
                    src={
                      <ImageProxy
                        src={getImageUrl(getProcessedProfilePicUrl(post.postedBy?.profilePic), DEFAULT_PROFILE_PIC)}
                        alt={post.postedBy?.username || "User"}
                        defaultSrc={DEFAULT_PROFILE_PIC}
                      />
                    }
                    className="post-avatar"
                  />
                  <div className="post-author-info">
                    <Title level={4} className="post-author-name">
                      {post.postedBy?.firstName || post.postedBy?.username || "User"}{" "}
                      {post.postedBy?.lastName || ""}
                      {post.postedBy?.isVerified && <span className="verified-badge">✓</span>}
                    </Title>
                    <Text type="secondary" className="post-author-username">
                      @{post.postedBy?.username || "user"}
                    </Text>
                  </div>
                </div>
                <Text className="post-content">{post.content}</Text>
              </>
            )}
          </div>

          <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />

          <div className="comment-sort-options">
            <Text>Sort by: </Text>
            <Button
              type={sortOrder === "newest" ? "primary" : "text"}
              size="small"
              onClick={() => handleSortChange("newest")}
            >
              Newest
            </Button>
            <Button
              type={sortOrder === "oldest" ? "primary" : "text"}
              size="small"
              onClick={() => handleSortChange("oldest")}
            >
              Oldest
            </Button>
            <Button
              type={sortOrder === "most_liked" ? "primary" : "text"}
              size="small"
              onClick={() => handleSortChange("most_liked")}
            >
              Most Liked
            </Button>
          </div>

          {commentsLoading ? (
            <div className="comment-loading-container">
              <Spin size="small" />
            </div>
          ) : commentsError ? (
            <div className="error-container">
              <Text type="danger">{commentsError}</Text>
              <Button type="primary" onClick={() => fetchComments(true)}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              {comments.length === 0 ? (
                <div className="no-comments-message">
                  <Text type="secondary">No comments yet. Be the first to comment!</Text>
                </div>
              ) : (
                <CommentList
                  comments={comments}
                  postId={postId}
                  onCommentUpdated={() => fetchComments(true)}
                />
              )}
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default CommentModal;
