import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useCommentForm } from "../hooks";
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
  const MAX_CHARS = 280; // Character limit
  const [showCharCounter, setShowCharCounter] = useState(false);

  // Use our custom hook for form handling
  const {
    form,
    content,
    submitting,
    charCount,
    textAreaRef,
    handleContentChange,
    handleSubmit
  } = useCommentForm({
    postId,
    replyToId,
    onCommentAdded,
    onCancel,
    maxChars: MAX_CHARS
  });

  // Focus the text area when the component mounts (useful for reply forms)
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [textAreaRef]);

  // Show character counter when approaching the limit
  useEffect(() => {
    setShowCharCounter(charCount > MAX_CHARS * 0.8);
  }, [charCount, MAX_CHARS]);

  // Get placeholder text - if replying to a comment, include @username
  const getPlaceholder = () => {
    if (replyToId) {
      return "Reply...";
    }
    return "Add a comment...";
  };

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
            placeholder={getPlaceholder()}
            autoSize={{ minRows: 1, maxRows: 3 }}
            value={content}
            onChange={handleContentChange}
            maxLength={MAX_CHARS + 1} // Allow one extra character to trigger validation
            className="comment-input"
          />
        </Form.Item>

        <div className={`char-counter ${showCharCounter ? 'show' : ''}`}>
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
            htmlType="submit"
            icon={<SendOutlined/>}
            loading={submitting}
            disabled={!content.trim() || charCount > MAX_CHARS}
            className="submit-button"
          >
            {replyToId ? "Reply" : "Post"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CommentForm;
