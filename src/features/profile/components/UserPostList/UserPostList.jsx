import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Avatar, Typography, Button, List, Tooltip, Empty, Modal } from 'antd';
import { FaRetweet, FaShare, FaReply, FaEye } from 'react-icons/fa';
import {
  DEFAULT_PROFILE_PIC,
  PLACEHOLDER_IMAGE
} from '../../../../constants';
import { getImageUrl } from '../../../../shared/utils/imageUtils';
import { ImageProxy } from '../../../../shared/components';
import { ReactionButton } from '../../../feed/components/ReactionButton';
import { RetweetButton } from '../../../feed/components/RetweetButton';
import { DeleteButton } from '../../../feed/components/DeleteButton';
import { CommentButton } from '../../../feed/components/Comment';
import { ReplyButton } from '../../../feed/components/ReplyButton';
import { getPostId, formatTimestamp, navigateToUserProfile } from '../../../feed/components/PostList/PostListHelpers';
import { fetchUserStats } from '../../api/profileApi';
import './UserPostList.css';

export const UserPostList = ({ userId, activeTab }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextMaxId, setNextMaxId] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const navigate = useNavigate();

  const fetchUserPosts = useCallback(async (maxId = null) => {
    if (!maxId) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Map activeTab to content_type parameter
      const contentType = activeTab === 'posts' ? 'posts' :
                          activeTab === 'replies' ? 'replies' :
                          activeTab === 'media' ? 'media' :
                          activeTab === 'likes' ? 'likes' : 'posts';

      // Set up options for the stats API
      const options = {
        contentType,
        limit: 10,
        includeComments: true
      };

      // Add maxId for pagination if provided
      if (maxId) {
        options.maxId = maxId;
      }

      // Use the enhanced stats API
      const response = await fetchUserStats(userId, options);

      if (response.error) {
        setError(response.message || 'Failed to fetch posts');
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      // Log the response for debugging
      console.log("User stats API response for posts:", response);

      // Handle different response structures
      let statsData = null;

      // Case 1: Direct response with statusCode, message, data structure
      if (response.data && response.data.statusCode && response.data.data) {
        statsData = response.data.data;
        console.log("Found stats data in response.data.data with statusCode structure", statsData);
      }
      // Case 2: Nested response.data.data structure
      else if (response.data && response.data.data) {
        statsData = response.data.data;
        console.log("Found stats data in response.data.data structure", statsData);
      }
      // Case 3: Direct response.data structure
      else if (response.data) {
        statsData = response.data;
        console.log("Found stats data in direct response.data structure", statsData);
      }

      if (!statsData) {
        setError('No user data found in response');
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      // Get content items from the response
      const contentItems = statsData.content?.items || [];

      // Get pagination info
      const pagination = statsData.content?.pagination || {};
      setNextMaxId(pagination.next_max_id || null);
      setHasMore(pagination.has_more || false);

      // If loading more, append to existing posts, otherwise replace
      if (maxId) {
        setPosts(prevPosts => [...prevPosts, ...contentItems]);
      } else {
        setPosts(contentItems);
      }
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setError('An error occurred while fetching posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, activeTab]);

  useEffect(() => {
    // Reset state when userId or activeTab changes
    setPosts([]);
    setNextMaxId(null);
    setHasMore(false);

    // Fetch initial posts
    fetchUserPosts();
  }, [userId, activeTab, fetchUserPosts]);



  const handlePostsUpdated = () => {
    // Refresh the posts when a post is updated (liked, unliked, etc.)
    fetchUserPosts();
  };

  const renderPostContent = (post) => {
    // Check if post has retweetData (from the API response structure)
    const original = post.retweetData || post.retweetedFrom;

    // Determine which post object to use for content and media
    const postToRender = original || post;

    // Use postedBy object from the appropriate source
    const postedByUser = original ? original.postedBy || {} : post.postedBy || {};

    // Check if post is a reply
    const isReply = post.replyTo || postToRender.replyTo;

    // Get the original post this is replying to
    const replyToPost = post.replyTo || postToRender.replyTo;

    // Check if the post has media
    const hasMedia = postToRender.media && postToRender.media.length > 0;

    return (
      <>
        {original && <div className="post-retweet-label">
          <FaRetweet /> <span>{post.postedBy?.username || 'You'} retweeted</span>
        </div>}

        {isReply && replyToPost && (
          <div className="post-reply-label">
            <FaReply /> <span>Replying to @{replyToPost.postedBy?.username || "user"}</span>

            {/* Original post that was replied to */}
            <div className="original-post-container">
              <div className="original-post-content">
                <span className="original-post-text">
                  {replyToPost.content}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="post-header">
          <div
            className="post-avatar clickable"
            onClick={() => navigateToUserProfile(postedByUser, navigate)}
            title={`View ${postedByUser.username}'s profile`}
          >
            <Avatar
              size={48}
              src={
                <ImageProxy
                  src={postedByUser.profilePic ? getImageUrl(postedByUser.profilePic, DEFAULT_PROFILE_PIC) : DEFAULT_PROFILE_PIC}
                  alt={postedByUser.username || "User"}
                  defaultSrc={DEFAULT_PROFILE_PIC}
                  onError={() => {
                    // Silent error handling - fallback to default image
                  }}
                />
              }
            />
          </div>
          <div className="post-user-info">
            <div className="post-user-name clickable" onClick={() => navigateToUserProfile(postedByUser, navigate)}>
              {postedByUser.firstName} {postedByUser.lastName}
            </div>
            <div className="post-user-handle">@{postedByUser.username}</div>
            <div className="post-timestamp">{formatTimestamp(postToRender.createdAt)}</div>
          </div>
        </div>

        <div className="post-content-container">
          <div className="post-text">{postToRender.content}</div>

          {/* Display media if available */}
          {hasMedia && (
            <div className="post-media-container">
              {postToRender.media.map((mediaUrl, index) => {
                // Get placeholder image URL from constants
                const placeholderImage = PLACEHOLDER_IMAGE;

                return (
                  <div
                    key={index}
                    className="post-media"
                    onClick={() => handlePreviewOpen(mediaUrl, postToRender.media)}
                    style={{ cursor: 'pointer' }}
                  >
                    <ImageProxy
                      src={getImageUrl(mediaUrl, placeholderImage)}
                      alt={`Post media ${index + 1}`}
                      className="post-media-image"
                      defaultSrc={placeholderImage}
                      onError={(e) => {
                        console.warn(`Failed to load post media in UserPostList: ${mediaUrl}`, e);
                        // Silent error handling - fallback to placeholder image
                      }}
                    />
                    <div className="media-overlay">
                      <FaEye className="view-icon" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  // Image preview handlers
  const handlePreviewOpen = (mediaUrl, allMediaUrls) => {
    const processedUrls = allMediaUrls.map(url => getImageUrl(url, PLACEHOLDER_IMAGE));
    const index = processedUrls.indexOf(getImageUrl(mediaUrl, PLACEHOLDER_IMAGE));

    setPreviewImage(getImageUrl(mediaUrl, PLACEHOLDER_IMAGE));
    setPreviewImages(processedUrls);
    setPreviewIndex(index >= 0 ? index : 0);
    setPreviewVisible(true);
  };

  const handlePreviewClose = () => {
    setPreviewVisible(false);
  };

  const handlePrevImage = () => {
    const newIndex = (previewIndex - 1 + previewImages.length) % previewImages.length;
    setPreviewIndex(newIndex);
    setPreviewImage(previewImages[newIndex]);
  };

  const handleNextImage = () => {
    const newIndex = (previewIndex + 1) % previewImages.length;
    setPreviewIndex(newIndex);
    setPreviewImage(previewImages[newIndex]);
  };

  // Function to load more posts
  const loadMorePosts = () => {
    if (nextMaxId && !loadingMore) {
      fetchUserPosts(nextMaxId);
    }
  };

  if (loading) return <div className="user-post-list-loading">Loading posts...</div>;
  if (error) return <div className="user-post-list-error">{error}</div>;

  return (
    <div className="user-post-list-container">
      {posts.length === 0 ? (
        <Empty
          description={
            <Typography.Text className="no-post">
              {activeTab === 'posts'
                ? 'No posts to show.'
                : activeTab === 'replies'
                  ? 'No replies to show.'
                  : activeTab === 'media'
                    ? 'No media posts to show.'
                    : 'No liked posts to show.'}
            </Typography.Text>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <List
            itemLayout="vertical"
            dataSource={posts}
            renderItem={(post) => {
              const postId = getPostId(post);
              return (
                <Card
                  key={postId}
                  className="post-card"
                  style={{ padding: '12px 16px', border: 'none', borderBottom: '1px solid #eee' }}
                >
                  {renderPostContent(post)}

                  <div className="post-actions">
                    <CommentButton
                      post={post}
                      getPostId={getPostId}
                    />

                    <ReplyButton
                      post={post}
                      setPosts={setPosts}
                      onPostsUpdated={handlePostsUpdated}
                      getPostId={getPostId}
                    />

                    <RetweetButton
                      post={post}
                      setPosts={setPosts}
                      onPostsUpdated={handlePostsUpdated}
                      getPostId={getPostId}
                    />

                    <ReactionButton
                      post={post}
                      setPosts={setPosts}
                      onPostsUpdated={handlePostsUpdated}
                      getPostId={getPostId}
                    />

                    <div className="post-action-group">
                      <Tooltip title="Share">
                        <Button
                          type="text"
                          className="post-action-button share-button"
                          aria-label="Share"
                          icon={<FaShare />}
                        />
                      </Tooltip>
                    </div>

                    <DeleteButton
                      post={post}
                      setPosts={setPosts}
                      getPostId={getPostId}
                    />
                  </div>
                </Card>
              );
            }}
          />

          {hasMore && (
            <div className="load-more-container">
              <Button
                onClick={loadMorePosts}
                loading={loadingMore}
                disabled={loadingMore}
                className="load-more-button"
              >
                Load More
              </Button>
            </div>
          )}

          {/* Image Preview Modal */}
          <Modal
            open={previewVisible}
            title={`Image ${previewIndex + 1} of ${previewImages.length}`}
            footer={null}
            onCancel={handlePreviewClose}
            width="90%"
            centered
            className="image-preview-modal"
            closeIcon={<Button type="text" icon={<span>×</span>} className="close-modal-button" />}
          >
            <div style={{ textAlign: 'center' }}>
              <img
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                src={previewImage}
              />
            </div>
            {previewImages.length > 1 && (
              <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Button
                  onClick={handlePrevImage}
                  type="primary"
                  shape="round"
                  size="middle"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNextImage}
                  type="primary"
                  shape="round"
                  size="middle"
                >
                  Next
                </Button>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
};
