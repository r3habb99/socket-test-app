import React, { useState, useEffect, createContext, useContext } from "react";
import { io } from "socket.io-client";

const socket = io("http://192.168.0.88:8080", { transports: ["websocket"] });

// Create a context to share socket functionality
const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [isSetupClicked, setIsSetupClicked] = useState(false);
  const [isJoinRoomClicked, setIsJoinRoomClicked] = useState(false);

  useEffect(() => {
    socket.on("message received", (newMessage) => {
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
    if (userId.trim()) {
      setIsSetupClicked(true);
      socket.emit("setup", { _id: userId });
      console.log(`📡 Sent setup event for user: ${userId}`);
    }
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setIsJoinRoomClicked(true);
      socket.emit("join room", roomId);
      console.log(`📥 Sent join room event for room: ${roomId}`);
    }
  };

  const handleSendMessage = () => {
    if (roomId && userId && message.trim()) {
      const newMessage = {
        chat: { _id: roomId },
        sender: userId,
        content: message,
      };
      socket.emit("new message", newMessage);
      setMessage("");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        userId,
        setUserId,
        roomId,
        setRoomId,
        message,
        setMessage,
        messages,
        setMessages,
        isSetupClicked,
        isJoinRoomClicked,
        handleSetup,
        handleJoinRoom,
        handleSendMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
