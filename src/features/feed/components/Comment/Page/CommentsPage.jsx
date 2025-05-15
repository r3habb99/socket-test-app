import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Typography, Spin, Avatar, Layout } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import CommentForm from "../Form";
import CommentList from "../List";
import { DEFAULT_PROFILE_PIC } from "../../../../../constants";
import { getImageUrl } from "../../../../../shared/utils/imageUtils";
import { ImageProxy } from "../../../../../shared/components";
import { getProcessedProfilePicUrl } from "../utils/commentHelpers";
import { usePost, useComments, useCommentSocket } from "../hooks";
import "./CommentsPage.css";

const { Title, Text } = Typography;
const { Header, Content } = Layout;


/**
 * Page component for displaying and creating comments on a post
 * @returns {JSX.Element} CommentsPage component
 */
export const CommentsPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();


  // Use custom hooks for post and comments
  const {
    post,
    loading: postLoading,
    error: postError,
    updateCommentCount,
    fetchPost
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
    refreshComments
  } = useComments(postId);

  // Use socket hook for real-time updates
  useCommentSocket(postId, addComment, updateComment, removeComment);

  // Handle sort order change
  const handleSortChange = (order) => {
    changeSortOrder(order);
  };

  // Handle comment added
  const handleCommentAdded = (newComment) => {
   addComment(newComment);
    updateCommentCount(1);
  };

  // Handle back button click
  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <Layout className="comments-page-layout">
      <Header className="comments-page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBackClick}
          className="back-button"
        />
        <Title level={4} className="header-title">Comments</Title>
      </Header>
      <Content className="comments-page-content">
        {postLoading ? (
          <div className="comment-loading-container">
            <Spin size="large" />
          </div>
        ) : postError ? (
          <div className="error-container">
            <Text type="danger">{postError}</Text>
            <Button
              type="primary"
              onClick={() => {
             // Use the fetchPost function from the hook
                fetchPost();
              }}
            >
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
                <Button
                  type="primary"
                  onClick={() => {
               // Use the refreshComments function to refresh comments
                    refreshComments();
                  }}
                >
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
                    onCommentUpdated={() => refreshComments()}
                  />
                )}
              </>
            )}
          </>
        )}
      </Content>
    </Layout>
  );
};

export default CommentsPage;
