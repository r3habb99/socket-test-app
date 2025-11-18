import { useRef, useCallback } from "react";
import { debugLog } from "../../utils/socketDebug";
import { sendMessage as sendMessageApi } from "../../api/messagingApi";

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
  handleTyping,
  selectedMedia,
  setSelectedMedia,
  setMediaPreview
}) => {
  // Track received messages to prevent duplicates - using a Map for better tracking with timestamps
  const receivedMessagesRef = useRef(new Map());
  // Track the chat ID for which we've registered event handlers
  const registeredChatIdRef = useRef(null);

  // Note: Message receiving is now handled centrally in useSocket.js
  // This component focuses only on sending messages and UI interactions
  // The real-time message updates are managed by the socket context

  // Track the last sent message to prevent duplicates
  const lastSentMessageRef = useRef({ content: '', timestamp: 0 });
  // Track messages that are currently being sent to prevent duplicates
  const pendingMessagesRef = useRef(new Set());

  const handleSendMessage = useCallback(async () => {
    // Ensure we have a valid chat ID (either _id or id)
    const chatId = selectedChat?._id || selectedChat?.id;

    // Check if we have either message content or media
    const hasContent = message.trim().length > 0;
    const hasMedia = selectedMedia && selectedMedia.length > 0;

    if ((!hasContent && !hasMedia) || !chatId) {
      debugLog("Cannot send message: missing content/media or chat ID");
      return;
    }

    try {
      // Get the trimmed message content
      const messageContent = message.trim();
      const currentTime = Date.now();

      // Create a unique signature for this message to track duplicates
      const messageSignature = `${messageContent}-${userId}-${chatId}-${hasMedia ? 'media' : 'text'}`;

      // Prevent duplicate sends by checking if this message is already being sent
      if (pendingMessagesRef.current.has(messageSignature)) {
        debugLog("Message already being sent, ignoring duplicate send attempt");
        return;
      }

      // Prevent duplicate sends by checking if this is the same message sent within the last 2 seconds
      if (
        !hasMedia &&
        messageContent === lastSentMessageRef.current.content &&
        currentTime - lastSentMessageRef.current.timestamp < 2000
      ) {
        debugLog("Same message sent recently, ignoring duplicate send attempt");
        return;
      }

      // Update the last sent message reference
      lastSentMessageRef.current = {
        content: messageContent,
        timestamp: currentTime
      };

      // Add this message to pending set
      pendingMessagesRef.current.add(messageSignature);

      // Clear the input field and media immediately to prevent multiple sends
      setMessage("");
      setSelectedMedia([]);
      setMediaPreview([]);

      // Stop typing indicator
      handleTyping(false);

      debugLog(`Sending message: ${messageContent.substring(0, 20)}... with ${selectedMedia?.length || 0} media files`);

      // If we have media, use the API (which supports FormData)
      // Otherwise, use socket for faster text-only messages
      if (hasMedia) {
        const response = await sendMessageApi({
          content: messageContent,
          chatId: chatId,
          media: selectedMedia
        });

        if (response.success) {
          debugLog("Message with media sent successfully via API");
        } else {
          throw new Error(response.message || "Failed to send message");
        }
      } else {
        // Send text-only message via socket context for real-time delivery
        socketContext.sendMessage({
          content: messageContent,
          chatId: chatId
        });
      }

      // Remove from pending set after 10 seconds (should be delivered by then)
      setTimeout(() => {
        pendingMessagesRef.current.delete(messageSignature);
      }, 10000);

      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      debugLog("Error sending message:", error);
      alert("Failed to send message. Please try again.");

      // Remove from pending set on error
      const messageSignature = `${message.trim()}-${userId}-${chatId}-${selectedMedia && selectedMedia.length > 0 ? 'media' : 'text'}`;
      pendingMessagesRef.current.delete(messageSignature);
    }
  }, [message, selectedChat, userId, socketContext, setMessage, handleTyping, scrollToBottom, selectedMedia, setSelectedMedia, setMediaPreview]);

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
