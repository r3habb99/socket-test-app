import { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { toast } from "react-toastify";

/**
 * Custom hook for socket.io functionality
 * @param {string} url - Socket server URL
 * @returns {Object} Socket methods and state
 */
export const useSocket = (
  url = process.env.REACT_APP_SOCKET_URL || "http://localhost:8080"
) => {
  // Use a consistent URL to prevent reconnection issues
  url = "http://localhost:8080";

  // Log the socket URL being used
  console.log("Socket URL:", url);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [recentlySentMessages, setRecentlySentMessages] = useState({});

  // Use refs to track state without causing re-renders
  const socketRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const recentlySentMessagesRef = useRef({});

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

  // Initialize socket connection
  useEffect(() => {
    // Check if socket is already initialized
    if (socketRef.current) {
      console.log("Socket already initialized, skipping initialization");
      return;
    }

    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");

    if (!userId || !username) {
      console.warn("Cannot initialize socket: missing userId or username");
      setError("User information required");
      return;
    }

    console.log(`Initializing socket for user: ${userId} (${username})`);

    // Create socket instance with user info - using a simpler configuration
    const socket = io(url, {
      auth: {
        userId, // Required by backend
        username,
        token: localStorage.getItem("token"), // Add token for authentication
      },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true, // Connect automatically
      transports: ["polling", "websocket"], // Try polling first, then websocket
      withCredentials: true, // Enable CORS credentials
      forceNew: false, // Reuse existing connections
      multiplex: true, // Enable multiplexing
    });

    // Log connection attempt
    console.log(
      `Attempting to connect to socket server at ${url} with userId: ${userId}`
    );

    // Log authentication data
    console.log("Socket auth data:", {
      userId,
      username,
      token: localStorage.getItem("token") ? "Token exists" : "No token",
    });

    // Set up event listeners

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setConnected(false);
      setError(err.message);
      toast.error(`Connection error: ${err.message}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setConnected(false);

      // Let Socket.IO handle reconnection automatically
      if (
        reason === "io server disconnect" ||
        reason === "transport close" ||
        reason === "transport error"
      ) {
        console.log("Socket.IO will attempt to reconnect automatically");

        // Simple reconnection attempt after a short delay
        setTimeout(() => {
          if (!socket.connected) {
            console.log("Attempting manual reconnect...");
            socket.connect();
          }
        }, 2000);
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      toast.success("Reconnected to chat server");

      // Rejoin current chat if any - use ref instead of state
      if (currentChatIdRef.current) {
        console.log(
          `Rejoining chat room ${currentChatIdRef.current} after reconnection`
        );
        socket.emit("join room", currentChatIdRef.current);

        // Fetch messages again to ensure we have the latest
        // This will be handled by the Chat component when it detects reconnection
      }
    });

    // Also handle the connect event to join the current chat
    socket.on("connect", () => {
      console.log("Socket connected successfully");
      setConnected(true);
      setError(null);

      // Join current chat if any - use ref instead of state
      if (currentChatIdRef.current) {
        console.log(
          `Joining chat room ${currentChatIdRef.current} after connection`
        );
        socket.emit("join room", currentChatIdRef.current);
      }
    });

    // Message received handlers - listen for both event names
    const messageReceivedHandler = (newMessage) => {
      console.log("📥 Message received:", newMessage);

      // Normalize chat ID (might be an object or a string)
      const messageChat =
        typeof newMessage.chat === "object"
          ? newMessage.chat._id || newMessage.chat.id
          : newMessage.chat || newMessage.chatId; // Also check for chatId

      // Get message ID (might be _id or id)
      const messageId = newMessage._id || newMessage.id;

      // Get message content
      const messageContent = newMessage.content;

      // Get sender ID (might be _id or id or an object with _id/id)
      const senderId =
        typeof newMessage.sender === "object"
          ? newMessage.sender._id || newMessage.sender.id
          : newMessage.sender;

      // Check if this is a message we just sent (to avoid duplicates)
      // Use the ref for recentlySentMessages to avoid dependency on state
      const isRecentlySentMessage =
        recentlySentMessagesRef.current[messageId] ||
        Object.keys(recentlySentMessagesRef.current).some((key) =>
          key.startsWith(`${messageContent}-`)
        );

      if (isRecentlySentMessage) {
        console.log(
          "Received confirmation for message we just sent:",
          messageId
        );

        // Replace any temporary message with the real one
        setMessages((prevMessages) => {
          // Find any temporary messages that match this content
          const tempMessage = prevMessages.find(
            (msg) =>
              msg.isTemp &&
              msg.content === messageContent &&
              (msg.sender._id === senderId || msg.sender.id === senderId)
          );

          if (tempMessage) {
            console.log(
              "Replacing temporary message with real message:",
              tempMessage._id
            );
            return prevMessages.map((msg) =>
              msg._id === tempMessage._id ? newMessage : msg
            );
          }

          // If no temp message found, just return the current messages
          return prevMessages;
        });

        return;
      }

      // Process messages for the current chat - use ref for currentChatId
      if (messageChat === currentChatIdRef.current) {
        setMessages((prevMessages) => {
          // Check if message already exists to avoid duplicates
          const exists = prevMessages.some(
            (msg) => (msg._id || msg.id) === messageId
          );

          if (exists) {
            console.log(
              "Message already exists in the list, not adding again:",
              messageId
            );
            return prevMessages;
          }

          console.log("Adding new message to the list:", messageId);

          // Add the new message and ensure it's at the end (newest messages at the bottom)
          const updatedMessages = [...prevMessages, newMessage];

          // Sort messages by timestamp if available
          if (updatedMessages.length > 0 && updatedMessages[0].createdAt) {
            return updatedMessages.sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          }

          return updatedMessages;
        });

        // Force a notification for new messages from other users
        if (senderId !== localStorage.getItem("userId")) {
          toast.info(
            `New message from ${newMessage.sender?.username || "User"}`
          );
        }
      }
    };

    // Register the handler for both possible event names
    socket.on("message received", messageReceivedHandler);
    socket.on("new message", messageReceivedHandler);

    // User typing handlers
    const typingHandler = (data) => {
      console.log("✍️ User typing:", data);
      setTypingUsers((prev) => ({
        ...prev,
        [data.userId]: {
          username: data.username || "User",
          timestamp: new Date(data.timestamp || Date.now()),
        },
      }));
    };

    // Register for both possible event names
    socket.on("user typing", typingHandler);
    socket.on("typing", typingHandler);

    // User stopped typing handlers
    const stoppedTypingHandler = (data) => {
      console.log("✋ User stopped typing:", data);
      setTypingUsers((prev) => {
        const newTypingUsers = { ...prev };
        delete newTypingUsers[data.userId];
        return newTypingUsers;
      });
    };

    // Register for both possible event names
    socket.on("user stopped typing", stoppedTypingHandler);
    socket.on("stop typing", stoppedTypingHandler);

    // Store socket instance in ref
    socketRef.current = socket;

    // Clean up on unmount
    return () => {
      console.log("Disconnecting socket");

      // Leave current chat room if any - use ref instead of state
      if (currentChatIdRef.current && socket.connected) {
        console.log(
          `Leaving chat room ${currentChatIdRef.current} before disconnecting`
        );
        socket.emit("leave room", currentChatIdRef.current);
      }

      // Remove all event listeners
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("reconnect");

      // Message events
      socket.off("message received", messageReceivedHandler);
      socket.off("new message", messageReceivedHandler);

      // Typing events
      socket.off("user typing", typingHandler);
      socket.off("typing", typingHandler);
      socket.off("user stopped typing", stoppedTypingHandler);
      socket.off("stop typing", stoppedTypingHandler);

      // Additional events
      socket.off("user joined");
      socket.off("user left");
      socket.off("message delivered");
      socket.off("message read confirmation");
      socket.off("messages bulk read");
      socket.off("user online");
      socket.off("user offline");
      socket.off("error");

      // Disconnect socket
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // Include url in dependencies to ensure correct socket server is used

  // Join a chat room
  const joinChat = useCallback(
    (chatId) => {
      if (!chatId) {
        console.warn("Cannot join chat room: invalid chat ID");
        return;
      }

      // Check if we're already in this chat room to prevent duplicate join events
      if (currentChatIdRef.current === chatId) {
        console.log("Already in chat room:", chatId);
        return;
      }

      if (socketRef.current) {
        // If we're in a different chat room, leave it first
        if (currentChatIdRef.current) {
          console.log(
            `Leaving previous chat room: ${currentChatIdRef.current}`
          );
          socketRef.current.emit("leave room", currentChatIdRef.current);
        }

        // Update both state and ref for current chat ID
        setCurrentChatId(chatId);
        currentChatIdRef.current = chatId;

        // Clear messages when joining a new chat
        setMessages([]);

        // Check connection status
        if (connected) {
          console.log("Joining chat room:", chatId);

          // Use only the event name that matches the backend
          socketRef.current.emit("join room", chatId);

          // Log success
          console.log(`Successfully joined chat room: ${chatId}`);
        } else {
          console.warn("Socket not connected, will join room when connected");

          // Connect the socket if not connected
          socketRef.current.connect();

          // The reconnect event handler will join the room when connected
        }
      } else {
        console.warn("Socket not initialized");
        toast.warning("Chat service not initialized. Please refresh the page.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Remove all dependencies to prevent unnecessary re-renders
  );

  // Leave a chat room
  const leaveChat = useCallback(
    (chatId) => {
      if (socketRef.current && chatId) {
        console.log("Leaving chat room:", chatId);

        // Use only the event name that matches the backend
        socketRef.current.emit("leave room", chatId);

        // Update current chat ID if we're leaving the current chat
        if (currentChatIdRef.current === chatId) {
          setCurrentChatId(null);
          currentChatIdRef.current = null;
          console.log(`Successfully left chat room: ${chatId}`);
        }
      } else if (!chatId) {
        console.warn("Cannot leave chat: invalid chat ID");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Remove all dependencies to prevent unnecessary re-renders
  );

  // Send a message
  const sendMessage = useCallback(
    (messageData) => {
      if (!messageData.chatId && !currentChatIdRef.current) {
        console.warn("Cannot send message: no chat ID");
        return;
      }

      const chatId = messageData.chatId || currentChatIdRef.current;
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");

      if (!userId) {
        console.warn("Cannot send message: no user ID");
        return;
      }

      if (!messageData.content || !messageData.content.trim()) {
        console.warn("Cannot send message: empty message");
        return;
      }

      try {
        console.log("📤 Sending message:", messageData.content);

        // Create a temporary message for immediate display
        const tempMessage = {
          _id: `temp-${Date.now()}`,
          id: `temp-${Date.now()}`,
          content: messageData.content.trim(),
          sender: {
            _id: userId,
            id: userId,
            username,
          },
          chat: chatId,
          createdAt: new Date().toISOString(),
          isTemp: true,
        };

        // Add the temporary message to the UI immediately
        setMessages((prev) => {
          // Sort messages by timestamp if available
          const updatedMessages = [...prev, tempMessage];
          if (updatedMessages.length > 0 && updatedMessages[0].createdAt) {
            return updatedMessages.sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          }
          return updatedMessages;
        });

        // Track this message to prevent duplication when it comes back from the server
        const tempId = tempMessage._id;
        const trackingKey = `${messageData.content.trim()}-${Date.now()}`;

        // Update both state and ref for recently sent messages
        setRecentlySentMessages((prev) => {
          const updated = {
            ...prev,
            [tempId]: true,
            [trackingKey]: true, // Also track by content+timestamp as fallback
          };
          // Update ref to match state
          recentlySentMessagesRef.current = updated;
          return updated;
        });

        // Clean up tracking after 10 seconds
        setTimeout(() => {
          setRecentlySentMessages((prev) => {
            const updated = { ...prev };
            delete updated[tempId];
            delete updated[trackingKey];
            // Update ref to match state
            recentlySentMessagesRef.current = updated;
            return updated;
          });
        }, 10000);

        if (socketRef.current && connected) {
          // Send via socket - format to match backend expectations
          const messagePayload = {
            content: messageData.content.trim(),
            chat: chatId, // This is what the backend expects
            sender: userId,
          };

          console.log("Sending message payload:", messagePayload);

          // Send message with callback to handle acknowledgement
          socketRef.current.emit("new message", messagePayload, (response) => {
            console.log("Message send acknowledgement:", response);
            if (response && !response.success) {
              toast.warning(
                "Message may not have been delivered. Please check your connection."
              );
            } else {
              console.log("Message delivered successfully");
            }
          });
        } else {
          // If socket is not connected, show an error
          console.error("Socket not connected, cannot send message");
          toast.error("Not connected to chat server. Please try again.");

          // Remove the temporary message
          setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      }
    },
    [connected, setMessages, setRecentlySentMessages] // Remove currentChatId from dependencies
  );

  // Send typing indicator
  const sendTyping = useCallback(
    (isTyping) => {
      if (!currentChatIdRef.current || !socketRef.current || !connected) return;

      // Get user info
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");

      console.log(
        `Sending ${
          isTyping ? "typing" : "stopped typing"
        } indicator for chat: ${currentChatIdRef.current}`
      );

      // Use the event name that matches the backend
      const payload = {
        roomId: currentChatIdRef.current, // Backend expects roomId
        isTyping: isTyping, // Backend expects isTyping boolean
        userId,
        username,
        timestamp: Date.now(),
      };

      // Send typing event
      socketRef.current.emit("typing", payload);
    },
    [connected] // Remove currentChatId from dependencies
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
    if (socketRef.current) {
      console.log("Attempting to reconnect socket");
      socketRef.current.connect();
      return true;
    }
    return false;
  }, []);

  return {
    connected,
    error,
    messages,
    setMessages,
    currentChatId,
    typingUsers,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    subscribe,
    reconnect,
  };
};
