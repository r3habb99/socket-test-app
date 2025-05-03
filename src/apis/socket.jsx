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
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ["websocket", "polling"], // Try WebSocket first, then fall back to polling
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

      // Try to reconnect after a delay
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        socket.connect();
      }, 2000);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error(`Socket error: ${error.message || "Unknown error"}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);

      // Try to reconnect for any disconnect reason
      if (reason === "io server disconnect" || reason === "transport close") {
        console.log("Attempting to reconnect after disconnect...");
        setTimeout(() => {
          socket.connect();
        }, 1000);
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      toast.success("Reconnected to chat server");
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
    });

    socket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed after all attempts");
      toast.error(
        "Failed to reconnect to chat server. Please refresh the page."
      );
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
export const sendSocketMessage = (message, callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    if (callback) callback({ success: false, error: "Socket not initialized" });
    return;
  }

  if (!socket.connected) {
    console.warn("Socket is not connected. Attempting to reconnect...");
    socket.connect();
    if (callback) callback({ success: false, error: "Socket not connected" });
    return;
  }

  // Ensure the message has a senderUsername field if username is provided
  // This helps with displaying the correct username for messages
  if (message.username && !message.senderUsername) {
    message.senderUsername = message.username;
    console.log("Added senderUsername to message:", message.senderUsername);
  }

  // If callback is provided, use it for acknowledgement
  if (callback) {
    socket.emit("new message", message, callback);
  } else {
    socket.emit("new message", message);
  }
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

// Apply this pattern to all event handlers
const createSafeEventHandler = (eventName, callback) => {
  if (!socket) {
    console.warn(
      `Socket not initialized for ${eventName}. Call initializeSocket first.`
    );
    return () => {};
  }

  // Create a safe callback that checks socket before execution
  const safeCallback = (data) => {
    if (socket) {
      callback(data);
    }
  };

  socket.on(eventName, safeCallback);
  return () => {
    if (socket) {
      socket.off(eventName, safeCallback);
    }
  };
};

// Update all event handlers to use the safe pattern
export const onMessageReceived = (callback) =>
  createSafeEventHandler("message received", callback);
export const onMessageDelivered = (callback) =>
  createSafeEventHandler("message delivered", callback);
export const onUserTyping = (callback) =>
  createSafeEventHandler("user typing", callback);
export const onUserStoppedTyping = (callback) =>
  createSafeEventHandler("user stopped typing", callback);
export const onMessageReadConfirmation = (callback) =>
  createSafeEventHandler("message read confirmation", callback);
export const onMessagesBulkRead = (callback) =>
  createSafeEventHandler("messages bulk read", callback);
export const onUserJoined = (callback) =>
  createSafeEventHandler("user joined", callback);
export const onUserLeft = (callback) =>
  createSafeEventHandler("user left", callback);
export const onUserOnline = (callback) =>
  createSafeEventHandler("user online", callback);
export const onUserOffline = (callback) =>
  createSafeEventHandler("user offline", callback);
export const onNewPost = (callback) =>
  createSafeEventHandler("new post", callback);
export const onPostLiked = (callback) =>
  createSafeEventHandler("post liked", callback);
export const onPostRetweeted = (callback) =>
  createSafeEventHandler("post retweeted", callback);
export const onPostDeleted = (callback) =>
  createSafeEventHandler("post deleted", callback);
