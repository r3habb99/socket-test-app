import { api } from "./axios";
import { handleApiError } from "./axios";

// Create a new individual chat with another user
export const createChat = async (userId) => {
  try {
    const response = await api.post("/chat", { userId });
    console.log("Raw API response from createChat:", response.data);

    // Check if the response has the expected structure
    if (
      response.data &&
      response.data.statusCode === 201 &&
      response.data.data
    ) {
      // Return the actual chat data
      return response.data.data;
    }

    // If the response doesn't have the expected structure, return it as is
    return response.data;
  } catch (error) {
    console.error("Error in createChat:", error);
    return handleApiError(error);
  }
};

// Create a new group chat with multiple users
export const createGroupChat = async (chatName, users) => {
  try {
    const response = await api.post("/chat/group", {
      chatName,
      users,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get all chats for the logged-in user
export const getAllChats = async () => {
  try {
    const response = await api.get("/chat");
    console.log("Raw API response from getAllChats:", response.data);

    // Check if the response has the expected structure
    if (response.data && response.data.data) {
      // Return the actual chats data
      return response.data.data;
    }

    // If the response doesn't have the expected structure, return it as is
    return response.data;
  } catch (error) {
    console.error("Error in getAllChats:", error);
    return handleApiError(error);
  }
};

// Get messages for a specific chat
export const getChatMessages = async (chatId) => {
  try {
    const response = await api.get(`/chat/${chatId}/messages`);
    console.log("Raw API response from getChatMessages:", response.data);

    // Check if the response has the expected structure
    if (response.data && response.data.data) {
      // Return the actual messages data
      return response.data.data;
    }

    // If the response doesn't have the expected structure, return it as is
    return response.data;
  } catch (error) {
    console.error("Error in getChatMessages:", error);
    return handleApiError(error);
  }
};

// Send a message in a chat
export const sendMessage = async (chatId, content, additionalData = {}) => {
  try {
    console.log(
      `Sending message to chat ${chatId}: "${content}"`,
      additionalData
    );

    // Include any additional data in the request
    const requestData = {
      content,
      ...additionalData,
    };

    const response = await api.post(`/chat/${chatId}/message`, requestData);
    console.log("Raw API response from sendMessage:", response.data);

    // Check if the response has the expected structure
    if (response.data && response.data.data) {
      // If we have username in additionalData, make sure it's included in the response
      if (additionalData.username && response.data.data.sender) {
        // If sender is an object, add username to it
        if (typeof response.data.data.sender === "object") {
          response.data.data.sender.username = additionalData.username;
        }
        // If sender is just an ID, convert it to an object with username
        else {
          response.data.data.sender = {
            _id: response.data.data.sender,
            id: response.data.data.sender,
            username: additionalData.username,
          };
        }
      }

      // Return the actual message data
      return response.data.data;
    }

    // If the response doesn't have the expected structure, return it as is
    return response.data;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return handleApiError(error);
  }
};

// Add a user to a group chat
export const addUserToGroup = async (chatId, userId) => {
  try {
    const response = await api.put("/chat/group/add-user", { chatId, userId });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Remove a user from a group chat
export const removeUserFromGroup = async (chatId, userId) => {
  try {
    const response = await api.put("/chat/group/remove-user", {
      chatId,
      userId,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update group chat name
export const updateGroupName = async (chatId, chatName) => {
  try {
    const response = await api.put("/chat/group/update-name", {
      chatId,
      chatName,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Archive a chat
export const archiveChat = async (chatId) => {
  try {
    const response = await api.put("/chat/archive", { chatId });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get unread message counts
export const getUnreadMessageCount = async () => {
  try {
    const response = await api.get("/chat/unread");
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
