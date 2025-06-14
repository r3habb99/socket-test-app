import { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { toast } from "react-toastify";
import { SOCKET_URL } from "../../../constants";
import { MESSAGE_STATUS, updateMessageStatus } from "../utils/messageStatus";
import {
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  incrementAttemptCount
} from "../utils/offlineQueue";
import {
  setUserOnline,
  setUserOffline,
  updateLastSeen
} from "../utils/userPresence";
import {
  debugLog,
  addSocketLogging,
  trackRoomJoin,
  trackRoomLeave,
  isRoomJoined
} from "../utils/socketDebug";

/**
 * Custom hook for socket.io functionality
 * @param {string} url - Socket server URL
 * @param {Object} options - Additional options for socket behavior
 * @param {boolean} options.silentMode - If true, connection-related toast notifications will be suppressed
 * @returns {Object} Socket methods and state
 */
export const useSocket = (
  url = SOCKET_URL,
  options = {}
) => {
  // Extract options with defaults
  const { silentMode = false } = options;

  // Socket connection state
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'reconnecting'
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [recentlySentMessages, setRecentlySentMessages] = useState({});

  // User presence state
  const [onlineUsers, setOnlineUsers] = useState({});
  const [lastSeenTimes, setLastSeenTimes] = useState({});

  // Use refs to track state without causing re-renders
  const socketRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const recentlySentMessagesRef = useRef({});
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 10;
  const reconnectDelayBase = 1000; // Base delay in ms

  // Initialize refs with initial state values
  useEffect(() => {
    // Only set the ref if it's not already set (first time)
    if (currentChatId !== null && currentChatIdRef.current === null) {
      currentChatIdRef.current = currentChatId;
    }

    // Only update recentlySentMessagesRef on first render
    if (
      Object.keys(recentlySentMessagesRef.current).length === 0 &&
      Object.keys(recentlySentMessages).length > 0
    ) {
      recentlySentMessagesRef.current = recentlySentMessages;
    }
  }, [currentChatId, recentlySentMessages]);

  // Load offline queue and user presence data on initialization
  useEffect(() => {
    // Load offline queue
    const queue = getOfflineQueue();
    if (queue.length > 0) {
      console.log(`Loaded ${queue.length} messages from offline queue`);
      // Process offline queue directly instead of setting state
    }

    // Load online users from localStorage
    const storedOnlineUsers = localStorage.getItem('online_users');
    if (storedOnlineUsers) {
      try {
        const parsedUsers = JSON.parse(storedOnlineUsers);
        setOnlineUsers(parsedUsers);
      } catch (error) {
        console.error('Failed to parse online users:', error);
      }
    }

    // Load last seen times from localStorage
    const storedLastSeen = localStorage.getItem('last_seen_users');
    if (storedLastSeen) {
      try {
        const parsedLastSeen = JSON.parse(storedLastSeen);
        setLastSeenTimes(parsedLastSeen);
      } catch (error) {
        console.error('Failed to parse last seen times:', error);
      }
    }
  }, []);

  // Helper function to create a socket connection
  const createSocketConnection = useCallback(() => {
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token");

    if (!userId || !username) {
      setError("User information required");
      return null;
    }

    setConnectionStatus('connecting');
    debugLog(`Creating new socket connection for user: ${userId} (${username})`);

    // Create socket instance with user info
    const socket = io(url, {
      auth: {
        userId,
        username,
        token,
      },
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelayBase,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      transports: ["websocket", "polling"],
      withCredentials: true,
      forceNew: false,
      multiplex: true,
    });

    // Add socket event logging if debug mode is enabled
    return addSocketLogging(socket);
  }, [url]);

  // Initialize socket connection
  useEffect(() => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Check if socket is already initialized
    if (socketRef.current) {
      // If socket exists but is not connected, try to connect it
      if (!socketRef.current.connected) {
        debugLog("Socket exists but not connected. Attempting to connect...");
        setConnectionStatus('connecting');
        socketRef.current.connect();
      }
      return;
    }

    // Create a new socket connection
    const socket = createSocketConnection();
    if (!socket) return;

    // Set up event listeners for connection status
    socket.on("connect", () => {
      debugLog("Socket connected successfully");
      setConnected(true);
      setConnectionStatus('connected');
      setError(null);
      setReconnectAttempts(0);

      // Join current chat if any
      if (currentChatIdRef.current) {
        debugLog(`Joining chat room ${currentChatIdRef.current} after connection`);
        socket.emit("join room", currentChatIdRef.current);

        // Track the room join
        trackRoomJoin(currentChatIdRef.current);

        // Set up message event handlers for this chat
        debugLog(`Setting up message event handlers for chat ${currentChatIdRef.current}`);

        // Check if we need to load messages for this chat
        debugLog(`Socket connected, checking if messages need to be loaded`);

        // Emit a ready event to let the server know we're ready to receive messages
        setTimeout(() => {
          if (socketRef.current && socketRef.current.connected) {
            debugLog(`Emitting ready event for chat ${currentChatIdRef.current}`);
            socketRef.current.emit("ready", { chatId: currentChatIdRef.current });
          }
        }, 300);
      }

      // Set current user as online
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");
      if (userId) {
        // Update local state
        const updatedUsers = setUserOnline(userId, { username });
        setOnlineUsers(updatedUsers);

        // Broadcast online status to other users
        socket.emit("user online", { userId, username });
      }

      // Process offline queue
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        console.log(`Processing ${queue.length} messages from offline queue`);

        // Process each message in the queue
        queue.forEach(queuedMessage => {
          // Increment attempt count
          const updatedMessage = incrementAttemptCount(queuedMessage._id || queuedMessage.id);

          if (updatedMessage && updatedMessage.attempts <= 3) {
            console.log(`Sending queued message: ${updatedMessage._id || updatedMessage.id} (Attempt ${updatedMessage.attempts})`);

            // Prepare message payload
            const messagePayload = {
              content: updatedMessage.content,
              chat: updatedMessage.chat || updatedMessage.chatId,
              _id: updatedMessage._id || updatedMessage.id
            };

            // Send the message
            socket.emit("new message", messagePayload, (response) => {
              if (response && !response.success) {
                console.warn("Failed to send queued message:", response);
              } else {
                // Remove from queue on success
                removeFromOfflineQueue(updatedMessage._id || updatedMessage.id);
                console.log(`Successfully sent queued message: ${updatedMessage._id || updatedMessage.id}`);

                // Update message status to sent
                setMessages(prevMessages => {
                  return prevMessages.map(msg => {
                    if ((msg._id === updatedMessage._id || msg.id === updatedMessage.id) &&
                        msg.status === MESSAGE_STATUS.FAILED) {
                      return { ...msg, status: MESSAGE_STATUS.SENT };
                    }
                    return msg;
                  });
                });
              }
            });
          } else if (updatedMessage) {
            // Too many attempts, mark as permanently failed
            console.warn(`Giving up on queued message after ${updatedMessage.attempts} attempts: ${updatedMessage._id || updatedMessage.id}`);
            removeFromOfflineQueue(updatedMessage._id || updatedMessage.id);
          }
        });

        // Offline queue is processed, no need to update state
      }
    });

    // Handle user joined event
    socket.on("user joined", (data) => {
      debugLog(`User joined room: ${data.username || data.userId} joined ${data.roomId || data.chatId}`);

      // Always update online users regardless of the room
      // This ensures we track all online users across the app
      if (data.userId && data.userId !== localStorage.getItem("userId")) {
        debugLog(`Setting user ${data.userId} as online`);
        setOnlineUsers(prevUsers => ({
          ...prevUsers,
          [data.userId]: {
            ...data,
            timestamp: new Date().toISOString(),
            online: true
          }
        }));
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setConnected(false);
      setConnectionStatus('disconnected');
      setError(err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      setConnected(false);
      setConnectionStatus('disconnected');

      // Set current user as offline
      const userId = localStorage.getItem("userId");
      if (userId) {
        // Update local state
        const updatedUsers = setUserOffline(userId);
        setOnlineUsers(updatedUsers);

        // Update last seen time
        const updatedLastSeen = updateLastSeen(userId);
        setLastSeenTimes(updatedLastSeen);
      }

      // Implement exponential backoff for reconnection
      if (
        reason === "io server disconnect" ||
        reason === "transport close" ||
        reason === "transport error"
      ) {
        setConnectionStatus('reconnecting');

        // Calculate delay with exponential backoff
        const attempts = reconnectAttempts + 1;
        setReconnectAttempts(attempts);

        const delay = Math.min(
          reconnectDelayBase * Math.pow(1.5, attempts),
          30000 // Max 30 seconds
        );

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${attempts}/${maxReconnectAttempts})`);

        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Set new timeout for reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          if (attempts <= maxReconnectAttempts && !socket.connected) {
            console.log(`Reconnection attempt ${attempts}/${maxReconnectAttempts}`);
            socket.connect();
          } else if (attempts > maxReconnectAttempts) {
            console.error("Max reconnection attempts reached");
            setError("Failed to reconnect after multiple attempts");
          }
        }, delay);
      }
    });

    // Handle user online events
    socket.on("user online", (data) => {
      console.log(`User online: ${data.username || data.userId}`);
      debugLog(`User online event received for user ${data.userId}`);

      // Update online users state
      if (data.userId && data.userId !== localStorage.getItem("userId")) {
        debugLog(`Setting user ${data.userId} as online from 'user online' event`);
        setOnlineUsers(prevUsers => ({
          ...prevUsers,
          [data.userId]: {
            ...data,
            timestamp: new Date().toISOString(),
            online: true
          }
        }));
      }
    });

    // Handle user offline events
    socket.on("user offline", (data) => {
      debugLog(`User offline: ${data.username || data.userId}`);

      // Update online users state
      setOnlineUsers(prevUsers => {
        const updatedUsers = { ...prevUsers };
        delete updatedUsers[data.userId];
        return updatedUsers;
      });

      // Update last seen times
      setLastSeenTimes(prevTimes => ({
        ...prevTimes,
        [data.userId]: new Date().toISOString()
      }));
    });

    // Handle user left event (when a user leaves a specific chat room)
    socket.on("user left", (data) => {
      debugLog(`User left room: ${data.username || data.userId} left ${data.roomId || data.chatId}`);

      // Note: When a user leaves a room, they might still be online in the app
      // So we don't remove them from onlineUsers here, we just update their last seen time
      // The 'user offline' event will handle removing them from onlineUsers when they disconnect

      // Update last seen time for this user if they're not the current user
      if (data.userId && data.userId !== localStorage.getItem("userId")) {
        debugLog(`Updating last seen time for user ${data.userId}`);
        setLastSeenTimes(prevTimes => ({
          ...prevTimes,
          [data.userId]: new Date().toISOString()
        }));
      }
    });

    // Handle user status events (for bulk updates)
    socket.on("user status", (data) => {
      debugLog("Received user status update", data);

      if (data.onlineUsers) {
        // Process online users data
        const processedUsers = { ...data.onlineUsers };

        // Make sure each user has the online flag set
        Object.keys(processedUsers).forEach(userId => {
          processedUsers[userId] = {
            ...processedUsers[userId],
            online: true,
            timestamp: processedUsers[userId].timestamp || new Date().toISOString()
          };
        });

        debugLog("Setting online users from bulk update", processedUsers);
        setOnlineUsers(prevUsers => ({
          ...prevUsers,
          ...processedUsers
        }));
      }

      if (data.lastSeen) {
        debugLog("Setting last seen times from bulk update", data.lastSeen);
        setLastSeenTimes(prevTimes => ({
          ...prevTimes,
          ...data.lastSeen
        }));
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      setError(null);

      // Rejoin current chat if any
      if (currentChatIdRef.current) {
        console.log(`Rejoining chat room ${currentChatIdRef.current} after reconnection`);
        socket.emit("join room", currentChatIdRef.current);
      }
    });

    // Message received handler - updated to match backend event
    const messageReceivedHandler = (newMessage) => {
      debugLog("Message received event handler called", newMessage);

      // Normalize chat ID (might be an object or a string)
      const messageChat =
        typeof newMessage.chat === "object"
          ? newMessage.chat._id || newMessage.chat.id
          : newMessage.chat || newMessage.chatId; // Also check for chatId

      // Get message ID (might be _id or id)
      const messageId = newMessage._id || newMessage.id;

      // Check for local message ID (for matching with locally sent messages)
      const localMessageId = newMessage.localMessageId;

      // Get message content
      const messageContent = newMessage.content;

      // Get sender ID (might be _id or id or an object with _id/id)
      const senderId =
        typeof newMessage.sender === "object"
          ? newMessage.sender._id || newMessage.sender.id
          : newMessage.sender;

      // Set message status based on sender
      const currentUserId = localStorage.getItem("userId");
      const isFromCurrentUser = String(senderId) === String(currentUserId);

      // If the message is from the current user, mark it as delivered
      // If it's from another user, mark it as read (since we're seeing it)
      const messageStatus = isFromCurrentUser ? MESSAGE_STATUS.DELIVERED : MESSAGE_STATUS.READ;

      // IMPORTANT: Make sure we're in the right chat room
      // If this message is for a chat we're not currently in, join that chat room
      if (
        messageChat &&
        messageChat !== currentChatIdRef.current &&
        socketRef.current
      ) {
        // We don't want to automatically switch chats, but we do want to make sure
        // we're joined to the chat room to receive future messages
        if (socketRef.current.connected) {
          debugLog(`Joining chat room ${messageChat} to receive future messages`);
          socketRef.current.emit("join room", messageChat);
          trackRoomJoin(messageChat);
        }
      }

      // Check if this is a message we just sent (to avoid duplicates)
      // Use the ref for recentlySentMessages to avoid dependency on state
      const isRecentlySentMessage =
        recentlySentMessagesRef.current[messageId] ||
        (localMessageId && recentlySentMessagesRef.current[localMessageId]) ||
        Object.keys(recentlySentMessagesRef.current).some((key) =>
          key.startsWith(`${messageContent}-`)
        );

      if (isRecentlySentMessage) {
        debugLog(`Skipping recently sent message: ${messageId || localMessageId}`);
        // This is a message we just sent, so we don't need to add it again
        return;
      }



      setMessages((prevMessages) => {
        // Check if message already exists by ID or if it's a local message that needs to be replaced
        const existsById = prevMessages.some(
          (msg) =>
            // Check by ID if available
            (messageId && ((msg._id && msg._id === messageId) || (msg.id && msg.id === messageId)))
        );

        // Check if this is a response to a local message we sent
        const localMessageIndex = prevMessages.findIndex(
          (msg) =>
            msg._id && msg._id.startsWith('local-') &&
            msg.content === messageContent &&
            String(msg.sender?._id || msg.sender?.id) === String(senderId)
        );

        if (existsById) {
          console.log(`Message already exists in state (ID: ${messageId}), updating status only`);
          // If message exists, just update its status
          return updateMessageStatus(prevMessages, messageId, messageStatus);
        }

        // If this is a response to a local message, replace the local message with the server message
        if (localMessageIndex !== -1) {
          console.log(`Replacing local message with server message for content: ${messageContent.substring(0, 20)}...`);
          const updatedMessages = [...prevMessages];
          updatedMessages[localMessageIndex] = {
            ...newMessage,
            status: messageStatus
          };
          return updatedMessages;
        }

        // Only add the message if it's for the current chat
        if (messageChat === currentChatIdRef.current) {
          console.log(`Adding new message to chat ${messageChat}: ${messageContent.substring(0, 20)}...`);

          // Add the new message with status
          const messageWithStatus = {
            ...newMessage,
            status: messageStatus, // Use the status we determined earlier
            _id: messageId || `generated-${Date.now()}`, // Ensure it has an _id
            id: messageId || `generated-${Date.now()}` // Ensure it has an id
          };

          // Add the new message
          const updatedMessages = [...prevMessages, messageWithStatus];

          // Sort messages by timestamp if available
          if (updatedMessages.length > 0 && updatedMessages[0].createdAt) {
            return updatedMessages.sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          }

          return updatedMessages;
        }

        return prevMessages;
      });

      // If the message is from another user, emit a read receipt
      if (!isFromCurrentUser && messageChat === currentChatIdRef.current && socketRef.current?.connected) {
        console.log(`Sending read receipt for message ${messageId}`);
        socketRef.current.emit("message read", {
          messageId,
          chatId: messageChat,
          userId: currentUserId
        });
      }

      // Force a notification for new messages from other users
      // We'll show notifications for ALL messages, even if they're not for the current chat
      if (senderId !== localStorage.getItem("userId")) {
        // Get sender username from the message if available
        const senderUsername =
          typeof newMessage.sender === "object"
            ? newMessage.sender.username
            : "User";


        // Only show notification if we're in the messages section
        if (window.location.pathname.includes('/messages')) {
          // Show a toast notification
          toast.info(`New message from ${senderUsername}`, {
            onClick: () => {
              // If we have a socket and the message is for a different chat,
              // we could potentially switch to that chat here
              if (socketRef.current && messageChat !== currentChatIdRef.current) {
                // Make sure we're joined to the chat room
                if (socketRef.current.connected) {
                  socketRef.current.emit("join room", messageChat);
                }
              }
            },
            autoClose: 5000,
          });
        }
      }
    };

    // Register the handler for only one event name to prevent duplicate processing
    // The backend should be consistent with its event naming
    debugLog(`Registered message event handlers for chat ${currentChatIdRef.current}`);
    socket.on("message received", messageReceivedHandler);

    // We'll keep a reference to the handler for cleanup
    const messageHandler = messageReceivedHandler;

    // We'll use the message handler reference for cleanup later

    // Handle message delivery status updates
    socket.on("message delivered", (data) => {
      console.log("Message delivered:", data);
      const messageId = data.messageId || data._id || data.id;
      if (messageId) {
        setMessages(prevMessages =>
          updateMessageStatus(prevMessages, messageId, MESSAGE_STATUS.DELIVERED)
        );
      }
    });

    // Handle message read status updates
    socket.on("message read", (data) => {
      console.log("Message read:", data);
      const messageId = data.messageId || data._id || data.id;
      if (messageId) {
        setMessages(prevMessages =>
          updateMessageStatus(prevMessages, messageId, MESSAGE_STATUS.READ)
        );
      }
    });

    // Handle bulk read status updates (when a user reads multiple messages at once)
    socket.on("messages bulk read", (data) => {
      console.log("Messages bulk read:", data);
      if (data.messageIds && Array.isArray(data.messageIds)) {
        setMessages(prevMessages => {
          let updatedMessages = [...prevMessages];
          data.messageIds.forEach(messageId => {
            updatedMessages = updateMessageStatus(updatedMessages, messageId, MESSAGE_STATUS.READ);
          });
          return updatedMessages;
        });
      }
    });

    // User typing handlers - updated to match backend events
    const userTypingHandler = (data) => {
      // Extract the chat/room ID from the data
      // The backend sends roomId in the typing event
      const roomId = data.roomId || data.chatId;

      // Only process typing events for the current chat
      if (roomId === currentChatIdRef.current) {
        // User is typing
        setTypingUsers((prev) => {
          // Avoid unnecessary state updates if user already exists
          if (prev[data.userId]) {
            return prev;
          }
          return {
            ...prev,
            [data.userId]: {
              username: data.username || "User",
              timestamp: new Date(data.timestamp || Date.now()),
            },
          };
        });
      }
    };

    // User stopped typing handler
    const userStoppedTypingHandler = (data) => {
      // Extract the chat/room ID from the data
      const roomId = data.roomId || data.chatId;

      // Only process typing events for the current chat
      if (roomId === currentChatIdRef.current) {
        setTypingUsers((prev) => {
          const newTypingUsers = { ...prev };
          delete newTypingUsers[data.userId];
          return newTypingUsers;
        });
      }
    };

    // Register for the backend event names
    socket.on("user typing", userTypingHandler);
    socket.on("user stopped typing", userStoppedTypingHandler);

    // Store socket instance in ref
    socketRef.current = socket;

    // Clean up on unmount
    return () => {
      // Leave current chat room if any - use ref instead of state
      if (currentChatIdRef.current && socket.connected) {
        debugLog(`Leaving chat room ${currentChatIdRef.current} on component unmount`);
        socket.emit("leave room", currentChatIdRef.current);
        trackRoomLeave(currentChatIdRef.current);

        // Also notify the server that we're leaving this chat
        debugLog(`Notifying server that we're leaving chat ${currentChatIdRef.current}`);
        socket.emit("leave chat", { chatId: currentChatIdRef.current });
      }

      // Remove all event listeners
      debugLog("Removing all socket event listeners");
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("reconnect");

      // Message events - use the saved reference to ensure we remove the correct handler
      socket.off("message received", messageHandler);

      // Message status events
      socket.off("message delivered");
      socket.off("message read");
      socket.off("messages bulk read");

      // Typing events
      socket.off("user typing", userTypingHandler);
      socket.off("user stopped typing", userStoppedTypingHandler);
      socket.off("typing");
      socket.off("stop typing");

      // User presence events
      socket.off("user joined");
      socket.off("user left");
      socket.off("user online");
      socket.off("user offline");
      socket.off("user status");

      // Set current user as offline before disconnecting
      const userId = localStorage.getItem("userId");
      if (userId) {
        // Update local state
        setUserOffline(userId);
        updateLastSeen(userId);

        // Broadcast offline status to other users if still connected
        if (socket.connected) {
          debugLog(`Setting user ${userId} as offline before disconnecting`);
          socket.emit("user offline", { userId });
        }
      }

      // Error events
      socket.off("error");

      // Disconnect socket
      debugLog("Disconnecting socket");
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSocketConnection]);

  // Join a chat room - improved to handle message state properly and prevent duplicate joins
  const joinChat = useCallback(
    (chatId) => {
      if (!chatId) {
        debugLog("Cannot join chat room: invalid chat ID");
        return;
      }

      // Check if we're already in this chat room to prevent duplicate join events
      if (currentChatIdRef.current === chatId && isRoomJoined(chatId)) {
        debugLog(`Already in chat room ${chatId}`);

        // Even if we're already in the room, verify connection to the room
        if (socketRef.current && socketRef.current.connected) {
          debugLog(`Verifying connection to chat room ${chatId}`);
          // Emit a ready event to let the server know we're ready to receive messages
          socketRef.current.emit("ready", { chatId });
        }
        return;
      }

      debugLog(`Joining chat room ${chatId}`);

      // Update both state and ref for current chat ID immediately
      // This ensures we have the current chat ID set even if the socket isn't connected yet
      setCurrentChatId(chatId);
      currentChatIdRef.current = chatId;

      // Clear messages when joining a new chat to avoid showing messages from previous chat
      setMessages([]);

      // Initialize socket if it doesn't exist
      if (!socketRef.current) {
        debugLog("No socket connection exists, creating one...");
        const socket = createSocketConnection();

        if (!socket) {
          console.error("Failed to create socket connection");
          return;
        }

        // Set up event handlers for the new socket
        socket.on("connect", () => {
          debugLog(`Socket connected, joining chat room ${chatId}`);
          setConnected(true);
          setConnectionStatus('connected');

          // Join the chat room now that we're connected
          socket.emit("join room", chatId);
          trackRoomJoin(chatId);

          // Emit a ready event to let the server know we're ready to receive messages
          setTimeout(() => {
            if (socketRef.current && socketRef.current.connected) {
              debugLog(`Emitting ready event for chat ${chatId}`);
              socketRef.current.emit("ready", { chatId });
            }
          }, 300);

          // Only show success toast if we're in the chat section and not in silent mode
          if (window.location.pathname.includes('/messages') && !silentMode) {
            toast.success("Connected to chat server");
          }
        });

        // Store the socket in the ref
        socketRef.current = socket;
        return;
      }

      // If we have a socket, handle the chat room joining

      // If we're in a different chat room, leave it first
      if (socketRef.current.connected) {
        const previousChatId = currentChatIdRef.current;
        if (previousChatId && previousChatId !== chatId) {
          debugLog(`Leaving previous chat room ${previousChatId} due to chat change or unmount`);
          socketRef.current.emit("leave room", previousChatId);
          trackRoomLeave(previousChatId);

          // Also notify the server that we're leaving this chat
          debugLog(`Notifying server that we're leaving chat ${previousChatId}`);
          socketRef.current.emit("leave chat", { chatId: previousChatId });
        }

        // Join the new chat room
        debugLog(`Emitting join room event for ${chatId}`);
        socketRef.current.emit("join room", chatId);
        trackRoomJoin(chatId);

        // Emit a ready event to let the server know we're ready to receive messages
        // This can help with ensuring we get the latest messages
        setTimeout(() => {
          if (socketRef.current && socketRef.current.connected) {
            debugLog(`Emitting ready event for chat ${chatId}`);
            socketRef.current.emit("ready", { chatId });
          }
        }, 300);
      } else {
        // Socket exists but is not connected
        debugLog("Socket exists but not connected, attempting to reconnect...");
        setConnectionStatus('connecting');

        // Connect the socket
        socketRef.current.connect();

        // Set up a one-time connect handler to join the room when connected
        socketRef.current.once("connect", () => {
          debugLog(`Socket reconnected, joining chat room ${chatId}`);
          socketRef.current.emit("join room", chatId);
          trackRoomJoin(chatId);
          setConnected(true);
          setConnectionStatus('connected');

          // Emit a ready event after a short delay
          setTimeout(() => {
            if (socketRef.current && socketRef.current.connected) {
              debugLog(`Emitting ready event for chat ${chatId} after reconnection`);
              socketRef.current.emit("ready", { chatId });
            }
          }, 300);

          // Only show success toast if we're in the chat section and not in silent mode
          if (window.location.pathname.includes('/messages') && !silentMode) {
            toast.success("Reconnected to chat server");
          }
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createSocketConnection] // Include createSocketConnection to ensure we use the correct socket creation function
  );

  // Leave a chat room
  const leaveChat = useCallback(
    (chatId) => {
      if (socketRef.current && chatId) {
        // Use only the event name that matches the backend
        debugLog(`Leaving chat room: ${chatId} on component unmount`);
        socketRef.current.emit("leave room", chatId);

        // Track the room leave
        trackRoomLeave(chatId);

        // Also notify the server that we're leaving this chat
        debugLog(`Notifying server that we're leaving chat ${chatId}`);
        socketRef.current.emit("leave chat", { chatId });

        // Clean up message event handlers for this chat
        debugLog(`Cleaning up message event handlers for chat ${chatId}`);

        // Update current chat ID if we're leaving the current chat
        if (currentChatIdRef.current === chatId) {
          setCurrentChatId(null);
          currentChatIdRef.current = null;
        }
      } else if (!chatId && window.location.pathname !== '/login') {
        // Only show error if not on login page
        debugLog("Cannot leave chat: invalid chat ID");
        toast.error("Cannot leave chat: invalid chat ID");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Remove all dependencies to prevent unnecessary re-renders
  );

  // Send a message
  const sendMessage = useCallback(
    (messageData) => {
      if (!messageData.chatId && !currentChatIdRef.current) {
        toast.error("Cannot send message: no chat selected");
        return;
      }

      const chatId = messageData.chatId || currentChatIdRef.current;
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");

      if (!userId) {
        // Don't show error toast when not logged in
        return;
      }

      if (!messageData.content || !messageData.content.trim()) {
        toast.warning("Cannot send empty message");
        return;
      }

      try {
        console.log(`Sending message to chat ${chatId}: ${messageData.content.trim().substring(0, 20)}...`);

        // Track this message to prevent duplication when it comes back from the server
        const trackingKey = `${messageData.content.trim()}-${Date.now()}`;

        // Update both state and ref for recently sent messages
        setRecentlySentMessages((prev) => {
          const updated = {
            ...prev,
            [trackingKey]: true, // Track by content+timestamp
          };

          // Also track by local message ID if provided
          if (messageData.localMessageId) {
            updated[messageData.localMessageId] = true;
          }

          // Update ref to match state
          recentlySentMessagesRef.current = updated;
          return updated;
        });

        // Clean up tracking after 10 seconds
        setTimeout(() => {
          setRecentlySentMessages((prev) => {
            const updated = { ...prev };
            delete updated[trackingKey];

            // Also remove local message ID tracking if provided
            if (messageData.localMessageId) {
              delete updated[messageData.localMessageId];
            }

            // Update ref to match state
            recentlySentMessagesRef.current = updated;
            return updated;
          });
        }, 10000);

        // Prepare the message payload according to the backend's expected format
        const messagePayload = {
          content: messageData.content.trim(),
          chat: chatId, // This is what the backend expects
          localMessageId: messageData.localMessageId // Include local message ID if provided
        };

        // Initialize socket if it doesn't exist
        if (!socketRef.current) {
          console.log("No socket connection exists, creating one before sending message...");
          const socket = createSocketConnection();

          if (!socket) {
            console.error("Failed to create socket connection");
            toast.error("Failed to connect to chat server");
            return;
          }

          // Set up event handlers for the new socket
          socket.on("connect", () => {
            console.log(`Socket connected, joining chat room ${chatId} before sending message`);
            setConnected(true);
            setConnectionStatus('connected');

            // Join the chat room first
            socket.emit("join room", chatId);

            // Then send the message
            console.log("Sending message after connection established");
            socket.emit("new message", messagePayload, (response) => {
              if (response && !response.success) {
                console.warn("Message delivery failed:", response);
                toast.warning("Message may not have been delivered. Please check your connection.");

                // Show error toast
                toast.error("Failed to send message");
              } else {
                // Message sent successfully
                console.log("Message sent successfully");
              }
            });
          });

          // Store the socket in the ref
          socketRef.current = socket;
          return;
        }

        // If socket exists but is not connected, try to reconnect or queue the message
        if (!socketRef.current.connected) {
          console.log("Socket exists but not connected, attempting to reconnect...");
          setConnectionStatus('connecting');

          // Add message to offline queue
          console.log("Adding message to offline queue");
          // Use the local message ID if provided, otherwise generate a new one
          const messageId = messageData.localMessageId || `generated-${Date.now()}`;
          const queuedMessage = {
            _id: messageId,
            id: messageId,
            content: messageData.content.trim(),
            chat: chatId,
            chatId: chatId,
            sender: {
              _id: userId,
              id: userId,
              username,
            },
            createdAt: new Date().toISOString()
          };

          addToOfflineQueue(queuedMessage);

          // Show toast notification for queued message
          console.log("Message will be sent when connection is restored");

          // Show toast notification
          toast.info("Message saved to offline queue. It will be sent when connection is restored.", {
            autoClose: 3000
          });

          // Try to reconnect
          socketRef.current.connect();

          // Set up a one-time connect handler to process the queue when connected
          socketRef.current.once("connect", () => {
            console.log(`Socket reconnected, joining chat room ${chatId}`);
            setConnected(true);
            setConnectionStatus('connected');

            // Join the chat room first
            socketRef.current.emit("join room", chatId);

            // Process the offline queue
            const queue = getOfflineQueue();
            if (queue.length > 0) {
              console.log(`Processing ${queue.length} messages from offline queue after reconnection`);
              // No toast notification for queued messages - handled silently

              // The queue will be processed by the connect event handler
            }
          });

          return;
        }

        // If we get here, socket exists and is connected
        // Make sure we're in the right chat room
        if (currentChatIdRef.current !== chatId) {
          console.log(`Joining chat room ${chatId} before sending message`);
          socketRef.current.emit("join room", chatId);
          currentChatIdRef.current = chatId;
          setCurrentChatId(chatId);
        }

        // Send message with callback to handle acknowledgement
        console.log("Sending message to connected socket");
        socketRef.current.emit("new message", messagePayload, (response) => {
          if (response && !response.success) {
            console.warn("Message delivery failed:", response);
            toast.warning("Message may not have been delivered. Please check your connection.");

            // Show error toast
            toast.error("Failed to send message");
          } else {
            // Message sent successfully
            console.log("Message sent successfully");
          }
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        // Always show error toasts, even in silent mode, but only if we're in the chat section
        if (window.location.pathname.includes('/messages')) {
          toast.error("Failed to send message");
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createSocketConnection] // Include createSocketConnection to ensure we use the correct socket creation function
  );

  // Send typing indicator
  const sendTyping = useCallback(
    (isTyping, chatId) => {
      // Use provided chatId or fall back to currentChatIdRef
      const roomId = chatId || currentChatIdRef.current;

      // Check if we have a valid chat ID
      if (!roomId) {
        console.warn("Cannot send typing indicator: no chat selected");
        return;
      }

      // Get user info
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");

      if (!userId || !username) {
        // Don't show error toast when not logged in
        return;
      }

      // Prepare the payload according to the backend's expected format
      const payload = {
        roomId: roomId, // Backend expects roomId
        chatId: roomId, // Some backends expect chatId
        userId: userId, // Include userId for identification
        username: username, // Include username for display
        isTyping: isTyping, // Backend expects isTyping boolean
      };

      // Initialize socket if it doesn't exist
      if (!socketRef.current) {
        console.log("No socket connection exists, creating one before sending typing indicator...");
        const socket = createSocketConnection();

        if (!socket) {
          console.error("Failed to create socket connection");
          return;
        }

        // Set up event handlers for the new socket
        socket.on("connect", () => {
          console.log(`Socket connected, joining chat room ${roomId} before sending typing indicator`);
          setConnected(true);
          setConnectionStatus('connected');

          // Join the chat room first
          socket.emit("join room", roomId);

          // Then send the typing indicator
          console.log(`Sending typing indicator (isTyping=${isTyping}) after connection established`);
          socket.emit("typing", payload);
        });

        // Store the socket in the ref
        socketRef.current = socket;
        return;
      }

      // If socket exists but is not connected, reconnect it
      if (!socketRef.current.connected) {
        console.log("Socket exists but not connected, reconnecting before sending typing indicator...");
        setConnectionStatus('connecting');

        // Connect the socket
        socketRef.current.connect();

        // Set up a one-time connect handler to send typing indicator when connected
        socketRef.current.once("connect", () => {
          console.log(`Socket reconnected, joining chat room ${roomId} before sending typing indicator`);
          setConnected(true);
          setConnectionStatus('connected');

          // Join the chat room first
          socketRef.current.emit("join room", roomId);

          // Then send the typing indicator
          console.log(`Sending typing indicator (isTyping=${isTyping}) after reconnection`);
          socketRef.current.emit("typing", payload);
        });

        return;
      }

      // If we get here, socket exists and is connected
      // Make sure we're in the right chat room
      if (currentChatIdRef.current !== roomId) {
        console.log(`Joining chat room ${roomId} before sending typing indicator`);
        socketRef.current.emit("join room", roomId);
        currentChatIdRef.current = roomId;
        setCurrentChatId(roomId);
      }

      // Send typing event using the backend's expected event name
      const eventName = isTyping ? "typing" : "stop typing";
      console.log(`Sending ${eventName} event to room ${roomId}`);

      // Try both event formats that might be used by different backends
      socketRef.current.emit("typing", payload);
      socketRef.current.emit(eventName, payload);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createSocketConnection] // Include createSocketConnection to ensure we use the correct socket creation function
  );

  // Subscribe to an event
  const subscribe = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);

      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, callback);
        }
      };
    }
    return () => {};
  }, []);

  // Reconnect socket manually
  const reconnect = useCallback(() => {
    console.log("Manual reconnection attempt initiated");

    // If socket exists, try to reconnect it
    if (socketRef.current) {
      console.log("Reconnecting existing socket...");
      setConnectionStatus('connecting');
      socketRef.current.connect();

      // Set up a one-time connect handler to confirm reconnection
      socketRef.current.once("connect", () => {
        console.log("Socket reconnected successfully");
        setConnected(true);
        setConnectionStatus('connected');
        setError(null);

        // Rejoin current chat if any
        if (currentChatIdRef.current) {
          console.log(`Rejoining chat room ${currentChatIdRef.current} after manual reconnection`);
          socketRef.current.emit("join room", currentChatIdRef.current);
        }

        // No toast notification for reconnection - handled silently
      });

      return true;
    }

    // If no socket exists, create a new one
    console.log("No socket exists, creating new connection...");
    const socket = createSocketConnection();

    if (!socket) {
      console.error("Failed to create socket connection");
      return false;
    }

    // Set up event handlers for the new socket
    socket.on("connect", () => {
      console.log("New socket connection established");
      setConnected(true);
      setConnectionStatus('connected');
      setError(null);

      // Rejoin current chat if any
      if (currentChatIdRef.current) {
        console.log(`Joining chat room ${currentChatIdRef.current} after new connection`);
        socket.emit("join room", currentChatIdRef.current);
      }

      // Show success toast if we're in the chat section and not in silent mode
      if (window.location.pathname.includes('/messages') && !silentMode) {
        toast.success("Connected to chat server");
      }
    });

    // Store the socket in the ref
    socketRef.current = socket;
    return true;
  }, [createSocketConnection, silentMode]);

  // Get the socket instance (for direct access if needed)
  const getSocket = useCallback(() => socketRef.current, []);

  return {
    // Connection state
    connected,
    connectionStatus,
    error,
    reconnectAttempts,

    // Chat state
    messages,
    setMessages,
    currentChatId,
    typingUsers,

    // User presence state
    onlineUsers,
    lastSeenTimes,
    isUserOnline: (userId) => {
      // Check if the user is in the onlineUsers state
      return !!onlineUsers[userId]?.online;
    },
    getLastSeen: (userId) => lastSeenTimes[userId] || null,
    formatLastSeen: (timestamp) => {
      if (!timestamp) return "Offline";
      const date = new Date(timestamp);
      return `Last seen ${date.toLocaleString()}`;
    },

    // Socket methods
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    subscribe,
    reconnect,
    getSocket,

    // Direct socket access (use with caution)
    socket: socketRef.current,
  };
};
