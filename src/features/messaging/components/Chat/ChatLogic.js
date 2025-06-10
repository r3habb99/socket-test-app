import { useState, useRef, useCallback, useEffect } from "react";
import { getMessagesForChat } from "../../api/messagingApi";

/**
 * Custom hook that contains all the logic for the Chat component
 * @param {Object} selectedChat - The currently selected chat
 * @param {Object} socketContext - The socket context from SocketProvider
 * @returns {Object} - All the state and functions needed for the Chat component
 */
export const useChatLogic = (selectedChat, socketContext) => {
  const [message, setMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isAtTop, setIsAtTop] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Get current user ID from localStorage
  const userId = localStorage.getItem("userId");

  // Get the chat partner for 1:1 chats
  const chatPartner =
    !selectedChat?.isGroupChat &&
    selectedChat?.users?.find(
      (user) => String(user._id || user.id) !== String(userId)
    );

  // Function to scroll to the bottom of the messages
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      // Option 1: Use scrollIntoView on the end ref
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      // Option 2: Set scrollTop directly (as a fallback)
      // This ensures scrolling works even if the scrollIntoView doesn't work properly
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, []);

  // Function to handle scrolling to the top (for loading older messages)
  const handleScrollToTop = useCallback(() => {
    if (messagesContainerRef.current && messagesContainerRef.current.scrollTop === 0) {
      // We're at the top of the container, could load older messages here
      console.log('Scrolled to top of messages, could load older messages');

      // Add a visual indicator that we're at the top
      messagesContainerRef.current.classList.add('at-top');
      setIsAtTop(true);

      // Future implementation: Load older messages when scrolled to top
    }
  }, []);

  // Track the last loaded chat ID to prevent duplicate API calls
  const lastLoadedChatIdRef = useRef(null);

  // Function to load messages for a chat - improved to handle all API response formats and ensure loading state is reset
  const loadMessagesForChat = useCallback((chatId) => {
    if (!chatId) {
      console.warn("Cannot load messages: no chat ID provided");
      setLoadingMessages(false); // Reset loading state immediately if no chat ID
      return Promise.resolve([]);
    }

    console.log(`Loading messages for chat: ${chatId}`);
    setLoadingMessages(true); // Set loading state

    // Create a timeout to ensure loading state is reset even if the API call hangs
    const loadingTimeout = setTimeout(() => {
      console.warn(`Message loading timeout for chat ${chatId} - resetting loading state`);
      setLoadingMessages(false);
    }, 10000); // 10 second timeout as a safety measure

    return getMessagesForChat(chatId)
      .then((response) => {
        console.log("Messages API response received:", response);
        clearTimeout(loadingTimeout); // Clear the safety timeout

        // Handle API errors
        if (response.error) {
          console.error(`Error loading messages: ${response.message || 'Unknown error'}`);
          return [];
        }

        // Extract messages from the response based on its structure
        let messages = [];

        // Handle different API response formats
        if (Array.isArray(response)) {
          // Direct array response
          messages = response;
        } else if (response.data) {
          if (Array.isArray(response.data)) {
            // { data: [...messages] }
            messages = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // { data: { data: [...messages] } }
            messages = response.data.data;
          } else if (typeof response.data === 'object') {
            // Single message object
            messages = [response.data];
          }
        } else if (response.messages && Array.isArray(response.messages)) {
          // { messages: [...messages] }
          messages = response.messages;
        } else if (response.statusCode === 200 && response.data) {
          // Standard API response
          if (Array.isArray(response.data)) {
            messages = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            messages = response.data.data;
          }
        } else if (response.content && Array.isArray(response.content)) {
          // Some APIs use 'content' field
          messages = response.content;
        }

        // Final validation
        if (!Array.isArray(messages)) {
          console.error("Failed to extract messages array from response:", response);
          return [];
        }

        // Filter out invalid messages
        const validMessages = messages.filter(msg => {
          if (!msg) return false;
          if (!msg.content) {
            console.warn("Skipping message without content:", msg);
            return false;
          }
          return true;
        });

        if (validMessages.length === 0 && messages.length > 0) {
          console.warn("No valid messages found in response");
        }

        // Normalize message objects to ensure consistent structure
        const normalizedMessages = validMessages.map(msg => ({
          ...msg,
          _id: msg._id || msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          id: msg.id || msg._id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          sender: msg.sender || { _id: msg.senderId, id: msg.senderId },
          chat: msg.chat || { _id: chatId, id: chatId },
          createdAt: msg.createdAt || msg.timestamp || new Date().toISOString()
        }));

        // Sort messages by timestamp
        normalizedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        console.log(`Successfully loaded ${normalizedMessages.length} messages for chat ${chatId}`);
        return normalizedMessages;
      })
      .catch((err) => {
        console.error(`Failed to load messages for chat ${chatId}:`, err);
        clearTimeout(loadingTimeout); // Clear the safety timeout
        return [];
      })
      .finally(() => {
        // Always reset loading state in finally block
        clearTimeout(loadingTimeout); // Ensure timeout is cleared
        console.log(`Resetting loading state for chat ${chatId} in finally block`);
        setLoadingMessages(false);
      });
  }, []);

  // Load messages when chat is selected - simplified to avoid race conditions and ensure messages load correctly
  useEffect(() => {
    // Extract chat ID to a variable for dependency array
    const chatId = selectedChat?._id || selectedChat?.id;

    // Skip if no chat is selected
    if (!chatId) {
      return;
    }

    // Check if this is a new chat or we're switching chats
    const isNewChat = chatId !== lastLoadedChatIdRef.current;

    if (isNewChat) {
      console.log(`Chat changed from ${lastLoadedChatIdRef.current || 'none'} to ${chatId}, loading messages...`);

      // Clear existing messages immediately to avoid showing messages from previous chat
      socketContext.setMessages([]);

      // Update the ref to track this chat ID
      lastLoadedChatIdRef.current = chatId;

      // Set loading state
      setLoadingMessages(true);

      // Join the chat room first to ensure we're connected
      socketContext.joinChat(chatId);

      // Create a flag to track if the component is still mounted
      let isMounted = true;

      // Load messages immediately - no need for delay as the socket join is asynchronous
      console.log(`Loading messages for chat ${chatId}`);

      loadMessagesForChat(chatId)
        .then((msgs) => {
          if (!isMounted) return;

          console.log(`Successfully loaded ${msgs.length} messages for chat ${chatId}`);

          // Set messages in the socket context to maintain state across components
          socketContext.setMessages(msgs);

          // Scroll to bottom after loading messages
          setTimeout(scrollToBottom, 100);
        })
        .catch(err => {
          if (!isMounted) return;

          console.error(`Error loading messages for chat ${chatId}:`, err);
          // Show error state if needed
        })
        .finally(() => {
          // Always ensure loading state is reset, even if there was an error
          if (isMounted) {
            console.log(`Finished loading messages for chat ${chatId}, resetting loading state`);
            setLoadingMessages(false);
          }
        });

      // Cleanup function to set the flag when component unmounts or chat changes
      return () => {
        isMounted = false;
        setLoadingMessages(false); // Reset loading state on unmount or chat change
      };
    } else if (socketContext.messages && socketContext.messages.length > 0) {
      // If we already have messages for this chat, make sure loading state is false
      setLoadingMessages(false);

      // Scroll to bottom when returning to a chat with existing messages
      setTimeout(scrollToBottom, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?._id, selectedChat?.id]); // Depend on the chat ID properties specifically

  return {
    message,
    setMessage,
    loadingMessages,
    setLoadingMessages,
    showProfileModal,
    setShowProfileModal,
    typingTimeout,
    setTypingTimeout,
    isAtTop,
    setIsAtTop,
    messagesEndRef,
    messagesContainerRef,
    userId,
    chatPartner,
    scrollToBottom,
    handleScrollToTop,
    lastLoadedChatIdRef,
    loadMessagesForChat,
    messages: socketContext.messages, // Added messages state from socketContext
  };
};
