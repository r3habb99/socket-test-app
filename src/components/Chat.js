import React from "react";
import { useSocket } from "../components/Common/SocketProvider"; // Access socket context
import "../css/chat.css";
const Chat = () => {
  const {
    userId,
    setUserId,
    roomId,
    setRoomId,
    message,
    setMessage,
    messages,
    handleSetup,
    handleJoinRoom,
    handleSendMessage,
    isSetupClicked,
    isJoinRoomClicked,
  } = useSocket(); // Use socket context for functionality

  // Function to handle sending the message when Enter key is pressed
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && message.trim()) {
      handleSendMessage(); // Send message when Enter is pressed
    }
  };

  return (
    <div className="chat-container">
      <h1>Chat App 💬</h1>

      <div className="form-container">
        <div>
          <h2>Setup User</h2>
          <input
            type="text"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <button
            className="send-btn"
            onClick={handleSetup}
            disabled={isSetupClicked || !userId.trim()}
          >
            Setup
          </button>
        </div>

        <div>
          <h2>Join Room</h2>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button
            className="send-btn"
            onClick={handleJoinRoom}
            disabled={isJoinRoomClicked || !roomId.trim()}
          >
            Join Room
          </button>
        </div>
      </div>

      <div className="messages-container">
        <ul>
          {messages.map((msg, index) => (
            <li
              key={index}
              className={msg.sender._id === userId ? "sender" : "receiver"}
            >
              <strong>{msg.sender.username || msg.sender._id}:</strong>
              {msg.content}
            </li>
          ))}
        </ul>
      </div>

      <div className="input-container">
        <input
          type="text"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress} // Listen for Enter key
        />
        <button
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!message.trim()}
        >
          <i className="fa-solid fa-paper-plane"></i> {/* Send Icon */}
        </button>
      </div>
    </div>
  );
};

export default Chat;
