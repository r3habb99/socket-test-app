/**
 * Helper functions for the PostList component
 */

import { toast } from "react-toastify";

/**
 * Get post ID (handles both id and _id)
 * @param {Object} post - The post object
 * @returns {string|null} Post ID or null if post is invalid
 */
export const getPostId = (post) => {
  if (!post) return null;
  return post.id || post._id;
};

/**
 * Format timestamp for display
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted timestamp
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "9h"; // Default fallback

  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

/**
 * Navigate to user profile
 * @param {Object} user - The user object
 * @param {Function} navigate - React Router's navigate function
 */
export const navigateToUserProfile = (user, navigate) => {
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
