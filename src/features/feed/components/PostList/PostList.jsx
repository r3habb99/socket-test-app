import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { deletePost, likePost, retweetPost } from "../../api/postApi";

import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import { getImageUrl } from "../../../../shared/utils/imageUtils";
import { ImageProxy } from "../../../../shared/components";
import { FaHeart, FaRegHeart, FaRetweet, FaTrash, FaRegComment, FaShare } from "react-icons/fa";
import { toast } from "react-toastify";
import "./PostList.css";

export const PostList = ({ posts, setPosts, onPostsUpdated }) => {
  const [actionInProgress, setActionInProgress] = useState({});
  const { connected, emit } = useSocketContext();
  const navigate = useNavigate();

  const handleLike = async (postId) => {
    if (actionInProgress[postId]) return;

    setActionInProgress((prev) => ({ ...prev, [postId]: "like" }));
    try {
      const response = await likePost(postId);

      if (response.error) {
        toast.error("Error liking post. Please try again.");
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
      toast.error("Error liking/unliking post. Please try again.");
    } finally {
      setActionInProgress((prev) => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
      onPostsUpdated()
    }
  };

  const handleRetweet = async (postId) => {
    if (actionInProgress[postId]) return;

    setActionInProgress((prev) => ({ ...prev, [postId]: "retweet" }));
    try {
      const response = await retweetPost(postId);

      if (response.error) {
        toast.error("Failed to retweet post. Please try again.");
        return;
      }

      // Handle 204 No Content response (success but no data)
      if (response.status === 204 || (response.success && !response.data)) {
        toast.success("Post retweeted successfully!");

        // Mark the post as retweeted in the current posts list
        setPosts((prevPosts) => {
          return prevPosts.map(post => {
            if (getPostId(post) === postId) {
              // Create a copy of the post with retweeted flag
              return {
                ...post,
                retweeted: true,
                // Increment retweet count if it exists
                retweets: post.retweets
                  ? [...post.retweets, localStorage.getItem('userId')]
                  : [localStorage.getItem('userId')]
              };
            }
            return post;
          });
        });

        // Refresh posts to get the updated data from the server
        if (typeof onPostsUpdated === 'function') {
          onPostsUpdated();
        }
        return;
      }

      // Handle response with data (the server returned the new retweet)
      if (response.data) {

        const newRetweet = response.data.data.post;
        console.log(newRetweet, "newRetweetId");
        // Ensure we have a valid post object
        if (!newRetweet || typeof newRetweet !== 'object') {
          toast.error("Failed to retweet post. Please try again.");
          return;
        }

        const newRetweetId = getPostId(newRetweet);

        if (!newRetweetId) {
          toast.error("Failed to retweet post. Please try again.");
          return;
        }

        // Add new retweet at the top and remove duplicate if any
        setPosts((prevPosts) => {
          const filteredPosts = prevPosts.filter(
            (post) => getPostId(post) !== newRetweetId
          );
          return [newRetweet, ...filteredPosts];
        });

        // Show success message
        toast.success("Post retweeted successfully!");

        // Emit socket event if connected
        if (connected && emit) {
          emit("post retweeted", newRetweet);
        }
      } else {
        // If we get here, something unexpected happened
        toast.warning("Retweet may have been successful. Refreshing posts...");

        // Refresh posts to get the latest data
        if (typeof onPostsUpdated === 'function') {
          onPostsUpdated();
        }
      }
    } catch (error) {
      toast.error("Failed to retweet post. Please try again.");
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

    // Show confirmation dialog
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setActionInProgress((prev) => ({ ...prev, [postId]: "delete" }));
    try {
      const response = await deletePost(postId);

      if (response.error) {
        toast.error("Failed to delete post. Please try again.");
        return;
      }

      setPosts((prevPosts) => prevPosts.filter((post) => getPostId(post) !== postId));

      // Show success message
      toast.success("Post deleted successfully!");

      // Emit socket event if connected
      if (connected && emit) {
        emit("post deleted", postId);
      }
    } catch (error) {
      toast.error("Failed to delete post. Please try again.");
    } finally {
      setActionInProgress((prev) => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
    }
  };

  const renderPostContent = (post) => {
    // Check if post has retweetData (from the API response structure)
    const original = post.retweetData || post.retweetedFrom;

    // Use postedBy object directly from post, ensuring we handle the API response structure
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
          <div
            className="post-avatar clickable"
            onClick={() => navigateToUserProfile(postedByUser)}
            title={`View ${postedByUser.username}'s profile`}
          >
            <ImageProxy
              src={postedByUser.profilePic ? getImageUrl(postedByUser.profilePic, DEFAULT_PROFILE_PIC) : DEFAULT_PROFILE_PIC}
              alt={postedByUser.username || "User"}
              className="avatar"
              defaultSrc={DEFAULT_PROFILE_PIC}
              onError={() => {
                // Silent error handling - fallback to default image
              }}
            />
          </div>
          <div className="post-user-info">
            <div className="post-user-name-container">
              <span
                className="post-user-name clickable"
                onClick={() => navigateToUserProfile(postedByUser)}
                title={`View ${postedByUser.username}'s profile`}
              >
                {postedByUser.firstName} {postedByUser.lastName || "User"}
                {isVerified && <span className="verified-badge">✓</span>}
              </span>
              <span
                className="post-user-handle clickable"
                onClick={() => navigateToUserProfile(postedByUser)}
                title={`View ${postedByUser.username}'s profile`}
              >
                @{original?.postedBy?.username || postedByUser.username || "user"}
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
        </div>
      </>
    );
  };

  // Helper function to get post ID (handles both id and _id)
  const getPostId = (post) => {
    if (!post) return null;
    return post.id || post._id;
  };

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

  // Helper function to check if post is retweeted
  const isPostRetweeted = (post) => {
    // Check if post has a 'retweeted' property
    if (post.retweeted !== undefined) {
      return post.retweeted;
    }

    // Check if post has a retweetedFrom or retweetData property
    if (post.retweetedFrom || post.retweetData) {
      return true;
    }

    // Check if post has retweets array and current user's ID is in it
    const userId = localStorage.getItem('userId');

    // Handle different formats of retweets array
    if (post.retweets) {
      if (Array.isArray(post.retweets)) {
        // If retweets is an array of strings (user IDs)
        if (post.retweets.includes(userId)) {
          return true;
        }

        // If retweets is an array of objects with user ID
        for (const retweet of post.retweets) {
          if (typeof retweet === 'object' && (retweet.userId === userId || retweet.user === userId)) {
            return true;
          }
        }
      } else if (typeof post.retweets === 'object') {
        // If retweets is an object with user IDs as keys
        return post.retweets[userId] !== undefined;
      }
    }

    // Check retweetUsers array (from API response)
    if (post.retweetUsers && Array.isArray(post.retweetUsers)) {
      return post.retweetUsers.includes(userId);
    }

    return false;
  };

  // Helper function to check if post belongs to the logged-in user
  const isOwnPost = (post) => {
    const userId = localStorage.getItem('userId');
    if (!userId || !post) return false;

    // Check different possible structures
    if (post.postedBy) {
      const postedById = post.postedBy.id || post.postedBy._id;
      return postedById === userId;
    }

    // If post has userId field
    if (post.userId) {
      return post.userId === userId;
    }

    // If post has user field
    if (post.user) {
      const postUserId = post.user.id || post.user._id;
      return postUserId === userId;
    }

    return false;
  };

  // Function to navigate to user profile
  const navigateToUserProfile = (user) => {
    if (!user) return;

    // Get the user ID (either id or _id)
    const userId = user.id || user._id;

    if (!userId) {
      toast.error("Could not find user information");
      return;
    }

    // Navigate to the profile page
    navigate(`/profile/${userId}`);
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
                    <span className="post-action-count">{post.comments?.length || 0}</span>
                  </div>

                  <div className="post-action-group">
                    <button
                      onClick={() => handleRetweet(postId)}
                      className={`post-action-button retweet-button ${isPostRetweeted(post) ? 'retweeted' : ''}`}
                      disabled={actionInProgress[postId]}
                      aria-label="Retweet"
                      title="Retweet"
                    >
                      {actionInProgress[postId] === "retweet" ? (
                        <span className="loading-spinner"></span>
                      ) : (
                        <FaRetweet />
                      )}
                    </button>
                    <span className="post-action-count">
                      {post.retweetUsers ? post.retweetUsers.length :
                       (post.retweets ? (Array.isArray(post.retweets) ? post.retweets.length : Object.keys(post.retweets).length) : 0)}
                    </span>
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
                    <span className="post-action-count">{post.likes?.length || 0}</span>
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
                  {isOwnPost(post) && (
                    <div className="post-action-group">
                      <button
                        onClick={() => handleDelete(postId)}
                        className="post-action-button delete-button"
                        disabled={actionInProgress[postId]}
                        aria-label="Delete"
                        title="Delete post"
                      >
                        {actionInProgress[postId] === "delete" ? (
                          <span className="loading-spinner"></span>
                        ) : (
                          <FaTrash />
                        )}
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
