import React from "react";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { UserProfileModal } from "../UserProfileModal";
import { useChatLogic } from "./ChatLogic";
import { useChatHandlers } from "./ChatHandlers";
import { useMessageHandlers } from "./MessageHandlers";
import { ChatHeader, MessageInput, MessagesContainer } from "./ChatUI";
import "./Chat.css";

export const Chat = ({ selectedChat, onBackClick }) => {
  const socketContext = useSocketContext();

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
    </div>
  );
};
