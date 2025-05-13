import React, { useState } from "react";
import { FaRetweet } from "react-icons/fa";
import { Button, Tooltip, Spin } from "antd";
import { toast } from "react-toastify";
import { retweetPost, undoRetweet } from "../../api/postApi";
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
    // If the post has a retweetCount property, use it directly
    if (typeof post.retweetCount === 'number') {
      return post.retweetCount;
    }

    // Check retweetUsers array
    if (post.retweetUsers) {
      return post.retweetUsers.length;
    }

    // Check retweets array or object
    if (post.retweets) {
      if (Array.isArray(post.retweets)) {
        return post.retweets.length;
      } else if (typeof post.retweets === 'object') {
        return Object.keys(post.retweets).length;
      }
    }

    // If no retweet information is found, return 0
    return 0;
  };

  /**
   * Handle retweet action
   */
  const handleRetweet = async () => {
    if (actionInProgress) return;

    setActionInProgress(true);
    try {
      // Check if the post is already retweeted by the current user
      const alreadyRetweeted = isPostRetweeted(post);

      // If already retweeted, we need to handle it as an "undo retweet" action
      if (alreadyRetweeted) {
        // Call the API to undo the retweet
        const response = await undoRetweet(postId);

        if (response.error) {
          toast.error("Failed to undo retweet. Please try again.");
          return;
        }

        // Find and remove the retweet from the posts list
        const currentUserId = localStorage.getItem('userId');

        // Update the posts state to remove the retweet
        setPosts((prevPosts) => {
          // First, find any retweets of this post by the current user
          const userRetweets = prevPosts.filter(p =>
            (p.retweetData && getPostId(p.retweetData) === postId &&
             p.postedBy && (p.postedBy.id === currentUserId || p.postedBy._id === currentUserId))
          );

          // Remove those retweets
          const postsWithoutUserRetweets = prevPosts.filter(p => !userRetweets.includes(p));

          // Update the original post to mark it as not retweeted by the current user
          return postsWithoutUserRetweets.map(p => {
            if (getPostId(p) === postId) {
              // Create a copy of the post with updated retweet information
              const updatedRetweets = Array.isArray(p.retweets)
                ? p.retweets.filter(id => id !== currentUserId && id?.userId !== currentUserId)
                : [];

              return {
                ...p,
                retweeted: false,
                retweets: updatedRetweets
              };
            }
            return p;
          });
        });

        toast.success("Retweet removed successfully!");

        // Emit socket event if connected
        if (connected && emit) {
          emit("post unretweeted", { postId });
        }

        // Refresh posts to get the updated data from the server
        if (typeof onPostsUpdated === 'function') {
          setTimeout(() => {
            onPostsUpdated();
          }, 500);
        }

        setActionInProgress(false);
        return;
      }

      // If not already retweeted, proceed with the retweet action
      const response = await retweetPost(postId);

      if (response.error) {
        toast.error("Failed to retweet post. Please try again.");
        return;
      }

      // Handle 204 No Content response (success but no data)
      if (response.status === 204 || (response.success && !response.data)) {
        toast.success("Post retweeted successfully!");

        // Get current user info to ensure we have proper user data in the retweet
        const currentUserId = localStorage.getItem('userId');
        const currentUsername = localStorage.getItem('username') || 'user';
        const currentFirstName = localStorage.getItem('firstName') || '';
        const currentLastName = localStorage.getItem('lastName') || '';
        const currentProfilePic = localStorage.getItem('profilePic') || '';

        // Mark the post as retweeted in the current posts list
        setPosts((prevPosts) => {
          return prevPosts.map(p => {
            if (getPostId(p) === postId) {
              // Create a new retweet post with the original post as retweetData
              const newRetweet = {
                _id: `retweet_${Date.now()}`, // Temporary ID until refresh
                id: `retweet_${Date.now()}`,
                content: p.content,
                retweetData: p,
                retweeted: true,
                postedBy: {
                  _id: currentUserId,
                  id: currentUserId,
                  username: currentUsername,
                  firstName: currentFirstName,
                  lastName: currentLastName,
                  profilePic: currentProfilePic
                },
                createdAt: new Date().toISOString(),
                retweets: p.retweets
                  ? [...p.retweets, currentUserId]
                  : [currentUserId]
              };

              // Add the new retweet to the posts array
              setTimeout(() => {
                setPosts(prevPosts => [newRetweet, ...prevPosts.filter(post => getPostId(post) !== newRetweet._id)]);
              }, 0);

              // Also update the original post's retweet count
              return {
                ...p,
                retweeted: true,
                retweets: p.retweets
                  ? [...p.retweets, currentUserId]
                  : [currentUserId]
              };
            }
            return p;
          });
        });

        // Refresh posts to get the updated data from the server
        if (typeof onPostsUpdated === 'function') {
          setTimeout(() => {
            onPostsUpdated();
          }, 500); // Small delay to ensure UI updates first
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

        // Get current user info to ensure we have proper user data in the retweet
        const currentUserId = localStorage.getItem('userId');
        const currentUsername = localStorage.getItem('username') || 'user';
        const currentFirstName = localStorage.getItem('firstName') || '';
        const currentLastName = localStorage.getItem('lastName') || '';
        const currentProfilePic = localStorage.getItem('profilePic') || '';

        // Ensure the retweet has proper user information
        if (!newRetweet.postedBy || Object.keys(newRetweet.postedBy).length === 0) {
          newRetweet.postedBy = {
            _id: currentUserId,
            id: currentUserId,
            username: currentUsername,
            firstName: currentFirstName,
            lastName: currentLastName,
            profilePic: currentProfilePic
          };
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
      <Tooltip title={retweeted ? "Undo Retweet" : "Retweet"}>
        <Button
          type="text"
          onClick={handleRetweet}
          className={`post-action-button retweet-button ${retweeted ? 'retweeted' : ''}`}
          disabled={actionInProgress}
          aria-label={retweeted ? "Undo Retweet" : "Retweet"}
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
