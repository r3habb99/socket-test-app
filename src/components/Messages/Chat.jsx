import React, { useEffect, useState } from "react";
import "./css/chat.css";
import { Input } from "../Common";
import { useSocket } from "./SocketProvider";
import { getMessagesForChat } from "../../apis/messages";

export const Chat = ({ selectedChat }) => {
  const {
    userId,
    messages,
    setMessages,
    message,
    setMessage,
    sendMessage,
    joinChatRoom,
  } = useSocket();

  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    // Ensure we have a valid chat ID (either _id or id)
    const chatId = selectedChat?._id || selectedChat?.id;

    if (chatId) {
      console.log("Chat component: Loading messages for chat:", chatId);
      setLoadingMessages(true);
      getMessagesForChat(chatId)
        .then((msgsData) => {
          console.log("Messages loaded successfully:", msgsData);

          // Check if we have a valid messages array
          let msgs = msgsData;

          // If the response has a data property, use that
          if (msgsData && msgsData.data) {
            console.log("Using nested messages data");
            msgs = msgsData.data;
          }

          // Ensure we have an array of messages
          if (!Array.isArray(msgs)) {
            console.error("Invalid messages data format:", msgsData);
            msgs = [];
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
  }, [selectedChat, setMessages]);

  // Keep track of the last joined chat to avoid duplicate joins
  const [lastJoinedChatId, setLastJoinedChatId] = useState(null);

  useEffect(() => {
    // Ensure we have a valid chat ID (either _id or id)
    const chatId = selectedChat?._id || selectedChat?.id;

    if (chatId && chatId !== lastJoinedChatId) {
      console.log("Chat component: Joining chat room:", chatId);
      joinChatRoom(chatId);
      setLastJoinedChatId(chatId);
    }
  }, [selectedChat, joinChatRoom, lastJoinedChatId]);

  const handleSendMessage = () => {
    // Ensure we have a valid chat ID (either _id or id)
    const chatId = selectedChat?._id || selectedChat?.id;

    if (!message.trim() || !chatId) {
      console.error("Cannot send message: missing content or chat ID");
      return;
    }

    console.log(`Sending message to chat ${chatId}: "${message.trim()}"`);

    try {
      sendMessage(message.trim());
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && message.trim()) {
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

  return (
    <div className="chat-container">
      <h1>{selectedChat.chatName || "Chat"} 💬</h1>

      <div className="messages-container">
        {loadingMessages ? (
          <p>Loading messages...</p>
        ) : (
          <ul>
            {(messages || []).map((msg, index) => (
              <li
                key={index}
                className={msg.sender._id === userId ? "sender" : "receiver"}
              >
                <strong>{msg.sender?.username || msg.sender?._id}:</strong>{" "}
                {msg.content}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="input-container">
        <Input
          type="text"
          name="message"
          placeholder="Type a message"
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
    </div>
  );
};
