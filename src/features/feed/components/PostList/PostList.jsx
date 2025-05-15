import React from "react";
import { useNavigate } from "react-router-dom";

import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import { getImageUrl } from "../../../../shared/utils/imageUtils";
import { ImageProxy } from "../../../../shared/components";
import { FaRetweet, FaShare, FaReply } from "react-icons/fa";
import { Card, Avatar, Typography, Button, List, Tooltip, Empty } from "antd";
import { LikeButton } from "../LikeButton";
import { RetweetButton } from "../RetweetButton";
import { DeleteButton } from "../DeleteButton";
import { CommentButton } from "../Comment";
import { ReplyButton } from "../ReplyButton";
import { getPostId, formatTimestamp, navigateToUserProfile } from "./PostListHelpers";
import "./PostList.css";

export const PostList = ({ posts, setPosts, onPostsUpdated }) => {
  const navigate = useNavigate();

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

    const timestamp = formatTimestamp(postToRender.createdAt);
    const isVerified = postedByUser.isVerified;
    const { Text } = Typography;

    return (
      <>
        {original && (
          <div className="retweet-label">
            <FaRetweet /> <Text type="secondary">{post.postedBy?.username || "You"} retweeted</Text>
          </div>
        )}

        {isReply && replyToPost && (
          <div className="reply-label">
            <FaReply /> <Text type="secondary">Replying to @{replyToPost.postedBy?.username || "user"}</Text>

            {/* Original post that was replied to */}
            <div className="original-post-container">
              <div className="original-post-content">
                <Text type="secondary" className="original-post-text">
                  {replyToPost.content}
                </Text>
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
              className="avatar"
              onClick={() => navigateToUserProfile(postedByUser, navigate)}
            />
          </div>
          <div className="post-user-info">
            <div className="post-user-name-container">
              <Text
                strong
                className="post-user-name clickable"
                onClick={() => navigateToUserProfile(postedByUser, navigate)}
                title={`View ${postedByUser.username}'s profile`}
              >
                {postedByUser.firstName || postedByUser.username || "User"} {postedByUser.lastName || ""}
                {isVerified && <span className="verified-badge">✓</span>}
              </Text>
              <Text
                type="secondary"
                className="post-user-handle clickable"
                onClick={() => navigateToUserProfile(postedByUser, navigate)}
                title={`View ${postedByUser.username}'s profile`}
              >
                @{postedByUser.username || "user"}
              </Text>
              <Text type="secondary" className="post-timestamp">
                {timestamp}
              </Text>
            </div>
            <Text className="post-content">
              {postToRender.content && postToRender.content.split(/(\s+)/).map((word, i) => {
                if (word.startsWith('#')) {
                  return <Text key={i} className="hashtag">{word}</Text>;
                }
                return word;
              })}
            </Text>

            {/* Display media if available */}
            {hasMedia && (
              <div className="post-media-container">
                {postToRender.media.map((mediaUrl, index) => {
                  // Create a placeholder image URL (using a more reliable source)
                  const placeholderImage = "https://via.placeholder.com/400x300?text=Image+Loading...";

                  return (
                    <div key={index} className="post-media">
                      <ImageProxy
                        src={getImageUrl(mediaUrl, placeholderImage)}
                        alt={`Post media ${index + 1}`}
                        className="post-media-image"
                        defaultSrc={placeholderImage}
                        onError={(e) => {
                          console.warn(`Failed to load post media: ${mediaUrl}`, e);
                          // Silent error handling - fallback to placeholder image
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // Helper functions moved to PostListHelpers.js

  return (
    <div className="post-list-container">
      <div className="post-list-content">
        {posts.length === 0 ? (
          <Empty
            description={<Typography.Text className="no-post">No posts to show.</Typography.Text>}
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
                  style={{ padding: '12px 16px', border: 'none' }}
                  onClick={() => navigate(`/post/${postId}`)}
                >
                  {renderPostContent(post)}

                  <div className="post-actions" onClick={(e) => e.stopPropagation()}>
                    <CommentButton
                      post={post}
                      getPostId={getPostId}
                    />

                    <ReplyButton
                      post={post}
                      setPosts={setPosts}
                      onPostsUpdated={onPostsUpdated}
                      getPostId={getPostId}
                    />

                    <RetweetButton
                      post={post}
                      setPosts={setPosts}
                      onPostsUpdated={onPostsUpdated}
                      getPostId={getPostId}
                    />

                    <LikeButton
                      post={post}
                      setPosts={setPosts}
                      onPostsUpdated={onPostsUpdated}
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

                    {/* Delete button component */}
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
    </div>
  );
};
