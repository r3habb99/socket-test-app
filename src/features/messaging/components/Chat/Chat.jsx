import React, { useEffect, useState, useRef } from "react";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { getMessagesForChat } from "../../api/messagingApi";
import { UserProfileModal } from "../UserProfileModal";
import "./Chat.css";

export const Chat = ({ selectedChat, onBackClick }) => {
  const socketContext = useSocketContext();

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const messagesEndRef = useRef(null);

  // Get current user ID from localStorage
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");

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
    // Ensure we have a valid chat ID (either _id or id)
    const chatId = selectedChat?._id || selectedChat?.id;

    if (chatId) {
      console.log("Chat component: Loading messages for chat:", chatId);
      setLoadingMessages(true);
      getMessagesForChat(chatId)
        .then((response) => {
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

          setMessages(msgs);
        })
        .catch((err) => {
          console.error("Failed to load messages:", err);
        })
        .finally(() => {
          setLoadingMessages(false);
        });
    }
  }, [selectedChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join chat room when selected chat changes
  useEffect(() => {
    const chatId = selectedChat?._id || selectedChat?.id;

    if (socketContext.connected && chatId) {
      socketContext.joinChat(chatId);

      // Subscribe to new messages
      const unsubscribe = socketContext.subscribe(
        "new message",
        (newMessage) => {
          if (newMessage.chat === chatId) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      );

      // Clean up on unmount
      return () => {
        unsubscribe();
        if (chatId) {
          socketContext.leaveChat(chatId);
        }
      };
    }
  }, [selectedChat, socketContext]);

  const handleSendMessage = () => {
    // Ensure we have a valid chat ID (either _id or id)
    const chatId = selectedChat?._id || selectedChat?.id;

    if (!message.trim() || !chatId) {
      console.error("Cannot send message: missing content or chat ID");
      return;
    }

    console.log(`Sending message to chat ${chatId}: "${message.trim()}"`);

    try {
      // Add temporary message to UI
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        id: `temp-${Date.now()}`,
        content: message.trim(),
        sender: {
          _id: userId,
          id: userId,
          username,
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
        isTemp: true,
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Send message via socket
      socketContext.sendMessage({
        content: message.trim(),
        chatId: chatId,
      });

      setMessage("");
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
            </div>
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
        ) : messages?.length === 0 ? (
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
            {(messages || []).map((msg, index) => {
              // Show date divider for first message or when date changes
              const showDateDivider =
                index === 0 ||
                getMessageDate(msg.createdAt) !==
                  getMessageDate(messages[index - 1]?.createdAt);

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
                <React.Fragment key={index}>
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
          disabled={!message.trim()}
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
