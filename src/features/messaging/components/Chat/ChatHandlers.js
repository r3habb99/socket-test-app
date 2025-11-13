import { useEffect, useRef, useCallback } from "react";
import { debugLog } from "../../utils/socketDebug";

/**
 * Custom hook that contains all the event handlers and socket-related logic for the Chat component
 * @param {Object} params - Parameters for the hook
 * @returns {Object} - All the event handlers and socket-related functions
 */
export const useChatHandlers = ({
  selectedChat,
  socketContext,
  message,
  setMessage,
  typingTimeout,
  setTypingTimeout,
  scrollToBottom,
  messagesContainerRef,
  setIsAtTop,
  handleScrollToTop,
  lastLoadedChatIdRef,
  loadMessagesForChat,
  setLoadingMessages
}) => {
  // Join chat room when selected chat changes - using a ref to prevent repeated joins
  const previousChatIdRef = useRef(null);

  // Effect to ensure the messages container is properly sized when the component mounts
  useEffect(() => {
    // Force a resize event to ensure the messages container is properly sized
    window.dispatchEvent(new Event('resize'));

    // Scroll to bottom after a short delay to ensure the container is properly sized
    setTimeout(scrollToBottom, 200);
  }, [scrollToBottom]);

  // Single useEffect to manage chat room joining/leaving - CONSOLIDATED
  useEffect(() => {
    // Extract chat ID to a variable for dependency array
    const chatId = selectedChat?._id || selectedChat?.id;

    // Only join if we have a valid chat ID and it has actually changed
    if (chatId && chatId !== previousChatIdRef.current) {
      debugLog(`Chat ID changed from ${previousChatIdRef.current} to ${chatId}`);
      debugLog(`🔧 FIXED: Using SINGLE useEffect for room management`);

      // Store the current chat ID in the ref
      previousChatIdRef.current = chatId;

      // Join the chat room via socket
      debugLog(`🚀 Joining chat room via socketContext.joinChat(${chatId})`);
      socketContext.joinChat(chatId);

      // Wait for a short time and then check if we're connected to the room
      setTimeout(() => {
        if (socketContext.connected) {
          debugLog(`Verifying connection to chat room ${chatId}`);
          // Emit a ready event to let the server know we're ready to receive messages
          socketContext.socket?.emit("ready", { chatId });
        }
      }, 500);
    }

    // SINGLE cleanup function that handles both chat change AND component unmount
    return () => {
      const currentChatId = previousChatIdRef.current;
      if (currentChatId) {
        debugLog(`🔧 FIXED: SINGLE cleanup function running for chat ${currentChatId}`);
        debugLog(`Leaving chat room ${currentChatId} due to chat change or component unmount`);

        // Clear typing timeout if exists
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          debugLog(`Sending stopped typing event for chat ${currentChatId} on cleanup`);
          socketContext.sendTyping(false, currentChatId);
        }

        // Leave the chat room
        debugLog(`🚪 Calling socketContext.leaveChat(${currentChatId}) - SINGLE CALL ONLY`);
        socketContext.leaveChat(currentChatId);

        // Notify the server that we're leaving the chat
        if (socketContext.socket && socketContext.connected) {
          debugLog(`Notifying server that we're leaving chat ${currentChatId}`);
          socketContext.socket.emit("leave chat", { chatId: currentChatId });
        }

        // Reset the previous chat ID ref only on unmount (not on chat change)
        if (!selectedChat?._id && !selectedChat?.id) {
          previousChatIdRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?._id, selectedChat?.id]); // Only depend on the chat ID properties

  // Handle typing indicator with debounce and improved timeout management
  const handleTyping = useCallback((isTyping) => {
    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    // Only send typing indicator if we're connected and have a selected chat
    if (!socketContext.connected || !selectedChat) {
      return;
    }

    // Get the chat ID from the selected chat
    const chatId = selectedChat?._id || selectedChat?.id;

    if (!chatId) {
      return;
    }

    // Send typing indicator with explicit chat ID
    socketContext.sendTyping(isTyping, chatId);

    // If user is typing, set a timeout to automatically stop typing indicator
    if (isTyping) {
      const timeout = setTimeout(() => {
        socketContext.sendTyping(false, chatId);
        setTypingTimeout(null);
      }, 3000); // 3 seconds
      setTypingTimeout(timeout);
    }
  }, [selectedChat, socketContext, typingTimeout, setTypingTimeout]);

  // REMOVED: Duplicate cleanup useEffect - now handled in the consolidated useEffect above

  // Effect to scroll to bottom when new messages are received
  useEffect(() => {
    // Scroll to bottom when messages change
    if (socketContext.messages && socketContext.messages.length > 0) {
      // Ensure the messages container is properly sized before scrolling
      if (messagesContainerRef.current) {
        // Force a reflow to ensure the container has the correct dimensions
        messagesContainerRef.current.style.display = 'none';
        // eslint-disable-next-line no-unused-expressions
        messagesContainerRef.current.offsetHeight; // Force reflow
        messagesContainerRef.current.style.display = 'flex';

        // Scroll to bottom after a short delay to ensure the container is properly sized
        setTimeout(scrollToBottom, 50);
      } else {
        scrollToBottom();
      }
    }
  }, [socketContext.messages, scrollToBottom, messagesContainerRef]);

  // Add scroll event listener to messages container and ensure proper sizing
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    // Function to ensure the messages container has the correct height
    const updateContainerHeight = () => {
      const chatContainer = messagesContainer.closest('.chat-container');
      if (!chatContainer) return;

      const headerHeight = chatContainer.querySelector('.chat-header-container')?.offsetHeight || 60;
      const inputHeight = chatContainer.querySelector('.input-container')?.offsetHeight || 60;

      // Calculate available height
      const availableHeight = chatContainer.offsetHeight - headerHeight - inputHeight;

      // Set the height of the messages container
      messagesContainer.style.height = `${availableHeight}px`;
      messagesContainer.style.maxHeight = `${availableHeight}px`;
      messagesContainer.style.overflowY = 'auto';
    };

    // Add scroll event listener
    const handleScroll = () => {
      // Check if we're at the top of the container
      if (messagesContainer.scrollTop === 0) {
        // Add 'at-top' class to show the loading indicator
        messagesContainer.classList.add('at-top');
        setIsAtTop(true);
        handleScrollToTop();
      } else {
        // Remove 'at-top' class when not at the top
        messagesContainer.classList.remove('at-top');
        setIsAtTop(false);
      }
    };

    // Update container height initially and on window resize
    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);
    messagesContainer.addEventListener('scroll', handleScroll);

    // Clean up event listeners
    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateContainerHeight);
    };
  }, [handleScrollToTop, messagesContainerRef, setIsAtTop]);

  // Effect to handle socket connection changes - simplified to avoid duplicate loading
  useEffect(() => {
    // Only run this effect when socket connection status changes to connected
    if (!socketContext.connected) {
      // If socket is not connected, just log and return
      if (socketContext.connectionStatus === 'disconnected') {
        debugLog("Socket disconnected, chat functionality may be limited");
      }
      return;
    }

    // Silently handle connection - no toast notifications
    debugLog("Socket connected, checking if messages need to be loaded");

    // If we have a selected chat but no messages, try to load messages
    const chatId = selectedChat?._id || selectedChat?.id;

    // Only attempt to load messages if:
    // 1. We have a valid chat ID
    // 2. We don't have messages already OR we have an empty array
    // 3. We're not currently loading messages
    // 4. This is the current chat we're viewing (using lastLoadedChatIdRef)
    const hasNoMessages = !socketContext.messages ||
                          (Array.isArray(socketContext.messages) && socketContext.messages.length === 0);

    if (
      chatId &&
      hasNoMessages &&
      !socketContext.loadingMessages &&
      lastLoadedChatIdRef.current === chatId // Only load for the current chat
    ) {
      debugLog(`Socket connected but no messages for chat ${chatId}, loading now...`);

      // Create a flag to track if the component is still mounted
      let isMounted = true;

      // Set loading state
      setLoadingMessages(true);

      // Load messages immediately - the socket is already connected
      debugLog(`Loading messages for chat ${chatId} after socket connection`);

      loadMessagesForChat(chatId)
        .then((msgs) => {
          if (!isMounted) return;

          debugLog(`Loaded ${msgs.length} messages after socket connection`);

          // Set messages in the socket context
          socketContext.setMessages(msgs);

          // Scroll to bottom
          setTimeout(scrollToBottom, 100);
        })
        .catch(err => {
          if (!isMounted) return;
          debugLog(`Error loading messages after socket connection: ${err.message}`);
        })
        .finally(() => {
          // Always ensure loading state is reset
          if (isMounted) {
            debugLog(`Finished loading messages after socket connection, resetting loading state`);
            setLoadingMessages(false);
          }
        });

      // Return cleanup function
      return () => {
        isMounted = false;
        setLoadingMessages(false); // Reset loading state on cleanup
      };
    }

    // No cleanup function needed if we didn't start loading
    return undefined;
  }, [
    // Include all required dependencies
    socketContext,
    socketContext.connected,
    socketContext.connectionStatus,
    socketContext.messages,
    socketContext.loadingMessages,
    selectedChat?._id,
    selectedChat?.id,
    loadMessagesForChat,
    scrollToBottom,
    lastLoadedChatIdRef,
    setLoadingMessages
  ]);

  return {
    handleTyping,
    previousChatIdRef
  };
};
