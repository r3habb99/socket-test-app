import React, { useState } from "react";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { deletePost, likePost, retweetPost } from "../../api/postApi";
import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import { getImageUrl } from "../../../../shared/utils/imageUtils";
import { FaHeart, FaRegHeart, FaRetweet, FaTrash, FaRegComment, FaShare } from "react-icons/fa";
import "./PostList.css";

export const PostList = ({ posts, setPosts }) => {
  const [actionInProgress, setActionInProgress] = useState({});
  const { connected, emit } = useSocketContext();

  const handleLike = async (postId) => {
    if (actionInProgress[postId]) return;

    setActionInProgress((prev) => ({ ...prev, [postId]: "like" }));
    try {
      const response = await likePost(postId);

      if (response.error) {
        console.error("Error liking post:", response.message);
        return;
      }

      const updatedPost = response.data;

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          getPostId(post) === postId ? { ...post, ...updatedPost } : post
        )
      );

      // Emit socket event if connected
      if (connected && emit) {
        emit("post liked", updatedPost);
      }
    } catch (error) {
      console.error("Error liking/unliking post:", error);
    } finally {
      setActionInProgress((prev) => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
    }
  };

  const handleRetweet = async (postId) => {
    if (actionInProgress[postId]) return;

    setActionInProgress((prev) => ({ ...prev, [postId]: "retweet" }));
    try {
      const response = await retweetPost(postId);

      if (response.error) {
        console.error("Error retweeting post:", response.message);
        return;
      }

      const newRetweet = response.data;
      const newRetweetId = getPostId(newRetweet);

      // Add new retweet at the top and remove duplicate if any
      setPosts((prevPosts) => {
        const filteredPosts = prevPosts.filter(
          (post) => getPostId(post) !== newRetweetId
        );
        return [newRetweet, ...filteredPosts];
      });

      // Emit socket event if connected
      if (connected && emit) {
        emit("post retweeted", newRetweet);
      }
    } catch (error) {
      console.error("Error retweeting post:", error);
    } finally {
      setActionInProgress((prev) => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
    }
  };

  const handleDelete = async (postId) => {
    if (actionInProgress[postId]) return;

    setActionInProgress((prev) => ({ ...prev, [postId]: "delete" }));
    try {
      const response = await deletePost(postId);

      if (response.error) {
        console.error("Error deleting post:", response.message);
        return;
      }

      setPosts((prevPosts) => prevPosts.filter((post) => getPostId(post) !== postId));

      // Emit socket event if connected
      if (connected && emit) {
        emit("post deleted", postId);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setActionInProgress((prev) => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
    }
  };

  const renderPostContent = (post) => {
    const original = post.retweetedFrom;

    // Use postedBy object directly from post
    const postedByUser = post.postedBy || {};

    // Determine which post object to use for content and media
    const postToRender = original || post;

    // Check if the post has media
    const hasMedia = postToRender.media && postToRender.media.length > 0;

    // Format timestamp (assuming createdAt is available)
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return "9h"; // Default fallback like in the example

      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

      if (diffInHours < 24) {
        return `${diffInHours}h`;
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    const timestamp = formatTimestamp(postToRender.createdAt);
    const isVerified = postedByUser.isVerified;

    return (
      <>
        {original && <div className="retweet-label"><FaRetweet /> You retweeted</div>}

        <div className="post-header">
          <div className="post-avatar">
            <img
              src={
                postedByUser.profilePic
                  ? getImageUrl(postedByUser.profilePic, DEFAULT_PROFILE_PIC)
                  : DEFAULT_PROFILE_PIC
              }
              alt={postedByUser.username || "User"}
              className="avatar"
              onError={(e) => {
                console.warn(`Failed to load profile image: ${e.target.src}`);
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = DEFAULT_PROFILE_PIC;
              }}
            />
          </div>
          <div className="post-user-info">
            <div className="post-user-name-container">
              <span className="post-user-name">
                {postedByUser.firstName} {postedByUser.lastName || "Name Lastname"}
                {isVerified && <span className="verified-badge">✓</span>}
              </span>
              <span className="post-user-handle">
                @{original?.postedBy?.username || postedByUser.username || "handlename"}
              </span>
              <span className="post-timestamp">{timestamp}</span>
            </div>
            <p className="post-content">
              {postToRender.content && postToRender.content.split(/(\s+)/).map((word, i) => {
                if (word.startsWith('#')) {
                  return <span key={i} className="hashtag">{word}</span>;
                }
                return word;
              })}
            </p>

            {/* Display media if available */}
            {hasMedia && (
              <div className="post-media-container">
                {postToRender.media.map((mediaUrl, index) => {
                  // Create a placeholder image URL (using a more relevant placeholder)
                  const placeholderImage = "https://via.placeholder.com/400x300?text=Image+Loading...";

                  return (
                    <div key={index} className="post-media">
                      <img
                        src={mediaUrl}
                        alt={`Post media ${index + 1}`}
                        className="post-media-image"
                        onError={(e) => {
                          console.warn(`Failed to load image: ${mediaUrl}`);
                          e.target.onerror = null; // Prevent infinite loop
                          e.target.src = placeholderImage; // Use placeholder instead of hiding
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

  // Helper function to get post ID (handles both id and _id)
  const getPostId = (post) => post.id || post._id;

  // Helper function to check if post is liked
  const isPostLiked = (post) => {
    // Check if post has a 'liked' property
    if (post.liked !== undefined) {
      return post.liked;
    }

    // Check if post has likes array and current user's ID is in it
    const userId = localStorage.getItem('userId');
    return post.likes && Array.isArray(post.likes) && post.likes.includes(userId);
  };

  return (
    <div className="post-list-container">
      <div className="post-list-content">
        {posts.length === 0 ? (
          <p className="no-post">No posts to show.</p>
        ) : (
          posts.map((post) => {
            const postId = getPostId(post);
            return (
              <div key={postId} className="post-card">
                {renderPostContent(post)}

                <div className="post-actions">
                  <div className="post-action-group">
                    <button
                      onClick={() => {}}
                      className="post-action-button comment-button"
                      disabled={actionInProgress[postId]}
                      aria-label="Reply"
                    >
                      <FaRegComment />
                    </button>
                    <span className="post-action-count">{post.comments?.length || 185}</span>
                  </div>

                  <div className="post-action-group">
                    <button
                      onClick={() => handleRetweet(postId)}
                      className={`post-action-button retweet-button ${post.retweeted ? 'retweeted' : ''}`}
                      disabled={actionInProgress[postId]}
                      aria-label="Retweet"
                    >
                      <FaRetweet />
                    </button>
                    <span className="post-action-count">{post.retweets?.length || 1}K</span>
                  </div>

                  <div className="post-action-group">
                    <button
                      onClick={() => handleLike(postId)}
                      className={`post-action-button like-button ${isPostLiked(post) ? 'liked' : ''}`}
                      disabled={actionInProgress[postId]}
                      aria-label="Like"
                    >
                      {isPostLiked(post) ? <FaHeart /> : <FaRegHeart />}
                    </button>
                    <span className="post-action-count">{post.likes?.length || 10}K</span>
                  </div>

                  <div className="post-action-group">
                    <button
                      className="post-action-button share-button"
                      disabled={actionInProgress[postId]}
                      aria-label="Share"
                    >
                      <FaShare />
                    </button>
                  </div>

                  {/* Only show delete button if it's the user's own post */}
                  {post.postedBy?.id === localStorage.getItem('userId') && (
                    <div className="post-action-group">
                      <button
                        onClick={() => handleDelete(postId)}
                        className="post-action-button delete-button"
                        disabled={actionInProgress[postId]}
                        aria-label="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
