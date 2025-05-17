import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { getMessagesForChat } from "../../api/messagingApi";
import { UserProfileModal } from "../UserProfileModal";
import MessageStatus from "../MessageStatus";
import UserStatus from "../UserStatus";
import { getImageUrl } from "../../../../shared/utils";
import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import {
  Layout,
  Button,
  Avatar,
  Input,
  Spin,
  Empty,
  Typography
} from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  SendOutlined,
  PictureOutlined,
  MailOutlined,
  DisconnectOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  // WarningOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import "./Chat.css";

export const Chat = ({ selectedChat, onBackClick }) => {
  const socketContext = useSocketContext();

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

  // Join chat room when selected chat changes - using a ref to prevent repeated joins
  const previousChatIdRef = useRef(null);

  // Effect to ensure the messages container is properly sized when the component mounts
  useEffect(() => {
    // Force a resize event to ensure the messages container is properly sized
    window.dispatchEvent(new Event('resize'));

    // Scroll to bottom after a short delay to ensure the container is properly sized
    setTimeout(scrollToBottom, 200);
  }, [scrollToBottom]);

  useEffect(() => {
    // Extract chat ID to a variable for dependency array
    const chatId = selectedChat?._id || selectedChat?.id;

    // Only join if the chat ID has actually changed
    if (chatId && chatId !== previousChatIdRef.current) {
      // Store the current chat ID in the ref
      previousChatIdRef.current = chatId;

      // Join the chat room via socket
      socketContext.joinChat(chatId);

      // Clean up function will only run on unmount or when chat ID changes
      return () => {
        socketContext.leaveChat(chatId);
        // Don't reset previousChatIdRef here, it will be updated in the next effect run
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?._id, selectedChat?.id]); // Only depend on the chat ID properties

  // Handle typing indicator with debounce and improved timeout management
  const handleTyping = (isTyping) => {
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
  };

  // Clean up typing timeout on unmount and leave chat room
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);

        // Get the chat ID from the selected chat
        const chatId = selectedChat?._id || selectedChat?.id;

        if (chatId) {
          // Also send a stopped typing event when unmounting
          socketContext.sendTyping(false, chatId);
        }
      }

      // Leave chat room on component unmount
      const chatId = selectedChat?._id || selectedChat?.id;
      if (chatId) {
        socketContext.leaveChat(chatId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?._id, selectedChat?.id]); // Only depend on the chat ID properties

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
  }, [socketContext.messages, scrollToBottom]);

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
  }, [handleScrollToTop]);

  // Effect to handle socket connection changes - simplified to avoid duplicate loading
  useEffect(() => {
    // Only run this effect when socket connection status changes to connected
    if (!socketContext.connected) {
      // If socket is not connected, just log and return
      if (socketContext.connectionStatus === 'disconnected') {
        console.log("Socket disconnected, chat functionality may be limited");
      }
      return;
    }

    console.log("Socket connected, checking if messages need to be loaded");

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
      !loadingMessages &&
      lastLoadedChatIdRef.current === chatId // Only load for the current chat
    ) {
      console.log(`Socket connected but no messages for chat ${chatId}, loading now...`);

      // Create a flag to track if the component is still mounted
      let isMounted = true;

      // Set loading state
      setLoadingMessages(true);

      // Load messages immediately - the socket is already connected
      console.log(`Loading messages for chat ${chatId} after socket connection`);

      loadMessagesForChat(chatId)
        .then((msgs) => {
          if (!isMounted) return;

          console.log(`Loaded ${msgs.length} messages after socket connection`);

          // Set messages in the socket context
          socketContext.setMessages(msgs);

          // Scroll to bottom
          setTimeout(scrollToBottom, 100);
        })
        .catch(err => {
          if (!isMounted) return;
          console.error(`Error loading messages after socket connection: ${err.message}`);
        })
        .finally(() => {
          // Always ensure loading state is reset
          if (isMounted) {
            console.log(`Finished loading messages after socket connection, resetting loading state`);
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
    selectedChat?._id,
    selectedChat?.id,
    loadingMessages,
    loadMessagesForChat,
    scrollToBottom,
    lastLoadedChatIdRef
  ]);

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

        // Check for temporary messages with the same content from the same sender
        const tempMessageIndex = prevMessagesArray.findIndex(
          (msg) =>
            msg.isTemp &&
            msg.content === messageContent &&
            String(msg.sender?._id || msg.sender?.id) === String(senderId)
        );

        if (tempMessageIndex !== -1) {
          console.log(`Replacing temporary message with real message from server`);
          // Create a new array with the temporary message replaced
          const updatedMessages = [...prevMessagesArray];
          updatedMessages[tempMessageIndex] = {
            ...newMessage,
            replaced: true
          };
          return updatedMessages;
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

  // We've consolidated all scrolling logic into a single useEffect in the message received handler

  // Track the last sent message to prevent duplicates
  const lastSentMessageRef = useRef({ content: '', timestamp: 0 });
  // Track messages that are currently being sent to prevent duplicates
  const pendingMessagesRef = useRef(new Set());

  const handleSendMessage = () => {
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

      // Create a temporary message to display immediately with a unique ID
      const tempId = `temp-${currentTime}-${Math.random().toString(36).substring(2, 9)}`;
      const tempMessage = {
        _id: tempId,
        id: tempId, // Include both id and _id for consistency
        content: messageContent,
        sender: {
          _id: userId,
          id: userId,
        },
        createdAt: new Date(currentTime).toISOString(),
        isTemp: true,
        status: 'sending',
        chat: {
          _id: chatId,
          id: chatId
        }
      };

      // Add the temporary message to the UI, with improved duplicate detection
      socketContext.setMessages(prev => {
        const prevMessages = Array.isArray(prev) ? prev : [];

        // Check if a similar message already exists (to prevent duplicates)
        // Look for messages with the same content from the same sender in the last 5 seconds
        const similarMessageExists = prevMessages.some(msg =>
          msg.content === messageContent &&
          String(msg.sender?._id || msg.sender?.id) === String(userId) &&
          msg.createdAt &&
          (currentTime - new Date(msg.createdAt).getTime()) < 5000
        );

        if (similarMessageExists) {
          console.log("Similar message already exists in UI, not adding temporary message");
          // Remove from pending set since we're not actually sending it
          pendingMessagesRef.current.delete(messageSignature);
          return prevMessages;
        }

        // Add the temporary message to the messages array
        console.log(`Adding temporary message with ID ${tempId}`);
        return [...prevMessages, tempMessage];
      });

      // Send message via socket context
      console.log(`Sending message via socket: ${messageContent.substring(0, 20)}...`);
      socketContext.sendMessage({
        content: messageContent,
        chatId: chatId,
        tempId: tempId // Include the temp ID to help with matching on the response
      });

      // Remove from pending set after 10 seconds (should be delivered by then)
      setTimeout(() => {
        pendingMessagesRef.current.delete(messageSignature);

        // Also check if the temporary message is still in the list and update its status if needed
        socketContext.setMessages(prev => {
          const prevMessages = Array.isArray(prev) ? prev : [];

          // Find the temporary message
          const tempMessageIndex = prevMessages.findIndex(msg =>
            msg._id === tempId && msg.isTemp
          );

          // If the temporary message still exists and hasn't been replaced, update its status
          if (tempMessageIndex !== -1) {
            console.log(`Temporary message ${tempId} still exists after 10s, updating status`);
            const updatedMessages = [...prevMessages];
            updatedMessages[tempMessageIndex] = {
              ...updatedMessages[tempMessageIndex],
              status: 'sent' // Assume it was sent even if we didn't get confirmation
            };
            return updatedMessages;
          }

          return prevMessages;
        });
      }, 10000);

      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    // If Enter is pressed without Shift key, send the message
    if (e.key === "Enter" && !e.shiftKey && message.trim()) {
      e.preventDefault(); // Prevent default Enter behavior (new line)
      handleSendMessage();
    } else if (e.key !== "Enter") {
      // Send typing indicator for any key except Enter
      handleTyping(true);
    }
  };

  if (!selectedChat) {
    return (
      <div className="chat-container">
        Please select a chat to start messaging.
      </div>
    );
  }

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

  return (
    <div className="chat-container">
      <Layout.Header className="chat-header-container">
        <div className="chat-header-left">
          <div className="back-button-container">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              className="back-button"
              onClick={onBackClick}
              aria-label="Back to chat list"
            />
          </div>

          {chatPartner && chatPartner.profilePic ? (
            <Avatar
              src={chatPartner.profilePic.startsWith("http") ? chatPartner.profilePic : getImageUrl(chatPartner.profilePic, DEFAULT_PROFILE_PIC)}
              alt={chatPartner.username || "User"}
              className="chat-header-avatar"
              size={40}
              onError={() => true}
            />
          ) : (
            <Avatar
              className="chat-header-avatar"
              size={40}
              style={{ backgroundColor: '#1d9bf0' }}
            >
              {selectedChat.isGroupChat
                ? (selectedChat.chatName || "G").charAt(0).toUpperCase()
                : chatPartner
                  ? chatPartner.username.charAt(0).toUpperCase()
                  : "?"}
            </Avatar>
          )}

          <div className="chat-header-details">
            <Typography.Text strong className="chat-header-name">
              {selectedChat.isGroupChat
                ? selectedChat.chatName || "Group Chat"
                : chatPartner
                  ? chatPartner.firstName && chatPartner.lastName
                    ? `${chatPartner.firstName} ${chatPartner.lastName}`
                    : chatPartner.username
                  : "Chat"}
            </Typography.Text>
            <div className="chat-header-status">
              {selectedChat.isGroupChat ? (
                `${selectedChat.users?.length || 0} people`
              ) : (
                <div className="user-status-wrapper">
                  <UserStatus
                    userId={chatPartner?._id || chatPartner?.id}
                    showText={true}
                    showLastSeen={true}
                  />
                </div>
              )}
              {Object.keys(socketContext.typingUsers).length > 0 && (
                <span className="typing-indicator">
                  {" • "}
                  {Object.values(socketContext.typingUsers)
                    .map((user) => user.username)
                    .join(", ")}
                  {Object.keys(socketContext.typingUsers).length === 1
                    ? " is typing..."
                    : " are typing..."}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <Button
            type="text"
            icon={<SearchOutlined />}
            className="header-icon"
            title="Search"
          />
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            className="header-icon"
            title="Info"
            onClick={() => {
              // Show the profile modal with the chat partner's info
              if (selectedChat.isGroupChat) {
                // For group chats, show group info
                // You could implement group info modal here

              } else {
                // For 1:1 chats, show the chat partner's profile
                setShowProfileModal(true);
              }
            }}
          />
        </div>
      </Layout.Header>

      <div className="messages-container" ref={messagesContainerRef}>
        {loadingMessages ? (
          <div className="loading-messages">
            <Spin size="large" tip="Loading messages..." />
          </div>
        ) : !socketContext.messages || socketContext.messages.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-content">
              <Empty
                image={<MailOutlined className="no-messages-icon" />}
                description={
                  <div>
                    <Typography.Text strong style={{ fontSize: '16px', display: 'block' }}>
                      No messages yet
                    </Typography.Text>
                    <Typography.Text type="secondary" className="no-messages-hint">
                      Send a message to start the conversation
                    </Typography.Text>
                  </div>
                }
              />
            </div>
          </div>
        ) : Array.isArray(socketContext.messages) ? (
          <ul className="messages-list">
            {/* Load more messages button - only shown when at the top */}
            {isAtTop && socketContext.messages && socketContext.messages.length > 0 && (
              <div className="load-more-container">
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    console.log("Load more messages functionality would be implemented here");
                    // Future implementation: Load older messages
                  }}
                >
                  Load older messages
                </Button>
              </div>
            )}

            {/* Connection status message */}
            <div className="special-message">
              {socketContext.connectionStatus === 'disconnected' && (
                <div className="connection-status error">
                  <DisconnectOutlined className="status-icon" />
                  <span>Disconnected from chat</span>
                  <Button
                    size="small"
                    type="primary"
                    danger
                    icon={<ReloadOutlined />}
                    onClick={() => socketContext.reconnect()}
                  >
                    Reconnect
                  </Button>
                </div>
              )}

              {socketContext.connectionStatus === 'connecting' && (
                <div className="connection-status warning">
                  <LoadingOutlined spin className="status-icon" />
                  <span>Connecting to chat server...</span>
                </div>
              )}

              {socketContext.connectionStatus === 'reconnecting' && (
                <div className="connection-status warning">
                  <LoadingOutlined spin className="status-icon" />
                  <span>Reconnecting to chat server (Attempt {socketContext.reconnectAttempts}/10)</span>
                  <Button
                    size="small"
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={() => socketContext.reconnect()}
                  >
                    Try Now
                  </Button>
                </div>
              )}

              {socketContext.connectionStatus === 'connected' && (
                <div className="connection-status success">
                  <CheckCircleOutlined className="status-icon" />
                  <span>Connected to chat</span>
                </div>
              )}
            </div>

            {/* Group messages by date */}
            {(socketContext.messages || []).map((msg, index) => {
              // Skip rendering if message doesn't have content
              if (!msg || !msg.content) {
                console.warn(`Skipping message ${index} - no content:`, msg);
                return null;
              }

              // Only log message rendering in development mode
              if (process.env.NODE_ENV === 'development' && index === 0) {
                console.log(`Rendering ${socketContext.messages.length} messages`);
              }

              // Show date divider for first message or when date changes
              const showDateDivider =
                index === 0 ||
                getMessageDate(msg.createdAt) !==
                  getMessageDate(socketContext.messages[index - 1]?.createdAt);

              // Handle different sender ID formats
              const senderId = msg.sender?._id || msg.sender?.id || msg.sender;

              // Check if the current user is the sender
              const isSender =
                String(senderId) === String(userId) ||
                msg.isTemp ||
                msg._id?.startsWith("temp-");

              // Force sender class for messages sent by the current user
              const messageClass = isSender ? "sender" : "receiver";

              // Generate a stable key for the message
              // For real messages, use their ID
              // For temporary messages, use their unique temp ID
              // For messages without any ID, create a stable index-based key that won't change on re-renders
              const messageKey =
                msg._id ||
                msg.id ||
                (msg.isTemp ? msg._id : `msg-${index}-${msg.content?.substring(0, 10)}-${msg.sender?._id || msg.sender?.id || 'unknown'}`);

              return (
                <React.Fragment key={messageKey}>
                  {showDateDivider && msg.createdAt && (
                    <div className="date-divider">
                      <span>
                        {new Date(msg.createdAt).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  <li className={`${messageClass} ${msg.isTemp ? 'temp-message' : ''} ${msg.replaced ? 'replaced-message' : ''}`}>
                    <div className="message-bubble">
                      <div className="message-content">{msg.content}</div>
                      <div className="message-info">
                        <div className="message-timestamp">
                          {formatMessageDate(msg.createdAt)}
                          {msg.isTemp && <span className="temp-indicator"> (sending...)</span>}
                        </div>
                        {isSender && <MessageStatus status={msg.status || (msg.isTemp ? 'sending' : 'sent')} />}
                      </div>
                    </div>
                  </li>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} className="messages-end-ref" />
          </ul>
        ) : (
          // Fallback for unexpected message format
          <div className="loading-messages">
            <Spin size="large" tip="Error loading messages. Please try again." />
            <Button
              onClick={() => {
                setLoadingMessages(true);
                setTimeout(() => {
                  loadMessagesForChat(selectedChat?._id || selectedChat?.id)
                    .then(msgs => {
                      socketContext.setMessages(msgs);
                      setTimeout(scrollToBottom, 100);
                    })
                    .finally(() => setLoadingMessages(false));
                }, 500);
              }}
              style={{ marginTop: '20px' }}
            >
              Retry
            </Button>
          </div>
        )}
      </div>

      <div className="input-container">
        <div className="message-actions">
          <Button
            type="text"
            className="message-action-button"
            title="Add photo"
            icon={<PictureOutlined />}
          />
          <Button
            type="text"
            className="message-action-button"
            title="Add GIF"
          >
            GIF
          </Button>
        </div>
        <Input
          placeholder="Start a new message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          variant="borderless"
          className="message-input"
        />
        <Button
          type="primary"
          shape="circle"
          icon={<SendOutlined />}
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!message.trim() || !socketContext.connected}
        />
      </div>

      {/* User Profile Modal */}
      {showProfileModal && chatPartner && (
        <UserProfileModal
          user={chatPartner}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};
