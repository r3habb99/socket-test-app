import { searchUsers } from "../../../auth/api/authApi";
import { customToast } from "../../../../shared/utils";

/**
 * Format chat timestamp for display
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time string
 */
export const formatChatTime = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();

  // If today, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // If this year, show month/day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: "numeric", day: "numeric" });
  }

  // Otherwise show month/day/year
  return date.toLocaleDateString([], {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
};

/**
 * Get chat name for display
 * @param {Object} chat - Chat object
 * @returns {string} Chat name
 */
export const getChatName = (chat) => {
  // For group chats, use the chat name
  if (chat.isGroupChat) {
    return chat.chatName || "Group Chat";
  }

  // For 1:1 chats, find the other user (not the current logged-in user)
  const currentUserId = localStorage.getItem("userId");
  const otherUser = chat.users?.find(
    (user) => String(user._id || user.id) !== String(currentUserId)
  );

  // Return the other user's name (first name + last name if available)
  if (otherUser) {
    if (otherUser.firstName && otherUser.lastName) {
      return `${otherUser.firstName} ${otherUser.lastName}`;
    }
    return otherUser.username;
  }
  return "Unknown User";
};

/**
 * Get username for non-group chats
 * @param {Object} chat - Chat object
 * @returns {string|null} Username or null for group chats
 */
export const getChatUsername = (chat) => {
  if (chat.isGroupChat) return null;

  const currentUserId = localStorage.getItem("userId");
  const otherUser = chat.users?.find(
    (user) => String(user._id || user.id) !== String(currentUserId)
  );

  return otherUser ? `@${otherUser.username || "user"}` : null;
};

/**
 * Search for users
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
export const handleUserSearch = async (query) => {
  if (!query.trim()) {
    return [];
  }

  try {
    // Create search params object based on the query
    // This allows searching by firstName, lastName, username, or email
    const searchParams = {
      firstName: query,
      lastName: query,
      username: query,
      email: query
    };

    const response = await searchUsers(searchParams);

    // Handle nested data structure
    let results = [];

    if (!response.error) {
      if (response.data && response.data.statusCode === 200 && Array.isArray(response.data.data)) {
        // API returns { statusCode: 200, message: "...", data: [...] }
        results = response.data.data;
      } else if (response.data && response.data.data) {
        // API returns { data: { data: [...] } }
        results = response.data.data;
      } else if (Array.isArray(response.data)) {
        // API returns { data: [...] }
        results = response.data;
      } else {
        console.warn("Unexpected search results format:", response.data);
      }
    }

    // Filter out the current user from search results
    const currentUserId = localStorage.getItem("userId");
    results = results.filter(user => String(user._id || user.id) !== String(currentUserId));

    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("Error searching users:", error);
    customToast.error("Error searching for users. Please try again.");
    return [];
  }
};

/**
 * Check if a chat already exists with a user
 * @param {Array} chats - List of chats
 * @param {string} userId - User ID to check
 * @returns {Object|null} Existing chat or null
 */
export const findExistingChat = (chats, userId) => {
  const currentUserId = localStorage.getItem("userId");
  
  return chats.find(chat => {
    // Skip group chats
    if (chat.isGroupChat) return false;
    
    // Check if this is a 1:1 chat with the selected user
    return chat.users?.some(chatUser => 
      (chatUser._id === userId || chatUser.id === userId) && 
      chat.users?.some(u => String(u._id || u.id) === String(currentUserId))
    );
  });
};

/**
 * Start a chat with a user
 * @param {Object} user - User to chat with
 * @param {Array} chats - List of existing chats
 * @param {Function} createChat - Function to create a new chat
 * @param {Function} onSelectChat - Function to select a chat
 * @param {Function} clearSearch - Function to clear search state
 * @returns {Promise<void>}
 */
export const startChatWithUser = async (user, chats, createChat, onSelectChat, clearSearch) => {
  try {
    // Ensure we have a valid user ID
    if (!user) {
      console.error("Invalid user object:", user);
      customToast.error("Invalid user. Please try again.");
      return;
    }

    const userId = user._id || user.id;
    if (!userId) {
      console.error("User object has no ID:", user);
      customToast.error("User has no ID. Please try again.");
      return;
    }

    // Check if a chat already exists with this user
    const existingChat = findExistingChat(chats, userId);

    if (existingChat) {
      // If chat exists, just select it
      onSelectChat(existingChat);
      
      // Clear search
      if (clearSearch) clearSearch();
      
      return;
    }

    // If no existing chat, create a new one
    const result = await createChat({ userId });

    if (result.success) {
      // Select the new chat
      onSelectChat(result.chat);

      // Clear search
      if (clearSearch) clearSearch();

      // Show success toast
      customToast.success(`Chat started with ${user.username}`);
    } else {
      console.error("Failed to create chat:", result);
      customToast.error("Failed to create chat. Please try again.");
    }
  } catch (error) {
    console.error("Error creating chat:", error);
    customToast.error("Failed to create chat. Please try again.");
  }
};
