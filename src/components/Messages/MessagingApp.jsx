import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSocket } from "./SocketProvider";
import { ChatList } from "./ChatList";
import { Chat } from "./Chat";
import "./css/messagingApp.css";

export const MessagingAppContent = () => {
  const location = useLocation();
  const [selectedChat, setSelectedChat] = useState(null);
  const { joinChatRoom } = useSocket();

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

    if (chatId && chatId !== lastJoinedChatId) {
      console.log("MessagingAppContent: joining chat room with ID:", chatId);
      joinChatRoom(chatId);
      setLastJoinedChatId(chatId);
    }
  }, [selectedChat, joinChatRoom, lastJoinedChatId]);

  return (
    <div className="messaging-app-container">
      {!selectedChat ? (
        <div className="chatlist-section">
          <ChatList
            onSelectChat={setSelectedChat}
            prefillUserId={prefillUserId}
            prefillGroupName={prefillGroupName}
            prefillGroupUsers={prefillGroupUsers}
            hideCreateInputs={!!(prefillUserId || prefillGroupName)}
          />
        </div>
      ) : (
        <div className="chat-section">
          <button
            className="back-button"
            onClick={() => setSelectedChat(null)}
            style={{
              margin: "10px",
              padding: "5px 10px",
              cursor: "pointer",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: "#f0f0f0",
            }}
          >
            &larr; Back
          </button>
          <Chat selectedChat={selectedChat} />
        </div>
      )}
    </div>
  );
};
