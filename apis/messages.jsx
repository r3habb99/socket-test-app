import { api } from "./axios";
import { handleApiError } from "./axios";

// Create a new message
export const createMessage = async (content, chatId) => {
  try {
    const response = await api.post("/message", { content, chatId });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get all messages for a specific chat by chatId
export const getMessagesForChat = async (chatId) => {
  try {
    const response = await api.get(`/message/id`, {
      params: { chatId },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Delete a message
export const deleteMessage = async (messageId) => {
  try {
    const response = await api.delete(`/message/${messageId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Edit a message
export const editMessage = async (messageId, content) => {
  try {
    const response = await api.put(`/message/${messageId}`, { content });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Search messages
export const searchMessages = async (chatId, query) => {
  try {
    const response = await api.get(`/message/search`, {
      params: { chatId, query },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Mark message as read (for socket implementation)
export const markMessageAsRead = async (messageId, chatId) => {
  try {
    // This is typically handled via socket.io, but we can also implement a REST endpoint
    const response = await api.put(`/message/${messageId}/read`, { chatId });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
