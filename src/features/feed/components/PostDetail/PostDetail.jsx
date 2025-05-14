import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getPostById } from '../../api/postApi';
import { PostList } from '../PostList/PostList';
import { CommentList } from '../Comment/List/CommentList';
import { useComments } from '../Comment/hooks/useComments';
import CommentForm from '../Comment/Form';
import './PostDetail.css';

const { Text } = Typography;

export const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use the comments hook to fetch and manage comments
  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    refreshComments
  } = useComments(postId);

  useEffect(() => {
    const fetchPostData = async () => {
      setLoading(true);
      try {
        const response = await getPostById(postId);

        if (response.error) {
          setError(response.message || 'Failed to load post');
          return;
        }

        // Handle different response structures
        let postData = null;

        if (response.data?.data?.post) {
          postData = response.data.data.post;
        } else if (response.data?.post) {
          postData = response.data.post;
        } else if (response.data) {
          postData = response.data;
        }

        if (postData) {
          setPost(postData);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [postId]);

  const handlePostsUpdated = () => {
    // Refresh the post data when it's updated
    const fetchPostData = async () => {
      try {
        const response = await getPostById(postId);
        if (!response.error && response.data) {
          setPost(response.data);
        }
      } catch (err) {
        console.error('Error refreshing post:', err);
      }
    };

    fetchPostData();
    refreshComments();
  };

  if (loading) {
    return (
      <div className="post-detail-loading">
        <Spin size="large" />
        <Text>Loading post...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-detail-error">
        <Text type="danger">{error}</Text>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  // Check if the post is a reply
  const isReply = post?.replyTo || post?.replyToId;
  const replyingToUsername = isReply ? (post?.replyTo?.postedBy?.username || 'user') : null;

  return (
    <div className="post-detail-container">
      <div className="post-detail-header">
        <div className="post-detail-back">
          <ArrowLeftOutlined onClick={() => navigate(-1)} />
        </div>
        <div className="post-detail-title">
          <Text strong>Tweet</Text>
        </div>
      </div>

      {post && (
        <>
          <div className="post-detail-content">
            {isReply && (
              <div className="replying-to">
                <Text className="replying-to-text">
                  Replying to<span className="replying-to-username">@{replyingToUsername}</span>
                </Text>
              </div>
            )}

            <PostList
              posts={[post]}
              setPosts={(updatedPosts) => setPost(updatedPosts[0])}
              onPostsUpdated={handlePostsUpdated}
            />
          </div>

          <div className="post-detail-comment-form">
            <CommentForm
              postId={postId}
              onCommentAdded={() => refreshComments()}
            />
          </div>

          <div className="post-detail-comments-header">
            <Text strong>Replies</Text>
          </div>

          <div className="post-detail-comments">
            {commentsLoading ? (
              <div className="comments-loading">
                <Spin size="small" />
                <Text>Loading replies...</Text>
              </div>
            ) : commentsError ? (
              <div className="comments-error">
                <Text type="danger">{commentsError}</Text>
                <button onClick={refreshComments} className="retry-button">Retry</button>
              </div>
            ) : comments.length === 0 ? (
              <div className="no-comments">
                <Text type="secondary">No replies yet</Text>
              </div>
            ) : (
              <CommentList
                comments={comments}
                postId={postId}
                onCommentUpdated={refreshComments}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PostDetail;