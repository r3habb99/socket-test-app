import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Typography, Spin, Avatar, Layout } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import CommentForm from "../Form";
import CommentList from "../List";
import { getPostById } from "../../../api/postApi";
import { getComments } from "../../../api/commentApi";
import { useSocketContext } from "../../../../../core/providers/SocketProvider";
import { DEFAULT_PROFILE_PIC } from "../../../../../constants";
import { getImageUrl } from "../../../../../shared/utils/imageUtils";
import { ImageProxy } from "../../../../../shared/components";
import "./CommentsPage.css";

const { Title, Text } = Typography;
const { Header, Content } = Layout;

/**
 * Helper function to ensure profile picture URL is in the correct format
 */
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

/**
 * Page component for displaying and creating comments on a post
 * @returns {JSX.Element} CommentsPage component
 */
export const CommentsPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");
  const { subscribe } = useSocketContext();

  // Sort comments based on the selected sort order
  const sortComments = useCallback((commentsToSort, order) => {
    return [...commentsToSort].sort((a, b) => {
      if (order === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (order === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (order === "most_liked") {
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      }
      return 0;
    });
  }, []);

  // Fetch post data
  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPostById(postId);
      if (!response.error && response.data) {
        // Handle nested data structure if present
        let postData;

        // Check for different possible response structures
        if (response.data.data) {
          // Structure: { data: { ... } }
          postData = response.data.data;
        } else {
          // Structure: { ... } (direct object)
          postData = response.data;
        }

        // Ensure postedBy exists
        if (!postData.postedBy && postData.author) {
          postData.postedBy = postData.author;
        }

        setPost(postData);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Fetch comments for the post
  const fetchComments = useCallback(async () => {
    setCommentLoading(true);
    try {
      const response = await getComments(postId, {
        sort: sortOrder,
        parentOnly: true,
        page: 1,
        limit: 10
      });

      if (!response.error && response.data) {
        // Handle nested data structure if present
        let commentsData;

        // Check for different possible response structures
        if (response.data.data?.comments) {
          // Structure: { data: { comments: [...] } }
          commentsData = response.data.data.comments;
        } else if (response.data.comments) {
          // Structure: { comments: [...] }
          commentsData = response.data.comments;
        } else if (Array.isArray(response.data.data)) {
          // Structure: { data: [...] }
          commentsData = response.data.data;
        } else if (response.data.data?.data?.comments) {
          // Structure: { data: { data: { comments: [...] } } }
          commentsData = response.data.data.data.comments;
        } else if (Array.isArray(response.data)) {
          // Structure: [...] (direct array)
          commentsData = response.data;
        } else {
          // Default empty array if no recognized structure
          commentsData = [];
        }

        setComments(commentsData);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setCommentLoading(false);
    }
  }, [postId, sortOrder]);

  // Fetch post data when component mounts
  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId, fetchPost, fetchComments]);

  // Subscribe to socket events for real-time updates
  useEffect(() => {
    // Subscribe to new comment events
    const unsubscribeNewComment = subscribe("new comment", (data) => {
      if (data.postId === postId) {
        // Add the new comment to the list
        setComments((prevComments) => {
          // Check if comment already exists to avoid duplicates
          const exists = prevComments.some(
            (comment) => (comment._id || comment.id) === (data._id || data.id)
          );
          if (exists) return prevComments;

          // Add new comment and sort based on current sort order
          const updatedComments = [...prevComments, data];
          return sortComments(updatedComments, sortOrder);
        });
      }
    });

    // Subscribe to comment liked events
    const unsubscribeCommentLiked = subscribe("comment liked", (data) => {
      if (data.postId === postId) {
        // Update the liked comment in the list
        setComments((prevComments) =>
          prevComments.map((comment) =>
            (comment._id || comment.id) === (data._id || data.id) ? data : comment
          )
        );
      }
    });

    // Subscribe to comment deleted events
    const unsubscribeCommentDeleted = subscribe("comment deleted", (data) => {
      if (data.postId === postId) {
        // Remove the deleted comment from the list
        setComments((prevComments) =>
          prevComments.filter((comment) =>
            (comment._id || comment.id) !== (data._id || data.id)
          )
        );
      }
    });

    // Clean up subscriptions
    return () => {
      unsubscribeNewComment();
      unsubscribeCommentLiked();
      unsubscribeCommentDeleted();
    };
  }, [postId, subscribe, sortOrder, sortComments]);

  // Handle sort order change
  const handleSortChange = (order) => {
    setSortOrder(order);
  };

  // Handle comment added
  const handleCommentAdded = (newComment) => {
    // Add the new comment to the list
    setComments((prevComments) => {
      const updatedComments = [...prevComments, newComment];
      return sortComments(updatedComments, sortOrder);
    });

    // Update the post's comment count
    if (post) {
      setPost(prevPost => ({
        ...prevPost,
        commentCount: (prevPost.commentCount || 0) + 1,
        commentsCount: (prevPost.commentsCount || 0) + 1
      }));
    }
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
        {loading ? (
          <div className="comment-loading-container">
            <Spin size="large" />
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

            {commentLoading ? (
              <div className="comment-loading-container">
                <Spin size="small" />
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
                    onCommentUpdated={fetchComments}
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
