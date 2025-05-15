import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Typography, Button, Tooltip, Popconfirm, Form, Input, Spin } from "antd";
import {
  HeartOutlined,
  HeartFilled,
  MessageOutlined,
  DeleteOutlined,
  EditOutlined
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { DEFAULT_PROFILE_PIC } from "../../../../../constants";
import { getImageUrl } from "../../../../../shared/utils/imageUtils";
import { ImageProxy } from "../../../../../shared/components";
import { formatTimestamp } from "../../../components/PostList/PostListHelpers";
import { toggleCommentLike, editComment, deleteComment } from "../../../api/commentApi";
import CommentForm from "../Form";
import CommentList from "../List";
import { getProcessedProfilePicUrl } from "../utils/commentHelpers";
import { useReplies } from "../hooks";
import "./CommentItem.css";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * Component to display a single comment with actions
 * @param {Object} props - Component props
 * @param {Object} props.comment - Comment object
 * @param {string} props.postId - ID of the post this comment belongs to
 * @param {Function} props.onCommentUpdated - Callback function when a comment is updated
 * @param {Array} props.replies - Array of reply comments
 * @returns {JSX.Element} CommentItem component
 */
export const CommentItem = ({ comment, postId, onCommentUpdated }) => {
  const navigate = useNavigate();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editCharCount, setEditCharCount] = useState(comment.content ? comment.content.length : 0);
  const [actionInProgress, setActionInProgress] = useState(false);

  const MAX_CHARS = 280; // Twitter-like character limit

  // Get current user ID from localStorage
  const currentUserId = localStorage.getItem("userId");

  // Use our custom hook for replies
  const commentId = comment._id || comment.id;
  const {
    replies,
    loading: loadingReplies,
    addReply,
    loadMoreReplies,
    pagination: replyPagination
  } = useReplies(commentId, postId);


  const rawAuthor = comment?.author ?? comment?.postedBy ?? comment?.replyTo?.author ?? {};
 

  // Process the author's profile picture URL
  const authorProfilePic = getProcessedProfilePicUrl(rawAuthor.profilePic);

  // Create a processed author object with fallbacks for all fields
  const author = {
    ...rawAuthor,
    profilePic: authorProfilePic,
    username: rawAuthor.username || "user",
    firstName: rawAuthor.firstName || rawAuthor.name || rawAuthor.username || "User",
    lastName: rawAuthor.lastName || "",
    isVerified: rawAuthor.isVerified || false,
    _id: rawAuthor._id || rawAuthor.id || "unknown",
    id: rawAuthor.id || rawAuthor._id || "unknown"
  };

  // Check if the current user is the author of the comment
  const isAuthor = currentUserId === (author._id || author.id);

  // State to track if the current user has liked the comment
  const [hasLiked, setHasLiked] = useState(false);

  // Update hasLiked state when comment.likes changes
  useEffect(() => {
    const userHasLiked = comment.likes?.some(
      like => like === currentUserId || like._id === currentUserId || like.id === currentUserId
    );
    setHasLiked(userHasLiked || false);
  }, [comment.likes, currentUserId]);



  // Navigate to user profile
  const navigateToUserProfile = () => {
    const userId = author._id || author.id;
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  // Handle like/unlike comment
  const handleLikeToggle = async () => {
    if (actionInProgress) return;

    // Optimistically update the UI for immediate feedback
    const wasLiked = hasLiked;
    setHasLiked(!wasLiked);

    // If the user is liking the comment, optimistically increment the like count
    // If the user is unliking the comment, optimistically decrement the like count
    const likesCount = comment.likes?.length || 0;
    const newLikesCount = wasLiked ? Math.max(0, likesCount - 1) : likesCount + 1;
    comment.likes = Array(newLikesCount).fill(currentUserId);

    setActionInProgress(true);
    try {
      const commentId = comment._id || comment.id;
      const response = await toggleCommentLike(commentId);

      if (!response.error) {
        // Extract updated comment data from response
        const updatedComment = response.data.data ? response.data.data : response.data;

        // Update the local comment state with the updated likes from the server
        comment.likes = updatedComment.likes;

        // Update the comment in the parent component
        if (onCommentUpdated) {
          onCommentUpdated();
        }
      } else {
        // Revert the optimistic update if there was an error
        setHasLiked(wasLiked);
        comment.likes = Array(likesCount).fill(currentUserId);

        toast.error(response.message || `Failed to ${wasLiked ? 'unlike' : 'like'} comment`);
      }
    } catch (error) {
      // Revert the optimistic update if there was an error
      setHasLiked(wasLiked);
      comment.likes = Array(likesCount).fill(currentUserId);

      console.error(`Error toggling like on comment:`, error);
      toast.error(`An error occurred while ${wasLiked ? 'unliking' : 'liking'} the comment`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle reply to comment
  const handleReplyClick = () => {
    setIsReplying(true);
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setIsReplying(false);
  };

  // Handle reply added
  const handleReplyAdded = (newReply) => {
    setIsReplying(false);

    // Add the reply using our custom hook
    addReply(newReply);

    // Update the comment in the parent component
    if (onCommentUpdated) {
      onCommentUpdated();
    }
  };

  // Handle edit comment
  const handleEditClick = () => {
    setEditContent(comment.content);
    setEditCharCount(comment.content ? comment.content.length : 0);
    setIsEditing(true);
  };

  // Handle edit content change
  const handleEditContentChange = (e) => {
    const value = e.target.value;
    setEditContent(value);
    setEditCharCount(value.length);
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (actionInProgress) return;
    if (!editContent.trim()) {
      toast.warning("Comment cannot be empty");
      return;
    }

    if (editContent.length > MAX_CHARS) {
      toast.warning(`Comment is too long (maximum ${MAX_CHARS} characters)`);
      return;
    }

    setActionInProgress(true);
    try {
      const commentId = comment._id || comment.id;
      const response = await editComment(commentId, { content: editContent.trim() });

      if (!response.error) {
        // Extract updated comment data from response
        const updatedComment = response.data.data ? response.data.data : response.data;

        // Update the local comment state with the updated content
        // This provides immediate feedback to the user
        comment.content = updatedComment.content;

        setIsEditing(false);

        // Update the comment in the parent component
        if (onCommentUpdated) {
          onCommentUpdated();
        }

        toast.success("Comment updated successfully");
      } else {
        toast.error(response.message || "Failed to update comment");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("An error occurred while updating the comment");
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async () => {
    if (actionInProgress) return;

    setActionInProgress(true);
    try {
      const commentId = comment._id || comment.id;
      const response = await deleteComment(commentId);

      if (!response.error) {
        // Update the comment in the parent component
        if (onCommentUpdated) {
          onCommentUpdated();
        }

        toast.success("Comment deleted successfully");
      } else {
        toast.error(response.message || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("An error occurred while deleting the comment");
    } finally {
      setActionInProgress(false);
    }
  };




  return (
    <div className="comment-item">
      <div className="comment-header">
        <Avatar
          size={40}
          src={
            <ImageProxy
              src={getImageUrl(author.profilePic, DEFAULT_PROFILE_PIC)}
              alt={author.username || "User"}
              defaultSrc={DEFAULT_PROFILE_PIC}
            />
          }
          className="comment-avatar clickable"
          onClick={navigateToUserProfile}
        />

        <div className="comment-user-info">
          <div className="comment-user-name-container">
            <Text
              strong
              className="comment-user-name clickable"
              onClick={navigateToUserProfile}
            >
              {author.firstName || author.username || "User"}{" "}
              {author.lastName || ""}
              {author.isVerified && <span className="verified-badge">✓</span>}
            </Text>

            <Text
              type="secondary"
              className="comment-user-handle clickable"
              onClick={navigateToUserProfile}
            >
              @{author.username || "user"}
            </Text>

            <Text type="secondary" className="comment-timestamp">
              {formatTimestamp(comment.createdAt)}
            </Text>
          </div>
        </div>
      </div>

      <div className="comment-content">
        {isEditing ? (
          <Form className="edit-comment-form">
            <Form.Item>
              <TextArea
                value={editContent}
                onChange={handleEditContentChange}
                autoSize={{ minRows: 2, maxRows: 6 }}
                maxLength={MAX_CHARS + 1} // Allow one extra character to trigger validation
              />
            </Form.Item>
            <div className="edit-form-footer">
              <div className="char-counter">
                <Text
                  type={editCharCount > MAX_CHARS ? "danger" : editCharCount > MAX_CHARS * 0.8 ? "warning" : "secondary"}
                >
                  {editCharCount}/{MAX_CHARS}
                </Text>
              </div>
              <div className="edit-actions">
                <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button
                  type="primary"
                  onClick={handleEditSubmit}
                  loading={actionInProgress}
                  disabled={!editContent.trim() || editCharCount > MAX_CHARS}
                >
                  Save
                </Button>
              </div>
            </div>
          </Form>
        ) : (
          <>
            <Paragraph className="comment-text">{comment.content}</Paragraph>

            {/* Display media if available */}
            {comment.media && comment.media.length > 0 && (
              <div className="comment-media-container">
                {comment.media.map((mediaUrl, index) => {
                  const placeholderImage = "https://via.placeholder.com/400x300?text=Image+Loading...";

                  return (
                    <div key={index} className="comment-media">
                      <ImageProxy
                        src={getImageUrl(mediaUrl, placeholderImage)}
                        alt={`Comment media ${index + 1}`}
                        className="comment-media-image"
                        defaultSrc={placeholderImage}
                        onError={() => {
                          // Silent error handling - fallback to placeholder image
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="comment-actions">
        {/* Like button */}
        <div className="comment-action-group">
          <Tooltip title={hasLiked ? "Unlike" : "Like"}>
            <Button
              type="text"
              onClick={handleLikeToggle}
              className="comment-action-button like-button"
              aria-label={hasLiked ? "Unlike" : "Like"}
              icon={hasLiked ? <HeartFilled style={{ color: '#e0245e' }} /> : <HeartOutlined />}
              disabled={actionInProgress}
            />
          </Tooltip>
          <span className="comment-action-count">{comment.likes?.length || 0}</span>
        </div>

        {/* Reply button */}
        <div className="comment-action-group">
          <Tooltip title="Reply">
            <Button
              type="text"
              onClick={handleReplyClick}
              className="comment-action-button"
              aria-label="Reply"
              icon={<MessageOutlined />}
              disabled={actionInProgress}
            />
          </Tooltip>
        </div>

        {/* Edit button (only for author) */}
        {isAuthor && (
          <div className="comment-action-group">
            <Tooltip title="Edit">
              <Button
                type="text"
                onClick={handleEditClick}
                className="comment-action-button"
                aria-label="Edit"
                icon={<EditOutlined />}
                disabled={actionInProgress}
              />
            </Tooltip>
          </div>
        )}

        {/* Delete button (only for author) */}
        {isAuthor && (
          <div className="comment-action-group">
            <Popconfirm
              title="Delete this comment?"
              description="This action cannot be undone."
              onConfirm={handleDeleteComment}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  className="comment-action-button delete-button"
                  aria-label="Delete"
                  icon={<DeleteOutlined />}
                  disabled={actionInProgress}
                />
              </Tooltip>
            </Popconfirm>
          </div>
        )}
      </div>

      {/* Reply form */}
      {isReplying && (
        <div className="comment-reply-form">
          <CommentForm
            postId={postId}
            replyToId={comment._id || comment.id}
            onCommentAdded={handleReplyAdded}
            onCancel={handleCancelReply}
          />
        </div>
      )}

      {/* Replies count indicator */}
      {(replies.length > 0 || comment.replyCount > 0 || comment.replies?.length > 0) && (
        <div className="comment-replies-count">
          <Text type="secondary">
            {`${replies.length || comment.replyCount || comment.replies?.length || 0} ${(replies.length === 1 || comment.replyCount === 1 || comment.replies?.length === 1) ? 'reply' : 'replies'}`}
          </Text>
        </div>
      )}

      {/* Replies - always visible */}
      <>
        {loadingReplies && replies.length === 0 ? (
          <div className="comment-loading-container">
            <Spin size="small" />
          </div>
        ) : (
          <>
            {replies.length > 0 && (
              <div className="comment-replies-container">
                <CommentList
                  comments={replies}
                  postId={postId}
                  onCommentUpdated={onCommentUpdated}
                  isNested={true}
                />

                {replyPagination.hasMore && (
                  <div className="load-more-replies">
                    <Button
                      type="link"
                      onClick={loadMoreReplies}
                      loading={loadingReplies}
                    >
                      Load more replies
                    </Button>
                  </div>
                )}

                {loadingReplies && replies.length > 0 && (
                  <div className="comment-loading-container">
                    <Spin size="small" />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </>
    </div>
  );
};

export default CommentItem;