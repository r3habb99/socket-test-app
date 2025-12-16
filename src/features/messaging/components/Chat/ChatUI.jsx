import React, { useState, useRef, useEffect } from "react";
import { Layout, Button, Avatar, Input, Spin, Typography, Empty, Image as AntImage, Popconfirm, Modal } from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  SendOutlined,
  PictureOutlined,
  MailOutlined,
  DisconnectOutlined,
  LoadingOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { getImageUrl } from "../../../../shared/utils";
import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import { searchMessages } from "../../api/messagingApi";
import MessageStatus from "../MessageStatus";
import UserStatus from "../UserStatus";
import { compressImages, formatFileSize } from "../../utils/imageCompression";
import "./Chat.css";

/**
 * WhatsApp-like Message Search Bar Component
 * Appears inline below the chat header with navigation controls
 */
const MessageSearchBar = ({
  visible,
  onClose,
  selectedChat
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Handle search with debounce
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchMessages(selectedChat._id, query);

      if (response.success && response.data) {
        // The handleApiResponse function processes the response, so response.data contains the processed data
        // Based on the actual response structure: response.data.results
        const results = response.data.results || [];

        setSearchResults(results);
        setCurrentResultIndex(results.length > 0 ? 0 : -1);

        // Scroll to first result if available
        if (results.length > 0) {
          scrollToMessage(results[0]);
        }
      } else {
        setSearchResults([]);
        setCurrentResultIndex(-1);
      }
    } catch (error) {
      console.error("Error searching messages:", error);
      setSearchResults([]);
      setCurrentResultIndex(-1);
    } finally {
      setIsSearching(false);
    }
  };

  // Scroll to a specific message and highlight it
  const scrollToMessage = (message) => {
    if (!message) return;

    setTimeout(() => {
      const messageElement = document.querySelector(`[data-message-id="${message._id}"]`);
      if (messageElement) {
        // Scroll to the message with smooth animation
        messageElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        // Highlight the message temporarily (WhatsApp-style with dark theme)
        const originalBackground = messageElement.style.backgroundColor;
        const originalBoxShadow = messageElement.style.boxShadow;
        const originalTransform = messageElement.style.transform;

        messageElement.style.backgroundColor = 'rgba(0, 168, 132, 0.3)';
        messageElement.style.boxShadow = '0 0 0 2px rgba(0, 168, 132, 0.4)';
        messageElement.style.transform = 'scale(1.01)';
        messageElement.style.transition = 'all 0.3s ease';

        // Fade to lighter highlight
        setTimeout(() => {
          messageElement.style.backgroundColor = 'rgba(0, 168, 132, 0.2)';
        }, 300);

        // Remove highlight after 2 seconds
        setTimeout(() => {
          messageElement.style.backgroundColor = originalBackground;
          messageElement.style.boxShadow = originalBoxShadow;
          messageElement.style.transform = originalTransform;
        }, 2000);
      } else {
        console.log("Message not found in current view. Message ID:", message._id);
      }
    }, 100);
  };

  // Navigate to previous search result
  const handlePreviousResult = () => {
    if (searchResults.length === 0) return;

    const newIndex = currentResultIndex > 0 ? currentResultIndex - 1 : searchResults.length - 1;
    setCurrentResultIndex(newIndex);
    scrollToMessage(searchResults[newIndex]);
  };

  // Navigate to next search result
  const handleNextResult = () => {
    if (searchResults.length === 0) return;

    const newIndex = currentResultIndex < searchResults.length - 1 ? currentResultIndex + 1 : 0;
    setCurrentResultIndex(newIndex);
    scrollToMessage(searchResults[newIndex]);
  };

  // Handle search input change with debounce
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to delay the search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 500); // 500ms delay
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Enter key - navigate to next result
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleNextResult();
      }
    }
    // Shift + Enter - navigate to previous result
    else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      if (searchResults.length > 0) {
        handlePreviousResult();
      }
    }
    // Escape key - close search
    else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Clear search when search bar closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setSearchResults([]);
      setCurrentResultIndex(0);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="message-search-bar">
      <div className="search-input-wrapper">
        <Input
          placeholder="Search messages... (Enter: next, Shift+Enter: prev, Esc: close)"
          value={searchQuery}
          onChange={handleSearchInputChange}
          onKeyDown={handleKeyDown}
          prefix={<SearchOutlined className="search-icon" />}
          suffix={
            isSearching ? (
              <Spin size="small" />
            ) : searchQuery && searchResults.length === 0 && !isSearching ? (
              <span className="no-results-text">No results</span>
            ) : null
          }
          autoFocus
          className="search-input"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="search-navigation">
          <span className="result-counter">
            {currentResultIndex + 1} of {searchResults.length}
          </span>
          <div className="navigation-buttons">
            <Button
              type="text"
              size="small"
              icon={<UpOutlined />}
              onClick={handlePreviousResult}
              disabled={searchResults.length === 0}
              className="nav-button"
              title="Previous result (Shift + Enter)"
            />
            <Button
              type="text"
              size="small"
              icon={<DownOutlined />}
              onClick={handleNextResult}
              disabled={searchResults.length === 0}
              className="nav-button"
              title="Next result (Enter)"
            />
          </div>
        </div>
      )}

      <Button
        type="text"
        size="small"
        icon={<CloseOutlined />}
        onClick={onClose}
        className="close-button"
        title="Close search (Esc)"
      />
    </div>
  );
};

