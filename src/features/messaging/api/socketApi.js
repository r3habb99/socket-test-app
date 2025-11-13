import { io } from "socket.io-client";
import { SOCKET_URL } from "../../../constants";

// Socket.io connection URL - should match your backend

let socket = null;
let eventHandlers = {};

/**
 * Initialize socket connection
 * @param {string} userId - User ID
 * @param {string} username - Username
 * @returns {Object|null} Socket instance or null if initialization failed
 */
export const initializeSocket = (userId, username) => {
  if (!userId || !username) {
    console.error("Cannot initialize socket: missing userId or username");
    return null;
  }

  try {
    // Disconnect existing socket if any
    if (socket) {
      disconnectSocket();
    }


    // Create new socket connection with auth data
    socket = io(SOCKET_URL, {
      auth: {
        userId,
        username,
        token: localStorage.getItem("token"),
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000, // Increased timeout
      transports: ["websocket", "polling"], // Try websocket first, then polling
      autoConnect: true,
      forceNew: true, // Force a new connection to avoid reusing problematic connections
    });

    // Set up basic event handlers
    socket.on("connect", () => {
      console.log(`🔌 Socket connected successfully for user: ${userId}`);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${reason}`);
    });

    // Add a debug handler for all events
    const onevent = socket.onevent;
    socket.onevent = function (packet) {
      const args = packet.data || [];
      console.log(`Socket event received: ${args[0]}`, args.slice(1));
      onevent.call(this, packet);
    };

    return socket;
  } catch (error) {
    console.error("Error initializing socket:", error);
    return null;
  }
};

/**
 * Get the socket instance
 * @returns {Object|null} Socket instance or null if not initialized
 */
export const getSocket = () => socket;

/**
 * Join a chat room
 * @param {string} roomId - Room ID to join
 * @returns {boolean} Success status
 */
export const joinChatRoom = (roomId) => {
  if (!socket) {
    console.error("Cannot join chat room: socket not initialized");
    return false;
  }

  if (!roomId) {
    console.error("Cannot join chat room: missing roomId");
    return false;
  }

  if (!socket.connected) {
    console.warn(
      "Socket not connected when trying to join room. Connecting..."
    );
    socket.connect();
  }

  console.log(`Joining chat room: ${roomId}`);

  // Join the new room with acknowledgment callback
  // Note: Server-side will handle leaving previous rooms automatically
  socket.emit("join room", roomId, (response) => {
    if (response && response.success) {
      console.log(`✅ Successfully joined chat room: ${roomId}`);
      // Mark that we're successfully in this room
      socket._currentRoom = roomId;
    } else {
      console.error(`❌ Failed to join chat room: ${roomId}`, response);
    }
  });

  return true;
};

/**
 * Leave a chat room
 * @param {string} roomId - Room ID to leave
 */
export const leaveChatRoom = (roomId) => {
  if (!socket) {
    return;
  }
  socket.emit("leave room", roomId);
};

/**
 * Send a message via socket
 * @param {Object} message - Message object
 * @param {Function} callback - Callback function
 * @returns {boolean} Success status
 */
export const sendSocketMessage = (message, callback) => {
  if (!socket) {
    console.error("Cannot send message: socket not initialized");
    if (callback) callback({ success: false, error: "Socket not initialized" });
    return false;
  }

  if (!socket.connected) {
    console.warn(
      "Socket not connected when trying to send message. Connecting..."
    );
    socket.connect();
    // Don't return early, try to send the message anyway
  }

  console.log("Sending message via socket:", message);

  // Ensure we have the required fields
  const payload = {
    ...message,
    sender: message.sender || localStorage.getItem("userId"),
    timestamp: message.timestamp || new Date().toISOString(),
  };

  // Try both event names that might be used by the backend
  socket.emit("new message", payload, (acknowledgement) => {
    console.log("Message sent acknowledgment:", acknowledgement);
    if (callback) callback(acknowledgement || { success: true });
  });

  return true;
};

/**
 * Send typing indicator
 * @param {string} chatId - Chat ID
 * @param {boolean} isTyping - Whether user is typing
 */
export const sendTypingIndicator = (chatId, isTyping) => {
  if (!socket) {
    return;
  }

  const eventName = isTyping ? "typing" : "stop typing";
  socket.emit(eventName, { chatId });
};

/**
 * Mark message as read
 * @param {string} messageId - Message ID
 * @param {string} chatId - Chat ID
 */
export const markMessageReadViaSocket = (messageId, chatId) => {
  if (!socket) {
    return;
  }
  socket.emit("message read", { messageId, chatId });
};

/**
 * Mark all messages in a chat as read
 * @param {string} chatId - Chat ID
 */
export const markAllMessagesReadViaSocket = (chatId) => {
  if (!socket) {
    return;
  }
  socket.emit("mark messages read", { chatId });
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    eventHandlers = {};
  }
};

/**
 * Register event handler for message received
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onMessageReceived = (callback) => {
  if (!socket) {
    console.warn(
      "Socket not initialized when setting up message received handler"
    );
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["message received"]) {
    socket.off("message received", eventHandlers["message received"]);
  }

  // Register new handler with debug logging
  const wrappedCallback = (newMessage) => {
    console.log("🔔 Socket event 'message received' triggered:", newMessage);
    callback(newMessage);
  };

  socket.on("message received", wrappedCallback);
  eventHandlers["message received"] = wrappedCallback;

  // Also listen for 'new message' event as some backends use this name
  if (eventHandlers["new message"]) {
    socket.off("new message", eventHandlers["new message"]);
  }
  socket.on("new message", wrappedCallback);
  eventHandlers["new message"] = wrappedCallback;

  console.log("✅ Message received handler registered successfully");

  // Return unsubscribe function
  return () => {
    if (socket) {
      socket.off("message received", wrappedCallback);
      socket.off("new message", wrappedCallback);
      delete eventHandlers["message received"];
      delete eventHandlers["new message"];
      console.log("❌ Message received handler unregistered");
    }
  };
};

/**
 * Register event handler for message delivered
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onMessageDelivered = (callback) => {
  if (!socket) {
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["message delivered"]) {
    socket.off("message delivered", eventHandlers["message delivered"]);
  }

  // Register new handler
  socket.on("message delivered", callback);
  eventHandlers["message delivered"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("message delivered", callback);
    delete eventHandlers["message delivered"];
  };
};

/**
 * Register event handler for user typing
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onUserTyping = (callback) => {
  if (!socket) {
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["typing"]) {
    socket.off("typing", eventHandlers["typing"]);
  }

  // Register new handler
  socket.on("typing", callback);
  eventHandlers["typing"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("typing", callback);
    delete eventHandlers["typing"];
  };
};

/**
 * Register event handler for user stopped typing
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onUserStoppedTyping = (callback) => {
  if (!socket) {
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["stop typing"]) {
    socket.off("stop typing", eventHandlers["stop typing"]);
  }

  // Register new handler
  socket.on("stop typing", callback);
  eventHandlers["stop typing"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("stop typing", callback);
    delete eventHandlers["stop typing"];
  };
};

/**
 * Register event handler for message read confirmation
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onMessageReadConfirmation = (callback) => {
  if (!socket) {
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["message read"]) {
    socket.off("message read", eventHandlers["message read"]);
  }

  // Register new handler
  socket.on("message read", callback);
  eventHandlers["message read"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("message read", callback);
    delete eventHandlers["message read"];
  };
};

/**
 * Register event handler for messages bulk read
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onMessagesBulkRead = (callback) => {
  if (!socket) {
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["messages bulk read"]) {
    socket.off("messages bulk read", eventHandlers["messages bulk read"]);
  }

  // Register new handler
  socket.on("messages bulk read", callback);
  eventHandlers["messages bulk read"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("messages bulk read", callback);
    delete eventHandlers["messages bulk read"];
  };
};

/**
 * Register event handler for user joined
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onUserJoined = (callback) => {
  if (!socket) {
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["user joined"]) {
    socket.off("user joined", eventHandlers["user joined"]);
  }

  // Register new handler
  socket.on("user joined", callback);
  eventHandlers["user joined"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("user joined", callback);
    delete eventHandlers["user joined"];
  };
};

/**
 * Register event handler for user left
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onUserLeft = (callback) => {
  if (!socket) {
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["user left"]) {
    socket.off("user left", eventHandlers["user left"]);
  }

  // Register new handler
  socket.on("user left", callback);
  eventHandlers["user left"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("user left", callback);
    delete eventHandlers["user left"];
  };
};

/**
 * Register event handler for user online
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onUserOnline = (callback) => {
  if (!socket) {
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["user online"]) {
    socket.off("user online", eventHandlers["user online"]);
  }

  // Register new handler
  socket.on("user online", callback);
  eventHandlers["user online"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("user online", callback);
    delete eventHandlers["user online"];
  };
};

/**
 * Register event handler for user offline
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onUserOffline = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["user offline"]) {
    socket.off("user offline", eventHandlers["user offline"]);
  }

  // Register new handler
  socket.on("user offline", callback);
  eventHandlers["user offline"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("user offline", callback);
    delete eventHandlers["user offline"];
  };
};

/**
 * Register event handler for new post
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onNewPost = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["new post"]) {
    socket.off("new post", eventHandlers["new post"]);
  }

  // Register new handler
  socket.on("new post", callback);
  eventHandlers["new post"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("new post", callback);
    delete eventHandlers["new post"];
  };
};

/**
 * Register event handler for post liked
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onPostLiked = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["post liked"]) {
    socket.off("post liked", eventHandlers["post liked"]);
  }

  // Register new handler
  socket.on("post liked", callback);
  eventHandlers["post liked"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("post liked", callback);
    delete eventHandlers["post liked"];
  };
};

/**
 * Register event handler for post retweeted
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onPostRetweeted = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["post retweeted"]) {
    socket.off("post retweeted", eventHandlers["post retweeted"]);
  }

  // Register new handler
  socket.on("post retweeted", callback);
  eventHandlers["post retweeted"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("post retweeted", callback);
    delete eventHandlers["post retweeted"];
  };
};

/**
 * Register event handler for post deleted
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onPostDeleted = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["post deleted"]) {
    socket.off("post deleted", eventHandlers["post deleted"]);
  }

  // Register new handler
  socket.on("post deleted", callback);
  eventHandlers["post deleted"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("post deleted", callback);
    delete eventHandlers["post deleted"];
  };
};

// ============================================================================
// WebRTC CALLING FUNCTIONALITY
// ============================================================================

/**
 * Initiate a call to another user
 * @param {string} toUserId - Target user ID
 * @param {string} callType - 'audio' or 'video'
 * @param {string} chatId - Optional chat ID
 * @param {Function} callback - Callback function
 */
export const initiateCall = (toUserId, callType, chatId = null, callback) => {
  if (!socket) {
    console.error("Cannot initiate call: socket not initialized");
    if (callback) callback({ success: false, error: "Socket not initialized" });
    return;
  }

  const callData = {
    to: toUserId,
    callType,
    chatId
  };

  console.log("Initiating call:", callData);
  socket.emit("call:initiate", callData, callback);
};

/**
 * Accept an incoming call
 * @param {string} callId - Call ID
 * @param {string} fromUserId - Caller user ID
 * @param {Function} callback - Callback function
 */
export const acceptCall = (callId, fromUserId, callback) => {
  if (!socket) {
    console.error("Cannot accept call: socket not initialized");
    if (callback) callback({ success: false, error: "Socket not initialized" });
    return;
  }

  const acceptData = {
    callId,
    from: fromUserId
  };

  console.log("Accepting call:", acceptData);
  socket.emit("call:accept", acceptData, callback);
};

/**
 * Reject an incoming call
 * @param {string} callId - Call ID
 * @param {string} fromUserId - Caller user ID
 * @param {Function} callback - Callback function
 */
export const rejectCall = (callId, fromUserId, callback) => {
  if (!socket) {
    console.error("Cannot reject call: socket not initialized");
    if (callback) callback({ success: false, error: "Socket not initialized" });
    return;
  }

  const rejectData = {
    callId,
    from: fromUserId
  };

  console.log("Rejecting call:", rejectData);
  socket.emit("call:reject", rejectData, callback);
};

/**
 * End an active call
 * @param {string} callId - Call ID
 * @param {string} toUserId - Other participant user ID
 * @param {Function} callback - Callback function
 */
export const endCall = (callId, toUserId, callback) => {
  if (!socket) {
    console.error("Cannot end call: socket not initialized");
    if (callback) callback({ success: false, error: "Socket not initialized" });
    return;
  }

  const endData = {
    callId,
    to: toUserId
  };

  console.log("Ending call:", endData);
  socket.emit("call:end", endData, callback);
};

/**
 * Send WebRTC offer
 * @param {string} callId - Call ID
 * @param {string} toUserId - Target user ID
 * @param {Object} sdp - SDP offer
 */
export const sendOffer = (callId, toUserId, sdp) => {
  if (!socket) {
    console.error("Cannot send offer: socket not initialized");
    return;
  }

  const offerData = {
    callId,
    to: toUserId,
    sdp
  };

  console.log("Sending WebRTC offer:", offerData);
  socket.emit("webrtc:offer", offerData);
};

/**
 * Send WebRTC answer
 * @param {string} callId - Call ID
 * @param {string} toUserId - Target user ID
 * @param {Object} sdp - SDP answer
 */
export const sendAnswer = (callId, toUserId, sdp) => {
  if (!socket) {
    console.error("Cannot send answer: socket not initialized");
    return;
  }

  const answerData = {
    callId,
    to: toUserId,
    sdp
  };

  console.log("Sending WebRTC answer:", answerData);
  socket.emit("webrtc:answer", answerData);
};

/**
 * Send ICE candidate
 * @param {string} callId - Call ID
 * @param {string} toUserId - Target user ID
 * @param {Object} candidate - ICE candidate
 */
export const sendIceCandidate = (callId, toUserId, candidate) => {
  if (!socket) {
    console.error("Cannot send ICE candidate: socket not initialized");
    return;
  }

  const candidateData = {
    callId,
    to: toUserId,
    candidate
  };

  console.log("Sending ICE candidate:", candidateData);
  socket.emit("webrtc:ice-candidate", candidateData);
};

// ============================================================================
// WebRTC EVENT LISTENERS
// ============================================================================

/**
 * Register event handler for incoming call
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onCallIncoming = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized when setting up call incoming handler");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["call:incoming"]) {
    socket.off("call:incoming", eventHandlers["call:incoming"]);
  }

  // Add new handler
  socket.on("call:incoming", callback);
  eventHandlers["call:incoming"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("call:incoming", callback);
    delete eventHandlers["call:incoming"];
  };
};

/**
 * Register event handler for call accepted
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onCallAccepted = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized when setting up call accepted handler");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["call:accepted"]) {
    socket.off("call:accepted", eventHandlers["call:accepted"]);
  }

  // Add new handler
  socket.on("call:accepted", callback);
  eventHandlers["call:accepted"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("call:accepted", callback);
    delete eventHandlers["call:accepted"];
  };
};

/**
 * Register event handler for call rejected
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onCallRejected = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized when setting up call rejected handler");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["call:rejected"]) {
    socket.off("call:rejected", eventHandlers["call:rejected"]);
  }

  // Add new handler
  socket.on("call:rejected", callback);
  eventHandlers["call:rejected"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("call:rejected", callback);
    delete eventHandlers["call:rejected"];
  };
};

/**
 * Register event handler for call ended
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onCallEnded = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized when setting up call ended handler");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["call:ended"]) {
    socket.off("call:ended", eventHandlers["call:ended"]);
  }

  // Add new handler
  socket.on("call:ended", callback);
  eventHandlers["call:ended"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("call:ended", callback);
    delete eventHandlers["call:ended"];
  };
};

/**
 * Register event handler for WebRTC offer
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onWebRTCOffer = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized when setting up WebRTC offer handler");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["webrtc:offer"]) {
    socket.off("webrtc:offer", eventHandlers["webrtc:offer"]);
  }

  // Add new handler
  socket.on("webrtc:offer", callback);
  eventHandlers["webrtc:offer"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("webrtc:offer", callback);
    delete eventHandlers["webrtc:offer"];
  };
};

/**
 * Register event handler for WebRTC answer
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onWebRTCAnswer = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized when setting up WebRTC answer handler");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["webrtc:answer"]) {
    socket.off("webrtc:answer", eventHandlers["webrtc:answer"]);
  }

  // Add new handler
  socket.on("webrtc:answer", callback);
  eventHandlers["webrtc:answer"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("webrtc:answer", callback);
    delete eventHandlers["webrtc:answer"];
  };
};

/**
 * Register event handler for ICE candidate
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onIceCandidate = (callback) => {
  if (!socket) {
    console.warn("Socket not initialized when setting up ICE candidate handler");
    return () => {};
  }

  // Remove existing handler if any
  if (eventHandlers["webrtc:ice-candidate"]) {
    socket.off("webrtc:ice-candidate", eventHandlers["webrtc:ice-candidate"]);
  }

  // Add new handler
  socket.on("webrtc:ice-candidate", callback);
  eventHandlers["webrtc:ice-candidate"] = callback;

  // Return unsubscribe function
  return () => {
    socket.off("webrtc:ice-candidate", callback);
    delete eventHandlers["webrtc:ice-candidate"];
  };
};
