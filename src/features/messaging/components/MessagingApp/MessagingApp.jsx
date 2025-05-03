import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { ChatList } from "../ChatList";
import { Chat } from "../Chat";
import "./MessagingApp.css";

const MessagingApp = () => {
  const location = useLocation();
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const socketContext = useSocketContext();

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const prefillUserId = location.state?.prefillUserId || "";
  const prefillGroupName = location.state?.prefillGroupName || "";
  const prefillGroupUsers = location.state?.prefillGroupUsers || "";

  useEffect(() => {
    if (location.state?.initialChat) {
      console.log(
        "Received initialChat in MessagingApp:",
        location.state.initialChat
      );

      // Check if we have a valid chat object
      const chatData = location.state.initialChat;

      if (!chatData) {
        console.error("No chat data received");
        return;
      }

      // Normalize the chat object
      let normalizedChat = chatData;

      // If the chat has a data property, use that
      if (normalizedChat.data) {
        console.log("Using nested chat data:", normalizedChat.data);
        normalizedChat = normalizedChat.data;
      }

      // Ensure the chat has an _id property
      normalizedChat = {
        ...normalizedChat,
        _id: normalizedChat._id || normalizedChat.id, // Use _id if available, otherwise use id
      };

      console.log("Setting normalized chat:", normalizedChat);

      if (normalizedChat._id) {
        console.log("Setting selected chat with ID:", normalizedChat._id);
        setSelectedChat(normalizedChat);
      } else {
        console.error("Invalid chat data structure (no id or _id):", chatData);
      }
    }
  }, [location.state]);

  // Log when prefillUserId changes
  useEffect(() => {
    if (prefillUserId) {
      console.log("Received prefillUserId in MessagingApp:", prefillUserId);
    }
  }, [prefillUserId]);

  // Keep track of the last joined chat to avoid duplicate joins
  const [lastJoinedChatId, setLastJoinedChatId] = useState(null);

  useEffect(() => {
    // Get the chat ID (either _id or id)
    const chatId = selectedChat?._id || selectedChat?.id;

    if (socketContext.connected && chatId && chatId !== lastJoinedChatId) {
      console.log("MessagingApp: joining chat room with ID:", chatId);
      socketContext.joinChat(chatId);
      setLastJoinedChatId(chatId);
    }
  }, [selectedChat, socketContext, lastJoinedChatId]);

  return (
    <div className="messaging-app-container">
      <div
        className={`messaging-app-layout ${
          selectedChat && isMobile ? "chat-selected" : ""
        }`}
      >
        {/* Chat list - always visible */}
        <div className="chatlist-section">
          <ChatList
            onSelectChat={setSelectedChat}
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
                }
              }}
            />
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-content">
                <i className="fa-solid fa-envelope no-chat-icon"></i>
                <h3>Select a message</h3>
                <p>
                  Choose an existing conversation or start a new one with
                  someone on Twitter.
                </p>
                <button
                  className="start-message-btn"
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
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingApp;
