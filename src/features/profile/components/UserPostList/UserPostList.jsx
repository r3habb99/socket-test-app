import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Avatar, Typography, Button, List, Tooltip, Empty, Spin } from 'antd';
import { FaRetweet, FaShare } from 'react-icons/fa';
import { DEFAULT_PROFILE_PIC } from '../../../../constants';
import { getImageUrl } from '../../../../shared/utils/imageUtils';
import { ImageProxy } from '../../../../shared/components';
import { LikeButton } from '../../../feed/components/LikeButton';
import { RetweetButton } from '../../../feed/components/RetweetButton';
import { DeleteButton } from '../../../feed/components/DeleteButton';
import { CommentButton } from '../../../feed/components/Comment';
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

      // Extract the data from the nested response structure
      const statsData = response.data?.data;

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



  const handlePostsUpdated = (updatedPosts) => {
    setPosts(updatedPosts);
  };

  const renderPostContent = (post) => {
    // Check if post has retweetData (from the API response structure)
    const original = post.retweetData || post.retweetedFrom;

    // Determine which post object to use for content and media
    const postToRender = original || post;

    // Use postedBy object from the appropriate source
    const postedByUser = original ? original.postedBy || {} : post.postedBy || {};

    // Check if the post has media
    const hasMedia = postToRender.media && postToRender.media.length > 0;

    return (
      <>
        {original && <div className="post-retweet-label">
          <FaRetweet /> <span>{post.postedBy?.username || 'You'} retweeted</span>
        </div>}

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
                const placeholderImage = "https://via.placeholder.com/400x300?text=Image+Loading...";

                return (
                  <div key={index} className="post-media">
                    <ImageProxy
                      src={getImageUrl(mediaUrl, placeholderImage)}
                      alt={`Post media ${index + 1}`}
                      className="post-media-image"
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
        </div>
      </>
    );
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

                    <RetweetButton
                      post={post}
                      setPosts={setPosts}
                      onPostsUpdated={handlePostsUpdated}
                      getPostId={getPostId}
                    />

                    <LikeButton
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
        </>
      )}
    </div>
  );
};
