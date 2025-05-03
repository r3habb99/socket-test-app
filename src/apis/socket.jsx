import { io } from "socket.io-client";
import { toast } from "react-toastify";

// Socket.io connection URL - should match your backend
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8080";

let socket = null;

// Initialize socket connection
export const initializeSocket = (userId, username) => {
  if (!userId || !username) {
    console.error("Cannot initialize socket: missing userId or username");
    return null;
  }

  try {
    if (socket) {
      // If socket already exists, disconnect it first
      console.log("Disconnecting existing socket before creating a new one");
      socket.disconnect();
    }

    console.log(
      `Creating new socket connection for user: ${userId} (${username})`
    );

    // Create new socket connection with auth data
    socket = io(SOCKET_URL, {
      auth: {
        userId,
        username,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    if (!socket) {
      console.error("Failed to create socket: io() returned null");
      return null;
    }

    // Connection event handlers
    socket.on("connect", () => {
      console.log("Socket connected successfully");
      toast.success("Connected to chat server");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      toast.error(`Connection error: ${error.message}`);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error(`Socket error: ${error.message || "Unknown error"}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server disconnected the client, try to reconnect
        socket.connect();
      }
    });

    console.log("Socket initialized successfully");
    return socket;
  } catch (error) {
    console.error("Error initializing socket:", error);
    return null;
  }
};

// Get the socket instance
export const getSocket = () => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");

    // Try to initialize with stored user data
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");

    if (userId && username) {
      console.log("Attempting to initialize socket with stored user data");
      return initializeSocket(userId, username);
    }
  }
  return socket;
};

// Join a chat room
export const joinChatRoom = (roomId) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return;
  }
  socket.emit("join room", roomId);
};

// Leave a chat room
export const leaveChatRoom = (roomId) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return;
  }
  socket.emit("leave room", roomId);
};

// Send a message via socket
export const sendSocketMessage = (message) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return;
  }
  socket.emit("new message", message);
};

// Send typing indicator
export const sendTypingIndicator = (roomId, isTyping) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return;
  }
  socket.emit("typing", { roomId, isTyping });
};

// Mark message as read
export const markMessageReadViaSocket = (messageId, chatId) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return;
  }

  if (!messageId || !chatId) {
    console.warn("Cannot mark message as read: missing messageId or chatId");
    console.warn("messageId:", messageId);
    console.warn("chatId:", chatId);
    return;
  }

  try {
    console.log(`Marking message ${messageId} as read in chat ${chatId}`);
    socket.emit("message read", { messageId, chatId });
  } catch (error) {
    console.error("Error marking message as read:", error);
  }
};

// Mark all messages in a chat as read
export const markAllMessagesReadViaSocket = (chatId) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return;
  }
  socket.emit("mark messages read", { chatId });
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Socket disconnected");
  }
};

// Register event listeners
export const onMessageReceived = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("message received", callback);
  return () => socket.off("message received", callback);
};

export const onMessageDelivered = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("message delivered", callback);
  return () => socket.off("message delivered", callback);
};

export const onUserTyping = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("user typing", callback);
  return () => socket.off("user typing", callback);
};

export const onUserStoppedTyping = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("user stopped typing", callback);
  return () => socket.off("user stopped typing", callback);
};

export const onMessageReadConfirmation = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("message read confirmation", callback);
  return () => socket.off("message read confirmation", callback);
};

export const onMessagesBulkRead = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("messages bulk read", callback);
  return () => socket.off("messages bulk read", callback);
};

export const onUserJoined = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("user joined", callback);
  return () => socket.off("user joined", callback);
};

export const onUserLeft = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("user left", callback);
  return () => socket.off("user left", callback);
};

export const onUserOnline = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("user online", callback);
  return () => socket.off("user online", callback);
};

export const onUserOffline = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("user offline", callback);
  return () => socket.off("user offline", callback);
};

// Post-related socket events
export const onNewPost = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("new post", callback);
  return () => socket.off("new post", callback);
};

export const onPostLiked = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("post liked", callback);
  return () => socket.off("post liked", callback);
};

export const onPostRetweeted = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("post retweeted", callback);
  return () => socket.off("post retweeted", callback);
};

export const onPostDeleted = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }
  socket.on("post deleted", callback);
  return () => socket.off("post deleted", callback);
};
