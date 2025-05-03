import { useState, useCallback } from "react";
import {
  getAllChats,
  getChatById,
  getMessages,
  sendMessage as sendMessageApi,
  createChat as createChatApi,
} from "../api/messagingApi";

/**
 * Custom hook for messaging functionality
 * @returns {Object} Messaging methods and state
 */
export const useMessaging = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all chats
  const fetchChats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAllChats();

      if (response.error) {
        setError(response.message);
        return;
      }

      // Handle the nested API response structure
      const responseData = response.data;

      // Try to extract chats from various possible locations
      let chatsData = [];

      if (responseData?.data && Array.isArray(responseData.data)) {
        // Nested: { data: [...] }
        chatsData = responseData.data;
      } else if (Array.isArray(responseData)) {
        // Direct: [...]
        chatsData = responseData;
      } else {
        console.error("Invalid chats data format:", responseData);
        setError("Failed to parse chats data");
        return;
      }

      // Normalize each chat object to ensure it has both id and _id properties
      const normalizedChats = chatsData.map((chat) => ({
        ...chat,
        id: chat.id || chat._id, // Ensure id is available
        _id: chat._id || chat.id, // Ensure _id is available
      }));

      setChats(normalizedChats);
    } catch (err) {
      setError(err.message || "Failed to fetch chats");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch chat by ID
  const fetchChat = useCallback(async (chatId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getChatById(chatId);

      if (response.error) {
        setError(response.message);
        return;
      }

      // Handle the nested API response structure
      const responseData = response.data;

      // Try to extract chat data from various possible locations
      let chatData = null;

      if (responseData?.data) {
        // Nested: { data: {...} }
        chatData = responseData.data;
      } else {
        // Direct: {...}
        chatData = responseData;
      }

      if (!chatData) {
        console.error("Invalid chat data format:", responseData);
        setError("Failed to parse chat data");
        return;
      }

      // Normalize the chat object to ensure it has both id and _id properties
      const normalizedChat = {
        ...chatData,
        id: chatData.id || chatData._id, // Ensure id is available
        _id: chatData._id || chatData.id, // Ensure _id is available
      };

      setSelectedChat(normalizedChat);
    } catch (err) {
      setError(err.message || "Failed to fetch chat");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for a chat
  const fetchMessages = useCallback(async (chatId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMessages(chatId);

      if (response.error) {
        setError(response.message);
        return;
      }

      // Handle the nested API response structure
      const responseData = response.data;

      // Try to extract messages from various possible locations
      let messagesData = [];

      if (responseData?.data && Array.isArray(responseData.data)) {
        // Nested: { data: [...] }
        messagesData = responseData.data;
      } else if (Array.isArray(responseData)) {
        // Direct: [...]
        messagesData = responseData;
      } else {
        console.error("Invalid messages data format:", responseData);
        setError("Failed to parse messages data");
        return;
      }

      // Normalize each message object to ensure it has both id and _id properties
      const normalizedMessages = messagesData.map((message) => ({
        ...message,
        id: message.id || message._id, // Ensure id is available
        _id: message._id || message.id, // Ensure _id is available
      }));

      // Sort messages by createdAt timestamp if available
      if (normalizedMessages.length > 0 && normalizedMessages[0].createdAt) {
        normalizedMessages.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      }

      setMessages(normalizedMessages);
    } catch (err) {
      setError(err.message || "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (content, chatId) => {
    setError(null);

    try {
      const response = await sendMessageApi({ content, chatId });

      if (response.error) {
        setError(response.message);
        return { success: false, message: response.message };
      }

      // Handle the nested API response structure
      const responseData = response.data;

      // Try to extract message data from various possible locations
      let messageData = null;

      if (responseData?.data) {
        // Nested: { data: {...} }
        messageData = responseData.data;
      } else {
        // Direct: {...}
        messageData = responseData;
      }

      if (!messageData) {
        console.error("Invalid message data format:", responseData);
        setError("Failed to parse message data");
        return { success: false, message: "Failed to parse message data" };
      }

      // Normalize the message object to ensure it has both id and _id properties
      const normalizedMessage = {
        ...messageData,
        id: messageData.id || messageData._id, // Ensure id is available
        _id: messageData._id || messageData.id, // Ensure _id is available
      };

      // Add the new message to the messages array
      setMessages((prevMessages) => [...prevMessages, normalizedMessage]);

      return { success: true, message: normalizedMessage };
    } catch (err) {
      const message = err.message || "Failed to send message";
      setError(message);
      return { success: false, message };
    }
  }, []);

  // Create a new chat
  const createChat = useCallback(async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await createChatApi(userData);

      if (response.error) {
        setError(response.message);
        return { success: false, message: response.message };
      }

      // Handle the nested API response structure
      const responseData = response.data;

      // Try to extract chat data from various possible locations
      let chatData = null;

      if (responseData?.data) {
        // Nested: { data: {...} }
        chatData = responseData.data;
      } else {
        // Direct: {...}
        chatData = responseData;
      }

      if (!chatData) {
        console.error("Invalid chat data format:", responseData);
        setError("Failed to parse chat data");
        return { success: false, message: "Failed to parse chat data" };
      }

      // Normalize the chat object to ensure it has both id and _id properties
      const normalizedChat = {
        ...chatData,
        id: chatData.id || chatData._id, // Ensure id is available
        _id: chatData._id || chatData.id, // Ensure _id is available
      };

      // Add the new chat to the chats array
      setChats((prevChats) => [...prevChats, normalizedChat]);

      return { success: true, chat: normalizedChat };
    } catch (err) {
      const message = err.message || "Failed to create chat";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Select a chat
  const selectChat = useCallback(
    (chat) => {
      setSelectedChat(chat);
      if (chat) {
        fetchMessages(chat._id);
      } else {
        setMessages([]);
      }
    },
    [fetchMessages]
  );

  // Add a new message to the current chat
  const addMessage = useCallback((message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  return {
    chats,
    selectedChat,
    messages,
    loading,
    error,
    fetchChats,
    fetchChat,
    fetchMessages,
    sendMessage,
    createChat,
    selectChat,
    addMessage,
  };
};