/**
 * Typing indicator component with animated dots
 */
const TypingIndicator = ({ typingUsers, currentUserId }) => {

  // Filter out current user from typing users
  const otherUsersTyping = Object.entries(typingUsers || {}).filter(
    ([userId]) => userId !== currentUserId
  );


  // Don't render if no one else is typing
  if (otherUsersTyping.length === 0) {
    return null;
  }

  // Get usernames of typing users
  const typingUsernames = otherUsersTyping.map(([, userData]) => userData.username);

  // Create display text based on number of users
  let displayText;
  if (typingUsernames.length === 1) {
    displayText = `${typingUsernames[0]} is typing`;
  } else if (typingUsernames.length === 2) {
    displayText = `${typingUsernames[0]} and ${typingUsernames[1]} are typing`;
  } else {
    displayText = `${typingUsernames[0]} and ${typingUsernames.length - 1} others are typing`;
  }

  return (
    <div className="typing-indicator">
      <div className="typing-bubble">
        <div className="typing-content">
          <span className="typing-text">{displayText}</span>
          <div className="typing-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    </div>
  );
};
/**
 * Renders the chat header with user info and actions
 */
export const ChatHeader = ({
  selectedChat,
  chatPartner,
  onBackClick,
  socketContext,
  setShowProfileModal,
  onStartVideoCall,
  onStartAudioCall,
  isCallAvailable = true,
  onSearchClick
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
        {/* Call buttons - only show for 1:1 chats */}
        {!selectedChat.isGroupChat && chatPartner && isCallAvailable && (
          <>
            <Button
              type="text"
              icon={<PhoneOutlined />}
              className="header-icon call-button"
              title="Audio Call"
              onClick={() => onStartAudioCall && onStartAudioCall(chatPartner._id || chatPartner.id, selectedChat._id)}
            />
            <Button
              type="text"
              icon={<VideoCameraOutlined />}
              className="header-icon call-button"
              title="Video Call"
              onClick={() => onStartVideoCall && onStartVideoCall(chatPartner._id || chatPartner.id, selectedChat._id)}
            />
          </>
        )}

        <Button
          type="text"
          icon={<SearchOutlined />}
          className="header-icon"
          title="Search Messages"
          onClick={onSearchClick}
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
 * Renders the message input area with media upload support
 */
export const MessageInput = ({
  message,
  setMessage,
  handleKeyPress,
  handleSendMessage,
  socketContext,
  selectedMedia,
  setSelectedMedia,
  mediaPreview,
  setMediaPreview
}) => {
  const fileInputRef = useRef(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [compressing, setCompressing] = useState(false);

  // Handle file selection with compression
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 files
    const filesToAdd = files.slice(0, 5 - (selectedMedia?.length || 0));

    if (filesToAdd.length < files.length) {
      console.warn(`Only ${5 - (selectedMedia?.length || 0)} more files can be added (max 5 total)`);
    }

    // Validate files
    const validFiles = [];

    for (const file of filesToAdd) {
      // Check file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        console.warn(`File ${file.name} is not an image or video`);
        continue;
      }

      // Check file size (5MB limit for videos, will compress images)
      if (isVideo && file.size > 5 * 1024 * 1024) {
        console.warn(`Video ${file.name} exceeds 5MB limit`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    // Compress images
    setCompressing(true);
    try {
      const compressedFiles = await compressImages(validFiles, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        maxSizeMB: 1
      });

      // Create previews for compressed files
      const previews = [];
      for (const file of compressedFiles) {
        const isImage = file.type.startsWith('image/');
        const reader = new FileReader();

        const preview = await new Promise((resolve) => {
          reader.onloadend = () => {
            resolve({
              file,
              url: reader.result,
              type: isImage ? 'image' : 'video',
              size: file.size,
              originalName: file.name
            });
          };
          reader.readAsDataURL(file);
        });

        previews.push(preview);
      }

      // Update state with compressed files and previews
      setSelectedMedia(prev => [...(prev || []), ...compressedFiles]);
      setMediaPreview(prev => [...(prev || []), ...previews]);

      console.log(`✅ Added ${compressedFiles.length} file(s) with compression`);
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setCompressing(false);
    }

    // Reset file input
    e.target.value = '';
  };

  // Remove a selected media file
  const handleRemoveMedia = (index) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
    setMediaPreview(prev => prev.filter((_, i) => i !== index));
  };

  // Open lightbox to view full-size preview
  const handlePreviewClick = (preview) => {
    setLightboxImage(preview);
    setLightboxVisible(true);
  };

  // Close lightbox
  const handleCloseLightbox = () => {
    setLightboxVisible(false);
    setLightboxImage(null);
  };

  // Check if send button should be disabled
  const isDisabled = (!message.trim() && (!selectedMedia || selectedMedia.length === 0)) || !socketContext.connected;

  return (
    <div className="message-input-wrapper">
      {/* Media Preview - Full width above input */}
      {mediaPreview && mediaPreview.length > 0 && (
        <div className="media-preview-overlay">
          <div className="media-preview-header">
            <Typography.Text strong style={{ color: '#fff' }}>
              {mediaPreview.length} {mediaPreview.length === 1 ? 'file' : 'files'} selected
            </Typography.Text>
            <Button
              type="text"
              icon={<CloseOutlined />}
              className="media-preview-close-all"
              onClick={() => {
                setSelectedMedia([]);
                setMediaPreview([]);
              }}
            />
          </div>
          <div className="media-preview-grid">
            {compressing && (
              <div className="media-preview-compressing">
                <Spin size="small" />
                <Typography.Text style={{ color: '#fff', marginLeft: 8 }}>
                  Compressing images...
                </Typography.Text>
              </div>
            )}
            {mediaPreview.map((preview, index) => (
              <div key={index} className="media-preview-card">
                <div
                  className="media-preview-thumbnail"
                  onClick={() => handlePreviewClick(preview)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view full size"
                >
                  {preview.type === 'image' ? (
                    <img src={preview.url} alt={`Preview ${index + 1}`} className="media-preview-image" />
                  ) : (
                    <div className="media-preview-video-wrapper">
                      <video src={preview.url} className="media-preview-video-element" />
                      <div className="video-overlay">
                        <PlayCircleOutlined className="video-play-icon" />
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  className="media-preview-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveMedia(index);
                  }}
                  title="Remove"
                />
                <div className="media-preview-filename">
                  {preview.file.name}
                  {preview.size && (
                    <span className="media-preview-filesize">
                      {' '}({formatFileSize(preview.size)})
                    </span>
                  )}
                </div>
              </div>
            ))}
            {/* Add more button if less than 5 files */}
            {mediaPreview.length < 5 && (
              <div className="media-preview-add-more" onClick={() => fileInputRef.current?.click()}>
                <PictureOutlined className="add-more-icon" />
                <Typography.Text className="add-more-text">Add more</Typography.Text>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="input-container mobile-input-container">
        <div className="message-actions">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            multiple
            style={{ display: 'none' }}
          />

          <Button
            type="text"
            className="message-action-button"
            title="Add photo or video"
            icon={<PictureOutlined />}
            onClick={() => fileInputRef.current?.click()}
            disabled={selectedMedia && selectedMedia.length >= 5}
          />
        </div>

        <Input
          placeholder={selectedMedia && selectedMedia.length > 0 ? "Add a caption (optional)" : "Start a new message"}
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
          disabled={isDisabled}
        />
      </div>

      {/* Lightbox Modal for Full-Size Preview */}
      <Modal
        open={lightboxVisible}
        onCancel={handleCloseLightbox}
        footer={null}
        width="90vw"
        centered
        className="media-lightbox-modal"
        styles={{
          body: { padding: 0, background: '#000' }
        }}
      >
        {lightboxImage && (
          <div className="media-lightbox-content">
            {lightboxImage.type === 'image' ? (
              <img
                src={lightboxImage.url}
                alt="Full size preview"
                className="media-lightbox-image"
              />
            ) : (
              <video
                src={lightboxImage.url}
                controls
                className="media-lightbox-video"
                autoPlay
              />
            )}
            <div className="media-lightbox-info">
              <Typography.Text strong style={{ color: '#fff' }}>
                {lightboxImage.file?.name || 'Preview'}
              </Typography.Text>
              {lightboxImage.size && (
                <Typography.Text style={{ color: 'rgba(255,255,255,0.7)', marginLeft: 16 }}>
                  {formatFileSize(lightboxImage.size)}
                </Typography.Text>
              )}
            </div>
          </div>
        )}
      </Modal>
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
  getMessageDate,
  messages, // Add messages prop
  loadOlderMessages, // Add loadOlderMessages function
  loadingOlderMessages, // Add loading state for older messages
  hasMoreMessages, // Add hasMoreMessages flag
  handleDeleteMessage // Add delete message handler
}) => {


  return (
    <div className="messages-container" ref={messagesContainerRef}>
      {loadingMessages ? (
        <div className="loading-messages">
          <Spin size="large" tip="Loading messages..." />
        </div>
      ) : !messages || messages.length === 0 ? (
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
          {isAtTop && socketContext.messages && socketContext.messages.length > 0 && hasMoreMessages && (
            <div className="load-more-container">
              <Button
                size="small"
                icon={<ReloadOutlined spin={loadingOlderMessages} />}
                onClick={loadOlderMessages}
                loading={loadingOlderMessages}
                disabled={loadingOlderMessages}
              >
                {loadingOlderMessages ? "Loading..." : "Load older messages"}
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
          {(messages || []).map((msg, index) => {
            // Skip rendering if message doesn't have content OR media
            if (!msg || (!msg.content && (!msg.media || msg.media.length === 0))) {
              console.warn(`Skipping message ${index} - no content or media:`, msg);
              return null;
            }

            // Show date divider for first message or when date changes
            const showDateDivider =
              index === 0 ||
              getMessageDate(msg.createdAt) !==
                getMessageDate(socketContext.messages[index - 1]?.createdAt);

            // Handle different sender ID formats
            const senderId = msg.sender?._id || msg.sender?.id || msg.sender;

            // Check if the current user is the sender
            const isSender = String(senderId) === String(userId);

            // Force sender class for messages sent by the current user
            const messageClass = isSender ? "sender" : "receiver";

            // Generate a stable key for the message
            // For messages with an ID, use their ID
            // For messages without any ID, create a stable index-based key that won't change on re-renders
            const messageKey =
              msg._id ||
              msg.id ||
              `msg-${index}-${msg.content?.substring(0, 10)}-${msg.sender?._id || msg.sender?.id || 'unknown'}`;

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

                <li
                  className={`${messageClass}`}
                  data-message-id={msg._id || msg.id}
                >
                  <div className="message-bubble">
                    {/* Delete button - only show for sender's messages */}
                    {isSender && handleDeleteMessage && (
                      <Popconfirm
                        title="Delete message"
                        description="Are you sure you want to delete this message?"
                        onConfirm={() => handleDeleteMessage(msg._id || msg.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          className="message-delete-btn"
                          title="Delete message"
                        />
                      </Popconfirm>
                    )}

                    {/* Render text content if present */}
                    {msg.content && <div className="message-content">{msg.content}</div>}

                    {/* Render media if present */}
                    {msg.media && msg.media.length > 0 && (
                      <div className={`message-media-grid grid-${msg.media.length}`}>
                        {msg.media.map((mediaUrl, mediaIndex) => {
                          const isVideo = mediaUrl.match(/\.(mp4|mov|avi|webm)$/i);
                          return (
                            <div key={mediaIndex} className="message-media-item">
                              {isVideo ? (
                                <video
                                  src={mediaUrl}
                                  controls
                                  className="message-media-video"
                                  preload="metadata"
                                />
                              ) : (
                                <AntImage
                                  src={mediaUrl}
                                  alt={`Media ${mediaIndex + 1}`}
                                  className="message-media-image"
                                  preview={{
                                    mask: <div>Click to view</div>
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="message-info">
                      <div className="message-timestamp">
                        {formatMessageDate(msg.createdAt)}
                      </div>
                      {isSender && <MessageStatus status={msg.status || 'sent'} />}
                    </div>
                  </div>
                </li>
              </React.Fragment>
            );
          })}

          {/* Typing indicator */}
          <TypingIndicator
            typingUsers={socketContext.typingUsers}
            currentUserId={userId}
          />

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

// Export the MessageSearchBar component (keeping old name for backward compatibility)
export { MessageSearchBar };
export { MessageSearchBar as MessageSearchDrawer };
