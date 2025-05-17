import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { useMessaging } from "../../hooks";
import { ChatList } from "../ChatList";
import { Chat } from "../Chat";
import { Layout, Alert, Button } from "antd";
import {
  MessageOutlined,
  ReloadOutlined,
  DisconnectOutlined,
  LoadingOutlined
} from "@ant-design/icons";
import "./MessagingApp.css";

const MessagingApp = () => {
  const location = useLocation();
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const socketContext = useSocketContext();
  const { chats, fetchChats } = useMessaging();
  const initialChatProcessed = useRef(false);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Reset selected chat when switching to mobile view
      if (mobile && !isMobile) {
        setSelectedChat(null);
      }
    };

    handleResize(); // Call once on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  // Handle socket reconnection if needed - only on mount
  useEffect(() => {
    if (!socketContext.connected) {
      socketContext.reconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally omitting socketContext to prevent reconnection loops

  const prefillUserId = location.state?.prefillUserId || "";
  const prefillGroupName = location.state?.prefillGroupName || "";
  const prefillGroupUsers = location.state?.prefillGroupUsers || "";

  // Fetch chats on component mount
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Handle initialChat from location state - with memoized location state to prevent infinite loops
  useEffect(() => {
    // Store the initial chat data in a ref to prevent re-processing
    const initialChatData = location.state?.initialChat;
    const isExistingChat = location.state?.isExistingChat || false;

    if (initialChatData && !initialChatProcessed.current && chats.length > 0) {
      console.log("Processing initial chat:", initialChatData);
      initialChatProcessed.current = true;

      // Check if we have a valid chat object
      if (!initialChatData) {
        console.error("No chat data received");
        return;
      }

      // Normalize the chat object
      let normalizedChat = initialChatData;

      // If the chat has a data property, use that
      if (normalizedChat.data) {
        normalizedChat = normalizedChat.data;
      }

      // Ensure the chat has an _id property
      normalizedChat = {
        ...normalizedChat,
        _id: normalizedChat._id || normalizedChat.id, // Use _id if available, otherwise use id
        id: normalizedChat.id || normalizedChat._id, // Ensure id is available
      };

      if (normalizedChat._id) {
        if (isExistingChat) {
          // If it's an existing chat, find it in the chats list and use that instance
          console.log("Using existing chat from chats list");
          const existingChat = chats.find(
            chat =>
              (chat._id === normalizedChat._id) ||
              (chat.id === normalizedChat._id) ||
              (chat._id === normalizedChat.id) ||
              (chat.id === normalizedChat.id)
          );

          if (existingChat) {
            // Use the chat from the list to ensure consistency
            setSelectedChat(existingChat);
          } else {
            // If not found (unlikely), use the normalized chat
            console.log("Existing chat not found in list, using provided chat");
            setSelectedChat(normalizedChat);
          }
        } else {
          // For new chats, just use the normalized chat
          console.log("Using new chat");
          setSelectedChat(normalizedChat);
        }
      } else {
        console.error("Invalid chat data structure (no id or _id):", initialChatData);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats.length]); // Only depend on chats.length to prevent infinite loops

  // Log when prefillUserId changes
  useEffect(() => {
    if (prefillUserId) {
    }
  }, [prefillUserId]);

  // Handle chat selection
  const handleSelectChat = (chat) => {
    if (!chat) {
      console.warn("Cannot select chat: invalid chat object");
      return;
    }

    // Normalize the chat object to ensure it has an _id property
    const normalizedChat = {
      ...chat,
      _id: chat._id || chat.id, // Use _id if available, otherwise use id
    };

    setSelectedChat(normalizedChat);
  };

  const { Content } = Layout;

  return (
    <Layout className="messaging-app-container">
      <div
        className={`messaging-app-layout ${
          selectedChat && isMobile ? "chat-selected" : ""
        }`}
      >
        {/* Connection status indicator */}
        {socketContext.connectionStatus === 'disconnected' && (
          <Alert
            message="Disconnected from chat server"
            description={socketContext.error ? `Error: ${socketContext.error}` : "Check your internet connection"}
            type="error"
            showIcon
            icon={<DisconnectOutlined />}
            action={
              <Button
                size="small"
                type="primary"
                danger
                icon={<ReloadOutlined />}
                onClick={() => socketContext.reconnect()}
              >
                Reconnect
              </Button>
            }
            className="connection-status-banner"
          />
        )}

        {socketContext.connectionStatus === 'connecting' && (
          <Alert
            message="Connecting to chat server..."
            type="warning"
            showIcon
            icon={<LoadingOutlined spin />}
            className="connection-status-banner"
          />
        )}

        {socketContext.connectionStatus === 'reconnecting' && (
          <Alert
            message={`Reconnecting to chat server (Attempt ${socketContext.reconnectAttempts}/${10})`}
            type="warning"
            showIcon
            icon={<LoadingOutlined spin />}
            action={
              <Button
                size="small"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => socketContext.reconnect()}
              >
                Try Now
              </Button>
            }
            className="connection-status-banner"
          />
        )}

        {/* Main content container */}
        <Content
          className="messaging-content-container"
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
            flexDirection: isMobile ? "column" : "row"
          }}
        >
          {/* Chat list - always visible */}
          <div className="chatlist-section">
            <ChatList
              onSelectChat={handleSelectChat}
              prefillUserId={prefillUserId}
              prefillGroupName={prefillGroupName}
              prefillGroupUsers={prefillGroupUsers}
              hideCreateInputs={!!(prefillUserId || prefillGroupName)}
              selectedChatId={selectedChat?._id || selectedChat?.id}
            />
          </div>

          {/* Chat window - shows when a chat is selected */}
          <div className="chat-section">
            {selectedChat ? (
              <Chat
                selectedChat={selectedChat}
                onBackClick={() => {
                  // Always hide the chat view when back button is clicked
                  setSelectedChat(null);

                  // On mobile, we might want to add additional behavior
                  if (isMobile) {
                    // For example, scroll to the top of the chat list
                    const chatList = document.querySelector(".chatlist");
                    if (chatList) {
                      chatList.scrollTop = 0;
                    }

                    // Add a small delay to ensure smooth transition
                    setTimeout(() => {
                      // Focus the search input in the ChatList component
                      const searchInput = document.querySelector(
                        ".chatlist-search input"
                      );
                      if (searchInput) {
                        searchInput.focus();
                      }
                    }, 300);
                  }
                }}
              />
            ) : (
              <div className="no-chat-selected">
                <div className="no-chat-content">
                  <MessageOutlined className="no-chat-icon" />
                  <h3>Select a message</h3>
                  <p>
                    Choose an existing conversation or start a new one with
                    someone on Twitter.
                  </p>
                  <Button
                    type="primary"
                    shape="round"
                    icon={<MessageOutlined />}
                    size="large"
                    className="start-message-btn"
                    style={{
                      backgroundColor: '#1d9bf0',
                      borderColor: '#1d9bf0'
                    }}
                    onClick={() => {
                      // Focus the search input in the ChatList component
                      const searchInput = document.querySelector(
                        ".chatlist-search input"
                      );
                      if (searchInput) {
                        searchInput.focus();
                        searchInput.scrollIntoView({ behavior: "smooth" });

                        // Find the ChatList component's search functions
                        // This is a bit of a hack, but it works for this case
                        const chatListSearchInput =
                          document.querySelector(".chatlist-search");
                        if (chatListSearchInput) {
                          // Trigger a click on the search input to show the search UI
                          chatListSearchInput.click();
                        }
                      }
                    }}
                  >
                    New Message
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Content>
      </div>
    </Layout>
  );
};

export default MessagingApp;
