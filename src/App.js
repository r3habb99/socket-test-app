import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./index.css"; // Make sure to import the CSS file

const socket = io("http://192.168.0.88:8080", { transports: ["websocket"] });

function App() {
  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("message received", (newMessage) => {
      // console.log("📩 New message received:", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on("setup complete", (userId) => {
      console.log(`✅ User setup completed for: ${userId}`);
    });

    socket.on("joined room", (roomId) => {
      console.log(`🏠 Successfully joined room: ${roomId}`);
    });

    return () => {
      socket.off("message received");
      socket.off("setup complete");
      socket.off("joined room");
    };
  }, []);

  const handleSetup = () => {
    if (!userId) {
      alert("⚠️ Please enter a user ID");
      return;
    }
    socket.emit("setup", { _id: userId });
    console.log(`📡 Sent setup event for user: ${userId}`);
  };

  const handleJoinRoom = () => {
    if (!roomId) {
      alert("⚠️ Please enter a room ID");
      return;
    }
    socket.emit("join room", roomId);
    console.log(`📥 Sent join room event for room: ${roomId}`);
  };

  const handleSendMessage = () => {
    if (!roomId || !userId || !message.trim()) {
      alert("⚠️ Please enter all fields (user ID, room ID, and message)");
      return;
    }

    const newMessage = {
      chat: { _id: roomId },
      sender: userId,
      content: message,
    };

    socket.emit("new message", newMessage);
    // console.log(`📨 Sent new message: ${JSON.stringify(newMessage)}`);
    setMessage("");
  };

  return (
    /* HTML structure remains the same in React JSX, we update only the input container */
    <div className="container">
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
          <button onClick={handleSetup}>Setup</button>
        </div>

        <div>
          <h2>Join Room</h2>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      </div>

      <div className="chat-container">
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
          />
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <i className="fa-solid fa-paper-plane"></i>{" "}
            {/* Font Awesome Send Icon */}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
