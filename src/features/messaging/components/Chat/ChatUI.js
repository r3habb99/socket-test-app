import React from "react";
import { Layout, Button, Avatar, Input, Spin, Empty, Typography } from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  SendOutlined,
  PictureOutlined,
  MailOutlined,
  DisconnectOutlined,
  LoadingOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { getImageUrl } from "../../../../shared/utils";
import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import MessageStatus from "../MessageStatus";
import UserStatus from "../UserStatus";
import "./Chat.css";
/**
 * Renders the chat header with user info and actions
 */
export const ChatHeader = ({ 
  selectedChat, 
  chatPartner, 
  onBackClick, 
  socketContext, 
  setShowProfileModal 
}) => {
  return (
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
  );
};

/**
 * Renders the message input area
 */
export const MessageInput = ({ 
  message, 
  setMessage, 
  handleKeyPress, 
  handleSendMessage, 
  socketContext 
}) => {
  return (
    <div className="input-container mobile-input-container">
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
  );
};

/**
 * Renders the messages container with all messages
 */
export const MessagesContainer = ({
  loadingMessages,
  socketContext,
  messagesContainerRef,
  messagesEndRef,
  isAtTop,
  userId,
  formatMessageDate,
  getMessageDate
}) => {
  return (
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
                  onClick={() => {
                    // Use silent reconnect
                    console.log("Manual reconnection initiated from Chat component");
                    socketContext.reconnect();
                  }}
                >
                  Reconnect
                </Button>
              </div>
            )}

            {/* Only show connection status for disconnected state or when actively reconnecting */}
            {socketContext.connectionStatus === 'reconnecting' && (
              <div className="connection-status warning">
                <LoadingOutlined spin className="status-icon" />
                <span>Reconnecting to chat server (Attempt {socketContext.reconnectAttempts}/10)</span>
                <Button
                  size="small"
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    // Use silent reconnect
                    console.log("Manual reconnection initiated from Chat component");
                    socketContext.reconnect();
                  }}
                >
                  Try Now
                </Button>
              </div>
            )}

            {/* Don't show connection success message to avoid visual noise */}
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
              console.log("Retry loading messages");
            }}
            style={{ marginTop: '20px' }}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};
