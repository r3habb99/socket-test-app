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
  WarningOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import "./Chat.css";

export const Chat = ({ selectedChat, onBackClick }) => {
  const socketContext = useSocketContext();

  const [message, setMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Track the last loaded chat ID to prevent duplicate API calls
  const lastLoadedChatIdRef = useRef(null);

  // Function to load messages for a chat
  const loadMessagesForChat = useCallback((chatId) => {
    if (!chatId) return Promise.resolve([]);

    console.log("Loading messages for chat:", chatId);
    setLoadingMessages(true);

    return getMessagesForChat(chatId)
      .then((response) => {
        console.log("Messages API response:", response);

        // Handle the nested API response structure
        let msgs = [];

        if (response.error) {
          console.error("Error loading messages:", response.message);
          return [];
        }

        // The API response structure from your example:
        // {"statusCode":200,"message":"Request processed successfully","data":[...messages...]}
        if (response.data && Array.isArray(response.data)) {
          // Direct array in data field
          msgs = response.data;
        } else if (response.statusCode === 200 && Array.isArray(response.data)) {
          // Response is the full API response object
          msgs = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          // Nested data structure
          msgs = response.data.data;
        } else {
          console.error("Invalid messages data format:", response);
          return [];
        }

        // Ensure we have an array of messages
        if (!Array.isArray(msgs)) {
          console.error("Messages data is not an array:", msgs);
          return [];
        }

        // Sort messages by createdAt timestamp if available
        if (msgs.length > 0 && msgs[0].createdAt) {
          msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }

        console.log("Processed messages:", msgs);
        return msgs;
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        return [];
      })
      .finally(() => {
        setLoadingMessages(false);
      });
  }, []);

  // Load messages when chat is selected
  useEffect(() => {
    // Extract chat ID to a variable for dependency array
    const chatId = selectedChat?._id || selectedChat?.id;

    // Only load messages if the chat ID has changed
    if (chatId && chatId !== lastLoadedChatIdRef.current) {
      // Update the ref to track this chat ID
      lastLoadedChatIdRef.current = chatId;

      // Create a flag to track if the component is still mounted
      let isMounted = true;

      loadMessagesForChat(chatId)
        .then((msgs) => {
          if (!isMounted) return;

          // Set messages in the socket context to maintain state across components
          socketContext.setMessages(msgs);

          // Scroll to bottom after loading messages
          setTimeout(scrollToBottom, 100);
        });

      // Cleanup function to set the flag when component unmounts
      return () => {
        isMounted = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]); // Only depend on the selectedChat object

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [socketContext.messages, scrollToBottom]);

  // Join chat room when selected chat changes - using a ref to prevent repeated joins
  const previousChatIdRef = useRef(null);

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
      scrollToBottom();
    }
  }, [socketContext.messages, scrollToBottom]);

  // Effect to handle socket connection changes - optimized to prevent duplicate API calls
  useEffect(() => {
    if (socketContext.connected) {
      // If we have a selected chat but no messages, try to load messages
      const chatId = selectedChat?._id || selectedChat?.id;

      // Only load messages if:
      // 1. We have a valid chat ID
      // 2. We don't have messages already
      // 3. We're not currently loading messages
      // 4. The chat ID is different from the last loaded chat ID (to prevent duplicate calls)
      if (
        chatId &&
        (!socketContext.messages || socketContext.messages.length === 0) &&
        !loadingMessages &&
        chatId !== lastLoadedChatIdRef.current
      ) {
        // Update the ref to track this chat ID
        lastLoadedChatIdRef.current = chatId;

        // Use the shared loadMessagesForChat function
        loadMessagesForChat(chatId)
          .then((msgs) => {
            // Set messages in the socket context to maintain state across components
            socketContext.setMessages(msgs);

            // Scroll to bottom after loading messages
            setTimeout(scrollToBottom, 100);
          });
      }
    } else {
      console.log("Socket disconnected");
    }
  }, [
    socketContext.connected,
    socketContext,
    selectedChat?._id,
    selectedChat?.id,
    loadingMessages,
    scrollToBottom,
    loadMessagesForChat
  ]);

  // Track received messages to prevent duplicates
  const receivedMessagesRef = useRef(new Set());

  // Handle incoming messages from socket
  useEffect(() => {
    const handleMessageReceived = (newMessage) => {
      // Check if the new message belongs to the currently selected chat
      const chatId = selectedChat?._id || selectedChat?.id;
      const messageChatId = newMessage.chat?._id || newMessage.chat?.id || newMessage.chatId;

      // Create a unique identifier for this message
      const messageId = newMessage._id || newMessage.id;
      const messageContent = newMessage.content;
      const senderId = newMessage.sender?._id || newMessage.sender?.id;

      // Create a unique signature for this message
      const messageSignature = `${messageId || ''}:${messageContent}:${senderId}:${messageChatId}`;

      // If we've already processed this message, ignore it
      if (messageId && receivedMessagesRef.current.has(messageSignature)) {
        return;
      }

      // Add this message to our tracking set
      if (messageId) {
        receivedMessagesRef.current.add(messageSignature);

        // Keep the set from growing too large
        if (receivedMessagesRef.current.size > 100) {
          // Convert to array, remove oldest entries, convert back to set
          const messagesArray = Array.from(receivedMessagesRef.current);
          receivedMessagesRef.current = new Set(messagesArray.slice(-50));
        }
      }

      if (String(messageChatId) === String(chatId)) {
        // Append the new message to the existing messages
        socketContext.setMessages((prevMessages) => {
          const prevMessagesArray = prevMessages || [];

          // Check if message already exists to avoid duplicates
          // Check by ID if available
          const existsById = prevMessagesArray.some(
            (msg) =>
              (msg._id && newMessage._id && msg._id === newMessage._id) ||
              (msg.id && newMessage.id && msg.id === newMessage.id)
          );

          if (existsById) {
            return prevMessagesArray;
          }

          // Also check for temporary messages with the same content
          const existsByContent = prevMessagesArray.some(
            (msg) =>
              msg.isTemp &&
              msg.content === newMessage.content &&
              String(msg.sender?._id || msg.sender?.id) === String(newMessage.sender?._id || newMessage.sender?.id)
          );

          if (existsByContent) {
            // Replace the temporary message with the real one
            return prevMessagesArray.map(msg =>
              (msg.isTemp &&
               msg.content === newMessage.content &&
               String(msg.sender?._id || msg.sender?.id) === String(newMessage.sender?._id || newMessage.sender?.id))
                ? { ...newMessage, replaced: true }
                : msg
            );
          }

          // If we get here, it's a new message, so add it
          return [...prevMessagesArray, newMessage];
        });

        // Scroll to the bottom when a new message is received
        setTimeout(scrollToBottom, 100);
      }
    };

    // Register the socket event listener
    if (socketContext.socket) {
      socketContext.socket.on("message received", handleMessageReceived);
    }

    // Cleanup the listener on component unmount
    return () => {
      if (socketContext.socket) {
        socketContext.socket.off("message received", handleMessageReceived);
      }
    };
  }, [selectedChat?._id, selectedChat?.id, socketContext, scrollToBottom]); // Only depend on the chat ID properties

  // Add a useEffect to listen for changes in the messages state
  useEffect(() => {
    // Scroll to the bottom whenever messages are updated
    if (socketContext.messages && socketContext.messages.length > 0) {
      scrollToBottom();
    }
  }, [socketContext.messages, scrollToBottom]);

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

      // Create a temporary message to display immediately
      // Use a more unique ID to prevent duplicate keys
      const randomId = Math.floor(Math.random() * 10000);
      const tempMessage = {
        _id: `temp-${currentTime}-${randomId}`,
        content: messageContent,
        sender: {
          _id: userId,
          id: userId,
        },
        createdAt: new Date(currentTime).toISOString(),
        isTemp: true,
        chat: {
          _id: chatId,
          id: chatId
        }
      };

      // Add the temporary message to the UI, but first check if a similar message already exists
      socketContext.setMessages(prev => {
        const prevMessages = prev || [];

        // Check if a similar message already exists (to prevent duplicates)
        const similarMessageExists = prevMessages.some(msg =>
          msg.content === messageContent &&
          String(msg.sender?._id || msg.sender?.id) === String(userId) &&
          // Only consider messages sent in the last 3 seconds to be potential duplicates
          msg.createdAt &&
          (currentTime - new Date(msg.createdAt).getTime()) < 3000
        );

        if (similarMessageExists) {
          console.log("Similar message already exists in UI, not adding temporary message");
          // Remove from pending set since we're not actually sending it
          pendingMessagesRef.current.delete(messageSignature);
          return prevMessages;
        }

        return [...prevMessages, tempMessage];
      });

      // Send message via socket context
      socketContext.sendMessage({
        content: messageContent,
        chatId: chatId,
      });

      // Remove from pending set after 5 seconds (should be delivered by then)
      setTimeout(() => {
        pendingMessagesRef.current.delete(messageSignature);
      }, 5000);

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
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            className="back-button"
            onClick={onBackClick}
          />

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

      <div className="messages-container">
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
        ) : (
          <ul className="messages-list">
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
