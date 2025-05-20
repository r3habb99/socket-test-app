import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Typography, Button, Tooltip, Popconfirm, Form, Input, Spin } from "antd";
import {
  HeartOutlined,
  HeartFilled,
  MessageOutlined,
  DeleteOutlined,
  EditOutlined,
  DownOutlined,
  UpOutlined
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
export const CommentItem = ({ comment, postId, onCommentUpdated, isNested = false }) => {
  const navigate = useNavigate();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editCharCount, setEditCharCount] = useState(comment.content ? comment.content.length : 0);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [heartAnimation, setHeartAnimation] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const likeButtonRef = useRef(null);

  const MAX_CHARS = 280; // Character limit

  // Get current user ID from localStorage
  const currentUserId = localStorage.getItem("userId");

  // Use our custom hook for replies
  const commentId = comment._id || comment.id;
  const {
    replies,
    loading: loadingReplies,
    addReply,
    loadMoreReplies,
    pagination: replyPagination,
    toggleReplies: toggleRepliesHook
  } = useReplies(commentId, postId);




  // Extract author data with fallbacks
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

    // Trigger heart animation when liking
    if (!wasLiked) {
      setHeartAnimation(true);
      setTimeout(() => setHeartAnimation(false), 500);
    }

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

    // Ensure the reply has the correct replyToId
    if (!newReply.replyToId) {
      newReply.replyToId = commentId;
    }

    // Add the reply using our custom hook
    addReply(newReply);

    // Make sure replies are visible when a new reply is added
    setShowReplies(true);

    // Update the comment in the parent component
    if (onCommentUpdated) {
      onCommentUpdated();
    }
  };

  // Toggle showing/hiding replies
  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
    toggleRepliesHook();
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
      toast.error("An error occurred while deleting the comment");
    } finally {
      setActionInProgress(false);
    }
  };




  return (
    <div className={`comment-item ${isNested ? 'nested-comment-item' : ''}`}>
      <div className="comment-layout">
        <Avatar
          size={32}
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

        <div className="comment-content-wrapper">
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
              <div className="comment-content-row">
                <Text
                  strong
                  className="comment-user-name clickable"
                  onClick={navigateToUserProfile}
                >
                  {author.username || "user"}
                  {author.isVerified && <span className="verified-badge">✓</span>}
                </Text>

                <Paragraph className="comment-text">{comment.content}</Paragraph>
              </div>

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

              <div className="comment-metadata">
                <span className="comment-timestamp">
                  {formatTimestamp(comment.createdAt)}
                </span>

                {/* Like count if any */}
                {(comment.likes?.length > 0) && (
                  <span className="comment-likes-count">
                    {comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}
                  </span>
                )}

                {/* Reply button text */}
                <span
                  className="comment-reply-text clickable"
                  onClick={handleReplyClick}
                >
                  Reply
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="comment-actions">
        {/* Like button */}
        <div className="comment-action-group">
          <Button
            type="text"
            onClick={handleLikeToggle}
            className={`comment-action-button ${hasLiked ? 'like-button-active' : 'like-button'} ${heartAnimation ? 'heart-animation' : ''}`}
            aria-label={hasLiked ? "Unlike" : "Like"}
            icon={hasLiked ? <HeartFilled /> : <HeartOutlined />}
            disabled={actionInProgress}
            ref={likeButtonRef}
          />
        </div>

        {/* Reply button */}
        <div className="comment-action-group">
          <Button
            type="text"
            onClick={handleReplyClick}
            className="comment-action-button"
            aria-label="Reply"
            icon={<MessageOutlined />}
            disabled={actionInProgress}
          />
        </div>

        {/* Edit button (only for author) */}
        {isAuthor && (
          <div className="comment-action-group">
            <Button
              type="text"
              onClick={handleEditClick}
              className="comment-action-button"
              aria-label="Edit"
              icon={<EditOutlined />}
              disabled={actionInProgress}
            />
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
              <Button
                type="text"
                className="comment-action-button delete-button"
                aria-label="Delete"
                icon={<DeleteOutlined />}
                disabled={actionInProgress}
              />
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

      {/* View replies button - only show if there are replies */}
      {(replies.length > 0 || comment.replyCount > 0 || comment.replies?.length > 0) && (
        <button
          className="view-replies-button"
          onClick={handleToggleReplies}
        >
          <span className="reply-line"></span>
          {showReplies
            ? `Hide ${replies.length || comment.replyCount || comment.replies?.length || 0} ${(replies.length === 1 || comment.replyCount === 1 || comment.replies?.length === 1) ? 'reply' : 'replies'}`
            : `View ${replies.length || comment.replyCount || comment.replies?.length || 0} ${(replies.length === 1 || comment.replyCount === 1 || comment.replies?.length === 1) ? 'reply' : 'replies'}`
          }
        </button>
      )}

      {/* Replies */}
      {showReplies && (
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
      )}
    </div>
  );
};

export default CommentItem;