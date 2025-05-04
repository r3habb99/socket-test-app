import React, { useEffect, useState, useRef } from "react";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { getMessagesForChat } from "../../api/messagingApi";
import { UserProfileModal } from "../UserProfileModal";
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
  // We don't need username here as it's handled in the socket context

  // Get the chat partner for 1:1 chats
  const chatPartner =
    !selectedChat?.isGroupChat &&
    selectedChat?.users?.find(
      (user) => String(user._id || user.id) !== String(userId)
    );

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages when chat is selected
  useEffect(() => {
    // Extract chat ID to a variable for dependency array
    const chatId = selectedChat?._id || selectedChat?.id;

    if (chatId) {
      console.log("Chat component: Loading messages for chat:", chatId);
      setLoadingMessages(true);

      // Create a flag to track if the component is still mounted
      let isMounted = true;

      getMessagesForChat(chatId)
        .then((response) => {
          // Only proceed if the component is still mounted
          if (!isMounted) return;

          console.log("Messages response:", response);

          // Handle the nested API response structure
          let msgs = [];

          if (response.error) {
            console.error("Error loading messages:", response.message);
          } else {
            // The API response has a nested structure with the actual data in the 'data' property
            const responseData = response.data;

            // Try to extract messages from various possible locations
            if (responseData?.data && Array.isArray(responseData.data)) {
              // Nested: { data: [...] }
              msgs = responseData.data;
              console.log("Using nested messages data from response.data.data");
            } else if (Array.isArray(responseData)) {
              // Direct: [...]
              msgs = responseData;
              console.log("Using direct messages array from response.data");
            } else {
              console.error("Invalid messages data format:", responseData);
            }
          }

          // Ensure we have an array of messages
          if (!Array.isArray(msgs)) {
            console.error("Messages data is not an array:", msgs);
            msgs = [];
          }

          // Sort messages by createdAt timestamp if available
          if (msgs.length > 0 && msgs[0].createdAt) {
            msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          }

          // Set messages in the socket context to maintain state across components
          socketContext.setMessages(msgs);
        })
        .catch((err) => {
          if (isMounted) {
            console.error("Failed to load messages:", err);
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoadingMessages(false);
          }
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
  }, [socketContext.messages]);

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
      console.log("Joining chat room:", chatId);
      socketContext.joinChat(chatId);

      // Clean up function will only run on unmount or when chat ID changes
      return () => {
        console.log("Leaving chat room:", chatId);
        socketContext.leaveChat(chatId);
        // Don't reset previousChatIdRef here, it will be updated in the next effect run
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]); // Only depend on the selectedChat object

  // Handle typing indicator with debounce and improved timeout management
  const handleTyping = (isTyping) => {
    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    // Only send typing indicator if we're connected and have a selected chat
    if (!socketContext.connected || !selectedChat) {
      console.log(
        "Cannot send typing indicator: not connected or no chat selected"
      );
      return;
    }

    // Get the chat ID from the selected chat
    const chatId = selectedChat?._id || selectedChat?.id;

    if (!chatId) {
      console.log("Cannot send typing indicator: invalid chat ID");
      return;
    }

    // Send typing indicator with explicit chat ID
    console.log(
      `Sending typing indicator: ${
        isTyping ? "typing" : "stopped typing"
      } for chat ${chatId}`
    );
    socketContext.sendTyping(isTyping, chatId);

    // If user is typing, set a timeout to automatically stop typing indicator
    if (isTyping) {
      const timeout = setTimeout(() => {
        console.log("Typing timeout expired, sending stopped typing");
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
          console.log(`Cleanup: sending stopped typing for chat ${chatId}`);
          socketContext.sendTyping(false, chatId);
        }
      }

      // Leave chat room on component unmount
      const chatId = selectedChat?._id || selectedChat?.id;
      if (chatId) {
        console.log(`Cleanup: leaving chat room ${chatId}`);
        socketContext.leaveChat(chatId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  // Effect to scroll to bottom when new messages are received
  useEffect(() => {
    // Scroll to bottom when messages change
    if (socketContext.messages && socketContext.messages.length > 0) {
      console.log("Messages updated, scrolling to bottom");
      scrollToBottom();
    }
  }, [socketContext.messages]);

  // Effect to handle socket connection changes
  useEffect(() => {
    if (socketContext.connected) {
      console.log("Socket connected, refreshing messages if needed");

      // If we have a selected chat but no messages, try to load messages
      const chatId = selectedChat?._id || selectedChat?.id;
      if (
        chatId &&
        (!socketContext.messages || socketContext.messages.length === 0) &&
        !loadingMessages
      ) {
        console.log(
          "Socket connected and no messages, loading messages for chat:",
          chatId
        );
        setLoadingMessages(true);

        getMessagesForChat(chatId)
          .then((response) => {
            console.log("Messages response after reconnection:", response);

            // Handle the nested API response structure
            let msgs = [];

            if (response.error) {
              console.error("Error loading messages:", response.message);
            } else {
              // The API response has a nested structure with the actual data in the 'data' property
              const responseData = response.data;

              // Try to extract messages from various possible locations
              if (responseData?.data && Array.isArray(responseData.data)) {
                // Nested: { data: [...] }
                msgs = responseData.data;
                console.log(
                  "Using nested messages data from response.data.data"
                );
              } else if (Array.isArray(responseData)) {
                // Direct: [...]
                msgs = responseData;
                console.log("Using direct messages array from response.data");
              } else {
                console.error("Invalid messages data format:", responseData);
              }
            }

            // Ensure we have an array of messages
            if (!Array.isArray(msgs)) {
              console.error("Messages data is not an array:", msgs);
              msgs = [];
            }

            // Sort messages by createdAt timestamp if available
            if (msgs.length > 0 && msgs[0].createdAt) {
              msgs.sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
              );
            }

            // Set messages in the socket context to maintain state across components
            socketContext.setMessages(msgs);

            // Scroll to bottom after loading messages
            setTimeout(scrollToBottom, 100);
          })
          .catch((err) => {
            console.error("Failed to load messages after reconnection:", err);
          })
          .finally(() => {
            setLoadingMessages(false);
          });
      }
    } else {
      console.log("Socket disconnected");
    }
  }, [socketContext.connected]);

  const handleSendMessage = () => {
    // Ensure we have a valid chat ID (either _id or id)
    const chatId = selectedChat?._id || selectedChat?.id;

    if (!message.trim() || !chatId) {
      console.error("Cannot send message: missing content or chat ID");
      return;
    }

    console.log(`Sending message to chat ${chatId}: "${message.trim()}"`);

    try {
      // Stop typing indicator
      handleTyping(false);

      // Send message via socket context
      socketContext.sendMessage({
        content: message.trim(),
        chatId: chatId,
      });

      // Clear the input field
      setMessage("");

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
      <div className="chat-header-container">
        <div className="chat-header-left">
          <div className="back-button" onClick={onBackClick}>
            <span>←</span>
          </div>
          <div className="chat-header-avatar">
            {(selectedChat.chatName || selectedChat.users?.[0]?.username || "?")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div className="chat-header-details">
            <div className="chat-header-name">
              {selectedChat.chatName ||
                selectedChat.users?.map((u) => u.username).join(", ") ||
                "Chat"}
            </div>
            <div className="chat-header-status">
              {selectedChat.isGroupChat
                ? `${selectedChat.users?.length || 0} people`
                : "Active now"}
              {Object.keys(socketContext.typingUsers).length > 0 && (
                <span
                  className="typing-indicator"
                  style={{
                    color: "#1DA1F2",
                    fontWeight: "bold",
                    animation: "pulse 1.5s infinite",
                  }}
                >
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

            {/* Add a style for the typing animation */}
            <style jsx="true">{`
              @keyframes pulse {
                0% {
                  opacity: 0.6;
                }
                50% {
                  opacity: 1;
                }
                100% {
                  opacity: 0.6;
                }
              }
            `}</style>
          </div>
        </div>
        <div className="chat-header-actions">
          <div className="header-icon" title="Search">
            <i className="fa-solid fa-search"></i>
          </div>
          <div
            className="header-icon"
            title="Info"
            onClick={() => {
              // Show the profile modal with the chat partner's info
              if (selectedChat.isGroupChat) {
                // For group chats, show group info
                console.log("Show group info:", selectedChat);
                // You could implement group info modal here
              } else {
                // For 1:1 chats, show the chat partner's profile
                console.log("Show user profile for:", chatPartner);
                setShowProfileModal(true);
              }
            }}
          >
            <i className="fa-solid fa-info-circle"></i>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {loadingMessages ? (
          <div className="loading-messages">Loading messages...</div>
        ) : socketContext.messages?.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-content">
              <i className="fa-solid fa-envelope no-messages-icon"></i>
              <p>No messages yet</p>
              <p className="no-messages-hint">
                Send a message to start the conversation
              </p>
            </div>
          </div>
        ) : (
          <ul className="messages-list">
            {/* Connection status message */}
            <div className="special-message">
              <span>
                {socketContext.connected
                  ? "Connected to chat"
                  : "Disconnected from chat"}
              </span>
            </div>

            {/* Group messages by date */}
            {(socketContext.messages || []).map((msg, index) => {
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

              return (
                <React.Fragment key={msg._id || msg.id || index}>
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

                  <li className={messageClass}>
                    <div className="message-bubble">
                      <div className="message-content">{msg.content}</div>
                      <div className="message-timestamp">
                        {formatMessageDate(msg.createdAt)}
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
          <button className="message-action-button" title="Add photo">
            🖼️
          </button>
          <button className="message-action-button" title="Add GIF">
            GIF
          </button>
        </div>
        <input
          type="text"
          name="message"
          placeholder="Start a new message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!message.trim() || !socketContext.connected}
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
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
