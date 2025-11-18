import {
  apiClient,
  endpoints,
  handleApiError,
  handleApiResponse,
} from "../../../shared/api";

/**
 * Get all chats for the current user
 * @returns {Promise<Object>} Response object
 */
export const getAllChats = async () => {
  try {
    const response = await apiClient.get(endpoints.chat.getAll);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create a new chat
 * @param {Object} chatData - Chat data
 * @param {string} chatData.chatName - Chat name (optional for direct chats)
 * @param {boolean} chatData.isGroupChat - Whether it's a group chat
 * @param {Array<string>} chatData.users - Array of user IDs
 * @returns {Promise<Object>} Response object
 */
export const createChat = async (chatData) => {
  try {
    const response = await apiClient.post(endpoints.chat.create, chatData);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create a direct chat with another user
 * @param {string} userId - User ID to chat with
 * @returns {Promise<Object>} Response object
 */
export const createDirectChat = async (userId) => {
  try {
    const response = await apiClient.post(endpoints.chat.create, { userId });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get chat by ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Response object
 */
export const getChatById = async (chatId) => {
  try {
    const response = await apiClient.get(endpoints.chat.getById(chatId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update group chat name
 * @param {string} chatId - Chat ID
 * @param {string} chatName - New chat name
 * @returns {Promise<Object>} Response object
 */
export const updateGroupName = async (chatId, chatName) => {
  try {
    const response = await apiClient.put("/chat/group/update-name", {
      chatId,
      chatName,
    });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Archive a chat
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Response object
 */
export const archiveChat = async (chatId) => {
  try {
    const response = await apiClient.put("/chat/archive", { chatId });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get unread message counts
 * @returns {Promise<Object>} Response object
 */
export const getUnreadMessageCount = async () => {
  try {
    const response = await apiClient.get("/chat/unread");
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get all messages for a chat
 * @param {string} chatId - Chat ID
 * @param {number} limit - Number of messages to retrieve (default: 20)
 * @param {number} skip - Number of messages to skip (default: 0)
 * @returns {Promise<Object>} Response object
 */
export const getMessages = async (chatId, limit = 20, skip = 0) => {
  try {
    const response = await apiClient.get("/message/chat", {
      params: { chatId, limit, skip }
    });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get messages for a chat by chat ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Response object
 */
export const getMessagesForChat = async (chatId) => {
  try {
    const response = await apiClient.get("/message/id", { params: { chatId } });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Send a message with optional media files
 * @param {Object} messageData - Message data
 * @param {string} messageData.content - Message content (optional if media is provided)
 * @param {string} messageData.chatId - Chat ID
 * @param {Array<File>} messageData.media - Array of media files (optional)
 * @returns {Promise<Object>} Response object
 */
export const sendMessage = async (messageData) => {
  try {
    // Check if we have media files to upload
    const hasMedia = messageData.media && messageData.media.length > 0;

    let requestData;
    let config = {};

    if (hasMedia) {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('content', messageData.content || '');
      formData.append('chatId', messageData.chatId);

      // Append media files
      messageData.media.forEach((file) => {
        formData.append('media', file);
      });

      // Add other optional fields
      if (messageData.messageType) {
        formData.append('messageType', messageData.messageType);
      }
      if (messageData.replyToId) {
        formData.append('replyToId', messageData.replyToId);
      }

      requestData = formData;
      config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
    } else {
      // Regular JSON request
      requestData = messageData;
    }

    const response = await apiClient.post(
      endpoints.message.create,
      requestData,
      config
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a message
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} Response object
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await apiClient.delete(
      endpoints.message.delete(messageId)
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Edit a message with optional media files
 * @param {string} messageId - Message ID
 * @param {Object} messageData - Message data
 * @param {string} messageData.content - New message content (optional if media is provided)
 * @param {string} messageData.chatId - Chat ID
 * @param {Array<File>} messageData.media - Array of media files (optional)
 * @returns {Promise<Object>} Response object
 */
export const editMessage = async (messageId, messageData) => {
  try {
    // Check if we have media files to upload
    const hasMedia = messageData.media && messageData.media.length > 0;

    let requestData;
    let config = {};

    if (hasMedia) {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('content', messageData.content || '');
      formData.append('chatId', messageData.chatId);

      // Append media files
      messageData.media.forEach((file) => {
        formData.append('media', file);
      });

      requestData = formData;
      config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
    } else {
      // Regular JSON request
      requestData = messageData;
    }

    const response = await apiClient.put(
      endpoints.message.update(messageId),
      requestData,
      config
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Search messages
 * @param {string} chatId - Chat ID
 * @param {string} query - Search query
 * @returns {Promise<Object>} Response object
 */
export const searchMessages = async (chatId, query) => {
  try {
    const response = await apiClient.get("/message/search", {
      params: { chatId, query },
    });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Mark message as read
 * @param {string} messageId - Message ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Response object
 */
export const markMessageAsRead = async (messageId, chatId) => {
  try {
    const response = await apiClient.put(`/message/${messageId}/read`, {
      chatId,
    });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};
