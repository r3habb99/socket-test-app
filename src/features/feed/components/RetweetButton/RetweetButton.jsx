import React, { useState } from "react";
import { FaRetweet } from "react-icons/fa";
import { Button, Tooltip, Spin } from "antd";
import { toast } from "react-toastify";
import { retweetPost } from "../../api/postApi";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import "./RetweetButton.css";

/**
 * RetweetButton component for retweeting posts
 * @param {Object} props - Component props
 * @param {Object} props.post - The post object
 * @param {Function} props.setPosts - Function to update posts state
 * @param {Function} props.onPostsUpdated - Callback function to refresh posts
 * @param {Function} props.getPostId - Function to get post ID
 * @returns {JSX.Element} RetweetButton component
 */
export const RetweetButton = ({ 
  post, 
  setPosts, 
  onPostsUpdated,
  getPostId 
}) => {
  const [actionInProgress, setActionInProgress] = useState(false);
  const { connected, emit } = useSocketContext();
  const postId = getPostId(post);

  /**
   * Check if post is retweeted by current user
   * @param {Object} post - The post object
   * @returns {boolean} True if post is retweeted
   */
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

  /**
   * Get retweet count from post object
   * @param {Object} post - The post object
   * @returns {number} Retweet count
   */
  const getRetweetCount = (post) => {
    if (post.retweetUsers) {
      return post.retweetUsers.length;
    }
    
    if (post.retweets) {
      if (Array.isArray(post.retweets)) {
        return post.retweets.length;
      } else if (typeof post.retweets === 'object') {
        return Object.keys(post.retweets).length;
      }
    }
    
    return 0;
  };

  /**
   * Handle retweet action
   */
  const handleRetweet = async () => {
    if (actionInProgress) return;

    setActionInProgress(true);
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
          return prevPosts.map(p => {
            if (getPostId(p) === postId) {
              // Create a copy of the post with retweeted flag
              return {
                ...p,
                retweeted: true,
                // Increment retweet count if it exists
                retweets: p.retweets
                  ? [...p.retweets, localStorage.getItem('userId')]
                  : [localStorage.getItem('userId')]
              };
            }
            return p;
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
        const newRetweet = response.data.data?.post;
        
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
            (p) => getPostId(p) !== newRetweetId
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
      setActionInProgress(false);
    }
  };

  const retweeted = isPostRetweeted(post);
  const retweetCount = getRetweetCount(post);

  return (
    <div className="retweet-button-container post-action-group">
      <Tooltip title="Retweet">
        <Button
          type="text"
          onClick={handleRetweet}
          className={`post-action-button retweet-button ${retweeted ? 'retweeted' : ''}`}
          disabled={actionInProgress}
          aria-label="Retweet"
          icon={
            actionInProgress ? (
              <Spin size="small" />
            ) : (
              <FaRetweet />
            )
          }
        />
      </Tooltip>
      <span className="post-action-count">{retweetCount}</span>
    </div>
  );
};

export default RetweetButton;
