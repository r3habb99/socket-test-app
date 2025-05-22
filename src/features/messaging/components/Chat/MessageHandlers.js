import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook that contains all the message handling logic for the Chat component
 * @param {Object} params - Parameters for the hook
 * @returns {Object} - All the message handling functions
 */
export const useMessageHandlers = ({
  selectedChat,
  socketContext,
  message,
  setMessage,
  userId,
  scrollToBottom,
  handleTyping
}) => {
  // Track received messages to prevent duplicates - using a Map for better tracking with timestamps
  const receivedMessagesRef = useRef(new Map());
  // Track the chat ID for which we've registered event handlers
  const registeredChatIdRef = useRef(null);

  // Handle incoming messages from socket - improved to better handle duplicates
  useEffect(() => {
    // Get the current chat ID
    const chatId = selectedChat?._id || selectedChat?.id;

    // Skip if no chat is selected
    if (!chatId) return;

    // If we've already registered handlers for this chat, don't register again
    if (registeredChatIdRef.current === chatId) {
      console.log(`Event handlers already registered for chat ${chatId}, skipping`);
      return;
    }

    // Update the registered chat ID ref
    registeredChatIdRef.current = chatId;

    // Clear the received messages map when changing chats
    receivedMessagesRef.current.clear();

    console.log(`Setting up message event handlers for chat ${chatId}`);

    const handleMessageReceived = (newMessage) => {
      // Check if the new message belongs to the currently selected chat
      const messageChatId = newMessage.chat?._id || newMessage.chat?.id || newMessage.chatId;

      // Skip if the message is not for the current chat
      if (String(messageChatId) !== String(chatId)) {
        return;
      }

      // Create a unique identifier for this message
      const messageId = newMessage._id || newMessage.id;
      const messageContent = newMessage.content;
      const senderId = newMessage.sender?._id || newMessage.sender?.id;

      // Create a unique signature for this message
      const messageSignature = `${messageId || ''}:${messageContent}:${senderId}:${messageChatId}`;

      // If we've already processed this message recently (within last 10 seconds), ignore it
      const now = Date.now();
      const lastProcessed = receivedMessagesRef.current.get(messageSignature);

      if (lastProcessed && (now - lastProcessed) < 10000) {
        console.log(`Ignoring duplicate message: ${messageSignature}`);
        return;
      }

      // Add this message to our tracking map with current timestamp
      receivedMessagesRef.current.set(messageSignature, now);

      // Keep the map from growing too large
      if (receivedMessagesRef.current.size > 100) {
        // Remove entries older than 5 minutes
        const fiveMinutesAgo = now - 300000;

        // Use for...of with entries to safely delete while iterating
        for (const [key, timestamp] of receivedMessagesRef.current.entries()) {
          if (timestamp < fiveMinutesAgo) {
            receivedMessagesRef.current.delete(key);
          }
        }
      }

      // Update messages state with the new message
      socketContext.setMessages((prevMessages) => {
        const prevMessagesArray = Array.isArray(prevMessages) ? prevMessages : [];

        // Check if message already exists by ID
        const existsById = messageId && prevMessagesArray.some(
          (msg) => (msg._id === messageId) || (msg.id === messageId)
        );

        if (existsById) {
          console.log(`Message with ID ${messageId} already exists, not adding`);
          return prevMessagesArray;
        }

        // If we get here, it's a new message, so add it
        console.log(`Adding new message: ${messageContent.substring(0, 20)}...`);
        return [...prevMessagesArray, newMessage];
      });

      // Scroll to the bottom when a new message is received
      setTimeout(scrollToBottom, 100);
    };

    // Register the socket event listener using the subscribe method
    // This ensures proper cleanup and prevents memory leaks
    const unsubscribe = socketContext.subscribe("message received", handleMessageReceived);

    // Also register for the "new message" event in case the backend uses that name
    const unsubscribeNewMessage = socketContext.subscribe("new message", handleMessageReceived);

    console.log(`Registered message event handlers for chat ${chatId}`);

    // Cleanup the listeners on component unmount or when dependencies change
    return () => {
      console.log(`Cleaning up message event handlers for chat ${chatId}`);
      unsubscribe();
      unsubscribeNewMessage();
      // Don't reset registeredChatIdRef here as it will cause issues with re-registering
    };
  }, [selectedChat?._id, selectedChat?.id, socketContext, scrollToBottom]); // Only depend on the chat ID properties

  // Track the last sent message to prevent duplicates
  const lastSentMessageRef = useRef({ content: '', timestamp: 0 });
  // Track messages that are currently being sent to prevent duplicates
  const pendingMessagesRef = useRef(new Set());

  const handleSendMessage = useCallback(() => {
    // Ensure we have a valid chat ID (either _id or id)
    const chatId = selectedChat?._id || selectedChat?.id;

    if (!message.trim() || !chatId) {
      console.error("Cannot send message: missing content or chat ID");
      return;
    }

    try {
      // Get the trimmed message content
      const messageContent = message.trim();
      const currentTime = Date.now();

      // Create a unique signature for this message to track duplicates
      const messageSignature = `${messageContent}-${userId}-${chatId}`;

      // Prevent duplicate sends by checking if this message is already being sent
      if (pendingMessagesRef.current.has(messageSignature)) {
        console.log("Message already being sent, ignoring duplicate send attempt");
        return;
      }

      // Prevent duplicate sends by checking if this is the same message sent within the last 2 seconds
      if (
        messageContent === lastSentMessageRef.current.content &&
        currentTime - lastSentMessageRef.current.timestamp < 2000
      ) {
        console.log("Same message sent recently, ignoring duplicate send attempt");
        return;
      }

      // Update the last sent message reference
      lastSentMessageRef.current = {
        content: messageContent,
        timestamp: currentTime
      };

      // Add this message to pending set
      pendingMessagesRef.current.add(messageSignature);

      // Clear the input field immediately to prevent multiple sends
      setMessage("");

      // Stop typing indicator
      handleTyping(false);

      // Clear the input field immediately after sending
      console.log(`Sending message via socket: ${messageContent.substring(0, 20)}...`);

      // Create a message object to display immediately
      const newMessage = {
        _id: `local-${Date.now()}`,
        id: `local-${Date.now()}`,
        content: messageContent,
        sender: {
          _id: userId,
          id: userId
        },
        createdAt: new Date().toISOString(),
        chat: {
          _id: chatId,
          id: chatId
        },
        status: 'sent'
      };

      // Add the message to the UI immediately
      socketContext.setMessages(prev => {
        const prevMessages = Array.isArray(prev) ? prev : [];
        return [...prevMessages, newMessage];
      });

      // Send message via socket context
      socketContext.sendMessage({
        content: messageContent,
        chatId: chatId,
        localMessageId: newMessage._id // Include local message ID to help with matching on the response
      });

      // Remove from pending set after 10 seconds (should be delivered by then)
      setTimeout(() => {
        pendingMessagesRef.current.delete(messageSignature);
      }, 10000);

      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  }, [message, selectedChat, userId, socketContext, setMessage, handleTyping, scrollToBottom]);

  const handleKeyPress = useCallback((e) => {
    // If Enter is pressed without Shift key, send the message
    if (e.key === "Enter" && !e.shiftKey && message.trim()) {
      e.preventDefault(); // Prevent default Enter behavior (new line)
      handleSendMessage();
    } else if (e.key !== "Enter") {
      // Send typing indicator for any key except Enter
      handleTyping(true);
    }
  }, [message, handleSendMessage, handleTyping]);

  // Format date for messages
  const formatMessageDate = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group messages by date for date dividers
  const getMessageDate = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return {
    handleSendMessage,
    handleKeyPress,
    formatMessageDate,
    getMessageDate,
    receivedMessagesRef,
    registeredChatIdRef
  };
};
