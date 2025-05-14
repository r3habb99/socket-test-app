import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Avatar, Typography, Button, List, Tooltip, Empty } from 'antd';
import { FaRetweet, FaShare } from 'react-icons/fa';
import { DEFAULT_PROFILE_PIC } from '../../../../constants';
import { getImageUrl } from '../../../../shared/utils/imageUtils';
import { ImageProxy } from '../../../../shared/components';
import { LikeButton } from '../../../feed/components/LikeButton';
import { RetweetButton } from '../../../feed/components/RetweetButton';
import { DeleteButton } from '../../../feed/components/DeleteButton';
import { CommentButton } from '../../../feed/components/Comment';
import { getPostId, formatTimestamp, navigateToUserProfile } from '../../../feed/components/PostList/PostListHelpers';
import { getPosts } from '../../../feed/api/postApi';
import { fetchUserStats } from '../../api/profileApi';
import './UserPostList.css';

export const UserPostList = ({ userId, activeTab }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPosts = async () => {
      setLoading(true);
      try {
        // Use the new dedicated API endpoint for user stats with posts
        const response = await fetchUserStats(userId, true);

        if (response.error) {
          setError(response.message || 'Failed to fetch posts');
          setLoading(false);
          return;
        }

        // Extract the data from the nested response structure
        const userData = response.data?.data;

        if (!userData) {
          setError('No user data found in response');
          setLoading(false);
          return;
        }

        let userPosts = [];

        // Check if we have recent posts in the response
        if (userData.recentPosts && Array.isArray(userData.recentPosts)) {
          // Filter posts based on the active tab
          if (activeTab === 'posts') {
            // Show only original posts (not replies) by this user
            userPosts = userData.recentPosts.filter(post => !post.replyTo);
          } else if (activeTab === 'replies') {
            // Show only replies by this user
            userPosts = userData.recentPosts.filter(post => post.replyTo);
          } else if (activeTab === 'media') {
            // Show posts with media
            userPosts = userData.recentPosts.filter(post =>
              post.media && post.media.length > 0
            );
          } else if (activeTab === 'likes') {
            // For likes tab, we still need to fetch all posts and filter
            // This is because the stats API doesn't return liked posts
            const allPostsResponse = await getPosts();
            if (!allPostsResponse.error && allPostsResponse.data && Array.isArray(allPostsResponse.data)) {
              // Get the user's likes array from the user data
              const userLikes = userData.user?.likes || [];

              // Filter posts that are liked by this user
              userPosts = allPostsResponse.data.filter(post =>
                post.likes && userLikes.includes(post._id || post.id)
              );
            }
          }
        } else {
          console.warn('No recent posts found in user stats response');
        }

        setPosts(userPosts);
      } catch (err) {
        console.error('Error fetching user posts:', err);
        setError('An error occurred while fetching posts');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [userId, activeTab]);

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
      )}
    </div>
  );
};
