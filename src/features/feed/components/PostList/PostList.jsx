import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  DEFAULT_PROFILE_PIC,
  PLACEHOLDER_IMAGE
} from "../../../../constants";
import { getImageUrl } from "../../../../shared/utils/imageUtils";
import { ImageProxy } from "../../../../shared/components";
import { FaRetweet, FaShare, FaReply, FaEye } from "react-icons/fa";
import { Card, Avatar, Typography, Button, List, Tooltip, Empty, Modal } from "antd";
import { LikeButton } from "../LikeButton";
import { RetweetButton } from "../RetweetButton";
import { DeleteButton } from "../DeleteButton";
import { CommentButton } from "../Comment";
import { ReplyButton } from "../ReplyButton";
import { getPostId, formatTimestamp, navigateToUserProfile } from "./PostListHelpers";
import "./PostList.css";

export const PostList = ({ posts, setPosts, onPostsUpdated }) => {
  const navigate = useNavigate();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const handlePreview = (imageUrl, images, index) => {
    setPreviewImage(imageUrl);
    setPreviewImages(images);
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const handlePreviewClose = () => {
    setPreviewVisible(false);
  };

  const handlePrevImage = () => {
    setPreviewIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : previewImages.length - 1));
    setPreviewImage(previewImages[previewIndex > 0 ? previewIndex - 1 : previewImages.length - 1]);
  };

  const handleNextImage = () => {
    setPreviewIndex((prevIndex) => (prevIndex < previewImages.length - 1 ? prevIndex + 1 : 0));
    setPreviewImage(previewImages[previewIndex < previewImages.length - 1 ? previewIndex + 1 : 0]);
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
            onClick={(e) => {
              e.stopPropagation();
              navigateToUserProfile(postedByUser, navigate);
            }}
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
              onClick={(e) => {
                e.stopPropagation();
                navigateToUserProfile(postedByUser, navigate);
              }}
            />
          </div>
          <div className="post-user-info">
            <div className="post-user-name-container">
              <Text
                strong
                className="post-user-name clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToUserProfile(postedByUser, navigate);
                }}
                title={`View ${postedByUser.username}'s profile`}
              >
                {postedByUser.firstName || postedByUser.username || "User"} {postedByUser.lastName || ""}
                {isVerified && <span className="verified-badge">✓</span>}
              </Text>
              <Text
                type="secondary"
                className="post-user-handle clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToUserProfile(postedByUser, navigate);
                }}
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
                  const placeholderImage = PLACEHOLDER_IMAGE;
                  const imageUrl = getImageUrl(mediaUrl, placeholderImage);
                  const allImageUrls = postToRender.media.map(url =>
                    getImageUrl(url, placeholderImage)
                  );

                  return (
                    <div
                      key={index}
                      className="post-media"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(imageUrl, allImageUrls, index);
                      }}
                    >
                      <ImageProxy
                        src={imageUrl}
                        alt={`Post media ${index + 1}`}
                        className="post-media-image"
                        defaultSrc={placeholderImage}
                        onError={(e) => {
                          console.warn(`Failed to load post media: ${mediaUrl}`, e);
                          // Silent error handling - fallback to placeholder image
                        }}
                      />
                      <div className="post-media-overlay">
                        <FaEye /> View
                      </div>
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
    </div>
  );
};
