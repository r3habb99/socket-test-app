import React from "react";
import { List, Empty, Typography } from "antd";
import CommentItem from "../Item";
import "./CommentList.css";

const { Text } = Typography;

/**
 * Component to display a list of comments
 * @param {Object} props - Component props
 * @param {Array} props.comments - Array of comment objects
 * @param {string} props.postId - ID of the post these comments belong to
 * @param {Function} props.onCommentUpdated - Callback function when a comment is updated
 * @param {boolean} [props.isNested=false] - Whether this is a nested comment list (for replies)
 * @returns {JSX.Element} CommentList component
 */
export const CommentList = ({
  comments,
  postId,
  onCommentUpdated,
  isNested = false
}) => {
  // Filter out replies if this is the top-level comment list
  // Only show top-level comments (those without replyToId)
  const filteredComments = !isNested
    ? comments.filter(comment => !comment.replyToId)
    : comments;

  // Group replies by parent comment ID
  const repliesByParentId = comments.reduce((acc, comment) => {
    if (comment.replyToId) {
      if (!acc[comment.replyToId]) {
        acc[comment.replyToId] = [];
      }
      acc[comment.replyToId].push(comment);
    }
    return acc;
  }, {});

  return (
    <div className={`comment-list ${isNested ? 'nested-comment-list' : ''}`}>
      {filteredComments.length === 0 ? (
        <Empty
          description={
            <Text type="secondary">
              {isNested ? "No replies yet" : "No comments yet. Be the first to comment!"}
            </Text>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={filteredComments}
          renderItem={(comment) => (
            <CommentItem
              key={comment._id || comment.id}
              comment={comment}
              postId={postId}
              onCommentUpdated={onCommentUpdated}
              replies={repliesByParentId[comment._id || comment.id] || []}
            />
          )}
        />
      )}
    </div>
  );
};

export default CommentList;
