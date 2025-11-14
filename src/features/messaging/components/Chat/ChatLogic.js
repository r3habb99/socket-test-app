import { useState, useRef, useCallback, useEffect } from "react";
import { getMessagesForChat, getMessages } from "../../api/messagingApi";
import { sanitizeMessagesArray } from "../../utils/objectIdUtils";

/**
 * Custom hook that contains all the logic for the Chat component
 * @param {Object} selectedChat - The currently selected chat
 * @param {Object} socketContext - The socket context from SocketProvider
 * @returns {Object} - All the state and functions needed for the Chat component
 */
export const useChatLogic = (selectedChat, socketContext) => {
  const [message, setMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isAtTop, setIsAtTop] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
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

    setLoadingMessages(true); // Set loading state

    // Create a timeout to ensure loading state is reset even if the API call hangs
    const loadingTimeout = setTimeout(() => {
      console.warn(`Message loading timeout for chat ${chatId} - resetting loading state`);
      setLoadingMessages(false);
    }, 10000); // 10 second timeout as a safety measure

    return getMessagesForChat(chatId)
      .then((response) => {
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

        // Sanitize messages to convert ObjectIds to strings before storing in React state
        const sanitizedMessages = sanitizeMessagesArray(normalizedMessages);

        return sanitizedMessages;
      })
      .catch((err) => {
        console.error(`Failed to load messages for chat ${chatId}:`, err);
        clearTimeout(loadingTimeout); // Clear the safety timeout
        return [];
      })
      .finally(() => {
        // Always reset loading state in finally block
        clearTimeout(loadingTimeout); // Ensure timeout is cleared
        setLoadingMessages(false);
      });
  }, []);

  // Function to load older messages with pagination
  const loadOlderMessages = useCallback(async () => {
    const chatId = selectedChat?._id || selectedChat?.id;

    if (!chatId || loadingOlderMessages || !hasMoreMessages) {
      return;
    }

    setLoadingOlderMessages(true);

    try {
      const currentMessages = socketContext.messages || [];
      const skip = currentMessages.length;
      const limit = 20;

      const response = await getMessages(chatId, limit, skip);

      // Extract messages from the response
      let olderMessages = [];
      if (Array.isArray(response)) {
        olderMessages = response;
      } else if (response.data) {
        if (Array.isArray(response.data)) {
          olderMessages = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          olderMessages = response.data.data;
        }
      }

      // Filter and normalize messages
      const validMessages = olderMessages.filter(msg => msg && msg.content);
      const normalizedMessages = validMessages.map(msg => ({
        ...msg,
        _id: msg._id || msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        id: msg.id || msg._id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: msg.sender || { _id: msg.senderId, id: msg.senderId },
        chat: msg.chat || { _id: chatId, id: chatId },
        createdAt: msg.createdAt || msg.timestamp || new Date().toISOString()
      }));

      // Sanitize messages
      const sanitizedMessages = sanitizeMessagesArray(normalizedMessages);

      if (sanitizedMessages.length === 0) {
        // No more messages to load
        setHasMoreMessages(false);
     } else {
        // Save current scroll position
        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;

        // Prepend older messages to existing messages
        const updatedMessages = [...sanitizedMessages, ...currentMessages];

        // Sort by timestamp to ensure correct order
        updatedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        socketContext.setMessages(updatedMessages);

        // Restore scroll position to prevent jumping
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - previousScrollHeight;
            container.scrollTop = scrollDiff;
          }
        }, 0);

      }
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [selectedChat, socketContext, loadingOlderMessages, hasMoreMessages, messagesContainerRef]);

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

      // Clear existing messages immediately to avoid showing messages from previous chat
      socketContext.setMessages([]);

      // Reset pagination state
      setHasMoreMessages(true);

      // Update the ref to track this chat ID
      lastLoadedChatIdRef.current = chatId;

      // Set loading state
      setLoadingMessages(true);

      // Join the chat room first to ensure we're connected
      socketContext.joinChat(chatId);

      // Create a flag to track if the component is still mounted
      let isMounted = true;

      // Load messages immediately - no need for delay as the socket join is asynchronous

      loadMessagesForChat(chatId)
        .then((msgs) => {
          if (!isMounted) return;



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
    loadingOlderMessages,
    hasMoreMessages,
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
    loadOlderMessages,
    messages: socketContext.messages || [], // Added messages state from socketContext with fallback
  };
};
