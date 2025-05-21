/**
 * User Presence Utilities
 * Manages user online status and last seen times
 */
import { formatDistanceToNow } from 'date-fns';

// Local storage keys
const ONLINE_USERS_KEY = 'online_users';
const LAST_SEEN_KEY = 'last_seen_users';

/**
 * Set a user as online
 * @param {string} userId - User ID
 * @param {Object} userData - Additional user data
 * @returns {Object} Updated online users
 */
export const setUserOnline = (userId, userData = {}) => {
  try {
    // Get current online users
    const onlineUsers = getOnlineUsers();

    // Add user to online users with timestamp
    const updatedUsers = {
      ...onlineUsers,
      [userId]: {
        ...userData,
        timestamp: new Date().toISOString(),
        online: true
      }
    };

    // Save to localStorage
    localStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(updatedUsers));

    return updatedUsers;
  } catch (error) {
    console.error('Failed to set user online:', error);
    return {};
  }
};

/**
 * Set a user as offline
 * @param {string} userId - User ID
 * @returns {Object} Updated online users
 */
export const setUserOffline = (userId) => {
  try {
    // Get current online users
    const onlineUsers = getOnlineUsers();

    // Remove user from online users
    const updatedUsers = { ...onlineUsers };
    delete updatedUsers[userId];

    // Save to localStorage
    localStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(updatedUsers));

    // Update last seen
    updateLastSeen(userId);

    return updatedUsers;
  } catch (error) {
    console.error('Failed to set user offline:', error);
    return {};
  }
};

/**
 * Get all online users
 * @returns {Object} Online users
 */
export const getOnlineUsers = () => {
  try {
    const usersString = localStorage.getItem(ONLINE_USERS_KEY);
    return usersString ? JSON.parse(usersString) : {};
  } catch (error) {
    console.error('Failed to get online users:', error);
    return {};
  }
};

/**
 * Check if a user is online
 * @param {string} userId - User ID
 * @returns {boolean} Whether the user is online
 */
export const isUserOnline = (userId) => {
  const onlineUsers = getOnlineUsers();
  return !!onlineUsers[userId];
};

/**
 * Update a user's last seen time
 * @param {string} userId - User ID
 * @returns {Object} Updated last seen times
 */
export const updateLastSeen = (userId) => {
  try {
    // Get current last seen times
    const lastSeen = getLastSeenTimes();

    // Update last seen time
    const updatedLastSeen = {
      ...lastSeen,
      [userId]: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(updatedLastSeen));

    return updatedLastSeen;
  } catch (error) {
    console.error('Failed to update last seen:', error);
    return {};
  }
};

/**
 * Get all last seen times
 * @returns {Object} Last seen times
 */
export const getLastSeenTimes = () => {
  try {
    const lastSeenString = localStorage.getItem(LAST_SEEN_KEY);
    return lastSeenString ? JSON.parse(lastSeenString) : {};
  } catch (error) {
    console.error('Failed to get last seen times:', error);
    return {};
  }
};

/**
 * Get a user's last seen time
 * @param {string} userId - User ID
 * @returns {string|null} Last seen time ISO string or null
 */
export const getUserLastSeen = (userId) => {
  const lastSeen = getLastSeenTimes();
  return lastSeen[userId] || null;
};

/**
 * Format last seen time to human-readable string
 * @param {string} lastSeenTime - ISO timestamp
 * @returns {string} Formatted last seen string
 */
export const formatLastSeen = (lastSeenTime) => {
  if (!lastSeenTime) return 'Never';

  try {
    // Use date-fns for consistent formatting
    return formatDistanceToNow(new Date(lastSeenTime), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting last seen time:', error);

    // Fallback to basic formatting
    const lastSeen = new Date(lastSeenTime);
    const now = new Date();
    const diffSeconds = Math.floor((now - lastSeen) / 1000);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffSeconds < 604800) {
      const days = Math.floor(diffSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return lastSeen.toLocaleDateString();
    }
  }
};
