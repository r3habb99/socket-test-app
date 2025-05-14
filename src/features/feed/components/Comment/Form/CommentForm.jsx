import React, { useState, useRef } from "react";
import { Form, Input, Button, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { createCommentDirect, replyToComment } from "../../../api/commentApi";
import { toast } from "react-toastify";
import { DEFAULT_PROFILE_PIC } from "../../../../../constants";
import "./CommentForm.css";

const { TextArea } = Input;
const { Text } = Typography;

/**
 * Form component for creating comments
 * @param {Object} props - Component props
 * @param {string} props.postId - ID of the post to comment on
 * @param {string} [props.replyToId] - ID of the comment to reply to (for nested comments)
 * @param {Function} props.onCommentAdded - Callback function when a comment is added
 * @param {Function} [props.onCancel] - Callback function when reply is canceled (for nested replies)
 * @returns {JSX.Element} CommentForm component
 */

export const CommentForm = ({ postId, replyToId, onCommentAdded, onCancel }) => {
  const [form] = Form.useForm();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textAreaRef = useRef(null);

  const MAX_CHARS = 280; // Twitter-like character limit

  // Helper function to ensure profile picture URL is in the correct format
  const getProcessedProfilePicUrl = (url) => {
    if (!url) return DEFAULT_PROFILE_PIC;

    // If it's already a full URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If it includes /uploads/ but doesn't start with it, extract the /uploads/ part
    if (url.includes('/uploads/') && !url.startsWith('/uploads/')) {
      const uploadsMatch = url.match(/\/uploads\/.*$/);
      if (uploadsMatch) {
        return uploadsMatch[0];
      }
    }

    // If it's a relative path, make sure it starts with a slash
    if (!url.startsWith('/') && !url.startsWith('http')) {
      return '/' + url;
    }

    return url;
  };

  // Get current user info from localStorage
  const profilePicFromStorage = localStorage.getItem("profilePic");
  const processedProfilePic = getProcessedProfilePicUrl(profilePicFromStorage);

  const currentUser = {
    id: localStorage.getItem("userId"),
    username: localStorage.getItem("username"),
    firstName: localStorage.getItem("firstName"),
    lastName: localStorage.getItem("lastName"),
    profilePic: processedProfilePic
  };

  // Handle content change
  const handleContentChange = (e) => {
    const value = e.target.value;
    setContent(value);
    setCharCount(value.length);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.warning("Comment cannot be empty");
      return;
    }

    if (content.length > MAX_CHARS) {
      toast.warning(`Comment is too long (maximum ${MAX_CHARS} characters)`);
      return;
    }

    setSubmitting(true);

    try {
      let response;

      // Prepare comment data
      const commentContent = content.trim();

      // Choose the appropriate API call based on whether this is a reply or a new comment
      if (replyToId) {
        // This is a reply to an existing comment
        const replyData = {
          postId,
          content: commentContent,
          replyToId
        };

        response = await replyToComment(replyData);
      } else {
        // This is a new direct comment on a post
        const commentData = {
          postId,
          content: commentContent
        };

        // Use the direct comment endpoint
        response = await createCommentDirect(commentData);
      }

      if (!response.error) {
        // Extract comment data from response
        const commentResponse = response.data.data ? response.data.data : response.data;

        // Create a complete comment object with user data
        const newComment = {
          ...commentResponse,
          postedBy: {
            _id: currentUser.id,
            id: currentUser.id,
            username: currentUser.username,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            profilePic: currentUser.profilePic
          },
          likes: [],
          replies: [],
          createdAt: new Date().toISOString()
        };

        // Reset form
        form.resetFields();
        setContent("");
        setCharCount(0);

        // Call callback function
        if (onCommentAdded) {
          onCommentAdded(newComment);
        }

        // If this is a reply and has a cancel function, call it
        if (replyToId && onCancel) {
          onCancel();
        }

        toast.success(replyToId ? "Reply added successfully" : "Comment added successfully");
      } else {
        toast.error(response.message || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("An error occurred while adding your comment");
    } finally {
      setSubmitting(false);
    }
  };

  // Focus the text area when the component mounts (useful for reply forms)
  React.useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

  return (
    <div className="comment-form-container">
      <Form
        form={form}
        className="comment-form"
        onFinish={handleSubmit}
        initialValues={{ content: "" }}
      >
        <Form.Item name="content" className="comment-input-container">
          <TextArea
            ref={textAreaRef}
            placeholder={replyToId ? "Write a reply..." : "Write a comment..."}
            autoSize={{ minRows: 1, maxRows: 4 }}
            value={content}
            onChange={handleContentChange}
            maxLength={MAX_CHARS + 1} // Allow one extra character to trigger validation
            className="comment-input"
          />
        </Form.Item>

        <div className="comment-form-footer">
          <div className="char-counter">
            <Text
              type={charCount > MAX_CHARS ? "danger" : charCount > MAX_CHARS * 0.8 ? "warning" : "secondary"}
            >
              {charCount}/{MAX_CHARS}
            </Text>
          </div>

          <div className="comment-form-actions">
            {replyToId && onCancel && (
              <Button onClick={onCancel} className="cancel-button">
                Cancel
              </Button>
            )}

            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={submitting}
              disabled={!content.trim() || charCount > MAX_CHARS}
              className="submit-button"
            >
              {replyToId ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default CommentForm;
