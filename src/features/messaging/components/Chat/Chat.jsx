import React, { useState } from "react";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { UserProfileModal } from "../UserProfileModal";
import { useChatLogic } from "./ChatLogic";
import { useChatHandlers } from "./ChatHandlers";
import { useMessageHandlers } from "./MessageHandlers";
import { ChatHeader, MessageInput, MessagesContainer } from "./ChatUI";
import { SocketDebugPanel } from "../SocketDebugPanel";
import "./Chat.css";

export const Chat = ({ selectedChat, onBackClick }) => {
  const socketContext = useSocketContext();
  // Define showDebug state at the top level, not conditionally
  const [showDebug] = useState(process.env.NODE_ENV === 'development');

  // Use the custom hooks to get all the logic and state
  const {
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
    loadMessagesForChat
  } = useChatLogic(selectedChat, socketContext);

  // Get chat event handlers
  const {
    handleTyping
  } = useChatHandlers({
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
  });

  // Get message handling functions
  const {
    handleSendMessage,
    handleKeyPress,
    formatMessageDate,
    getMessageDate
  } = useMessageHandlers({
    selectedChat,
    socketContext,
    message,
    setMessage,
    userId,
    scrollToBottom,
    handleTyping
  });

  // Check if a chat is selected
  if (!selectedChat) {
    return (
      <div className="chat-container">
        Please select a chat to start messaging.
      </div>
    );
  }

  // Debug mode is already defined at the top level

  return (
    <div className="chat-container">
      <ChatHeader
        selectedChat={selectedChat}
        chatPartner={chatPartner}
        onBackClick={onBackClick}
        socketContext={socketContext}
        setShowProfileModal={setShowProfileModal}
      />

      <MessagesContainer
        loadingMessages={loadingMessages}
        socketContext={socketContext}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        isAtTop={isAtTop}
        userId={userId}
        formatMessageDate={formatMessageDate}
        getMessageDate={getMessageDate}
      />

      <MessageInput
        message={message}
        setMessage={setMessage}
        handleKeyPress={handleKeyPress}
        handleSendMessage={handleSendMessage}
        socketContext={socketContext}
      />

      {/* User Profile Modal */}
      {showProfileModal && chatPartner && (
        <UserProfileModal
          user={chatPartner}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Socket Debug Panel - only shown in development mode */}
      {showDebug && <SocketDebugPanel />}
    </div>
  );
};
