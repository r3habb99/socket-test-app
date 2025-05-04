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
      // If socket exists but is not connected, try to connect it
      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
      return;
    }

    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");

    if (!userId || !username) {
      setError("User information required");
      toast.error("Missing user information. Please log in again.");
      return;
    }

    // Create socket instance with user info - using a simpler configuration
    const socket = io(url, {
      auth: {
        userId, // Required by backend
        username,
        token: localStorage.getItem("token"), // Add token for authentication
      },
      reconnection: true,
      reconnectionAttempts: 5, // Increased from 3
      reconnectionDelay: 1000,
      timeout: 20000, // Increased from 10000
      autoConnect: true, // Connect automatically
      transports: ["websocket", "polling"], // Try websocket first, then polling
      withCredentials: true, // Enable CORS credentials
      forceNew: false, // Reuse existing connections
      multiplex: true, // Enable multiplexing
    });

    // Set up event listeners

    socket.on("connect_error", (err) => {
      setConnected(false);
      setError(err.message);
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);

      // Let Socket.IO handle reconnection automatically
      if (
        reason === "io server disconnect" ||
        reason === "transport close" ||
        reason === "transport error"
      ) {
        // Simple reconnection attempt after a short delay
        setTimeout(() => {
          if (!socket.connected) {
            socket.connect();
          }
        }, 2000);
      }
    });

    socket.on("reconnect", () => {
      setConnected(true);

      // Rejoin current chat if any - use ref instead of state
      if (currentChatIdRef.current) {
        socket.emit("join room", currentChatIdRef.current);
      }
    });

    // Also handle the connect event to join the current chat
    socket.on("connect", () => {
      setConnected(true);
      setError(null);

      // Join current chat if any - use ref instead of state
      if (currentChatIdRef.current) {
        socket.emit("join room", currentChatIdRef.current);
      }
    });

    // Message received handler - updated to match backend event
    const messageReceivedHandler = (newMessage) => {
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
          socketRef.current.emit("join room", messageChat);
        }
      }

      // Check if this is a message we just sent (to avoid duplicates)
      // Use the ref for recentlySentMessages to avoid dependency on state
      const isRecentlySentMessage =
        recentlySentMessagesRef.current[messageId] ||
        Object.keys(recentlySentMessagesRef.current).some((key) =>
          key.startsWith(`${messageContent}-`)
        );

      if (isRecentlySentMessage) {
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
            return prevMessages.map((msg) =>
              msg._id === tempMessage._id ? newMessage : msg
            );
          }

          // If no temp message found, just add the message to avoid missing it
          const updatedMessages = [...prevMessages, newMessage];

          // Sort messages by timestamp if available
          if (updatedMessages.length > 0 && updatedMessages[0].createdAt) {
            return updatedMessages.sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          }

          return updatedMessages;
        });

        return;
      }

      // Process messages for the current chat - use ref for currentChatId
      setMessages((prevMessages) => {
        // Check if message already exists to avoid duplicates
        const exists = prevMessages.some(
          (msg) => (msg._id || msg.id) === messageId
        );

        if (exists) {
          return prevMessages;
        }

        // Only add the message if it's for the current chat
        if (messageChat === currentChatIdRef.current) {
          // Add the new message and ensure it's at the end (newest messages at the bottom)
          const updatedMessages = [...prevMessages, newMessage];

          // Sort messages by timestamp if available
          if (updatedMessages.length > 0 && updatedMessages[0].createdAt) {
            return updatedMessages.sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          }

          return updatedMessages;
        }

        // If the message is not for the current chat, don't add it to the messages list
        return prevMessages;
      });

      // Force a notification for new messages from other users
      // We'll show notifications for ALL messages, even if they're not for the current chat
      if (senderId !== localStorage.getItem("userId")) {
        // Get sender username from the message if available
        const senderUsername =
          typeof newMessage.sender === "object"
            ? newMessage.sender.username
            : "User";

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
    };

    // Register the handler for the backend event name
    socket.on("message received", messageReceivedHandler);

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
        socket.emit("leave room", currentChatIdRef.current);
      }

      // Remove all event listeners
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("reconnect");

      // Message events
      socket.off("message received", messageReceivedHandler);

      // Typing events
      socket.off("user typing", userTypingHandler);
      socket.off("user stopped typing", userStoppedTypingHandler);

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
        return;
      }

      // Update both state and ref for current chat ID immediately
      // This ensures we have the current chat ID set even if the socket isn't connected yet
      setCurrentChatId(chatId);
      currentChatIdRef.current = chatId;

      // Clear messages when joining a new chat
      setMessages([]);

      // Initialize socket if it doesn't exist
      if (!socketRef.current) {
        const userId = localStorage.getItem("userId");
        const username = localStorage.getItem("username");

        if (!userId || !username) {
          return;
        }

        // Create a new socket connection
        const newSocket = io(url, {
          auth: {
            userId,
            username,
            token: localStorage.getItem("token"),
          },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          autoConnect: true,
          transports: ["websocket", "polling"],
          withCredentials: true,
          forceNew: false,
          multiplex: true,
        });

        // Set up basic event handlers
        newSocket.on("connect", () => {
          setConnected(true);
          toast.success("Connected to chat server");

          // Join the chat room now that we're connected
          newSocket.emit("join room", chatId);
        });

        // Store the socket in the ref
        socketRef.current = newSocket;

        return;
      }

      // If we have a socket, handle the chat room joining

      // If we're in a different chat room, leave it first
      if (currentChatIdRef.current !== chatId && socketRef.current.connected) {
        socketRef.current.emit("leave room", currentChatIdRef.current);
      }

      // Check connection status
      if (socketRef.current.connected) {
        // Use only the event name that matches the backend
        socketRef.current.emit("join room", chatId);
      } else {
        // Connect the socket if not connected
        socketRef.current.connect();

        // Set up a one-time connect handler to join the room when connected
        socketRef.current.once("connect", () => {
          socketRef.current.emit("join room", chatId);
          setConnected(true);
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url] // Include url to ensure we use the correct socket server
  );

  // Leave a chat room
  const leaveChat = useCallback(
    (chatId) => {
      if (socketRef.current && chatId) {
        // Use only the event name that matches the backend
        socketRef.current.emit("leave room", chatId);

        // Update current chat ID if we're leaving the current chat
        if (currentChatIdRef.current === chatId) {
          setCurrentChatId(null);
          currentChatIdRef.current = null;
        }
      } else if (!chatId) {
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
        toast.error("Cannot send message: user not logged in");
        return;
      }

      if (!messageData.content || !messageData.content.trim()) {
        toast.warning("Cannot send empty message");
        return;
      }

      try {
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

        // Prepare the message payload according to the backend's expected format
        const messagePayload = {
          content: messageData.content.trim(),
          chat: chatId, // This is what the backend expects
        };

        // Check if socket exists
        if (!socketRef.current) {
          // Create a new socket connection
          const newSocket = io(url, {
            auth: {
              userId,
              username,
              token: localStorage.getItem("token"),
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
            autoConnect: true,
            transports: ["websocket", "polling"],
            withCredentials: true,
            forceNew: false,
            multiplex: true,
          });

          // Set up basic event handlers
          newSocket.on("connect", () => {
            setConnected(true);
            toast.success("Connected to chat server");

            // Join the chat room now that we're connected
            newSocket.emit("join room", chatId);

            // Send the message now that we're connected
            newSocket.emit("new message", messagePayload, (response) => {
              if (response && !response.success) {
                toast.warning(
                  "Message may not have been delivered. Please check your connection."
                );
              } else {
                toast.success("Message sent successfully");
              }
            });
          });

          // Store the socket in the ref
          socketRef.current = newSocket;
          return;
        }

        // If socket exists but is not connected, connect it
        if (socketRef.current && !socketRef.current.connected) {
          // Connect the socket
          socketRef.current.connect();

          // Set up a one-time connect handler to send message when connected
          socketRef.current.once("connect", () => {
            // Join the chat room first
            socketRef.current.emit("join room", chatId);

            // Then send the message
            socketRef.current.emit(
              "new message",
              messagePayload,
              (response) => {
                if (response && !response.success) {
                  toast.warning(
                    "Message may not have been delivered. Please check your connection."
                  );
                } else {
                  toast.success("Message sent successfully");
                }
              }
            );

            setConnected(true);
          });

          return;
        }

        // If we get here, socket exists and is connected
        // Send message with callback to handle acknowledgement
        socketRef.current.emit("new message", messagePayload, (response) => {
          if (response && !response.success) {
            toast.warning(
              "Message may not have been delivered. Please check your connection."
            );
          } else {
            toast.success("Message sent successfully");
          }
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url] // Include url to ensure we use the correct socket server
  );

  // Send typing indicator
  const sendTyping = useCallback(
    (isTyping, chatId) => {
      // Use provided chatId or fall back to currentChatIdRef
      const roomId = chatId || currentChatIdRef.current;

      // Check if we have a valid chat ID
      if (!roomId) {
        return;
      }

      // Get user info
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");

      if (!userId || !username) {
        return;
      }

      // Prepare the payload according to the backend's expected format
      const payload = {
        roomId: roomId, // Backend expects roomId
        isTyping: isTyping, // Backend expects isTyping boolean
      };

      // Check if socket exists
      if (!socketRef.current) {
        // Create a new socket connection
        const newSocket = io(url, {
          auth: {
            userId,
            username,
            token: localStorage.getItem("token"),
          },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          autoConnect: true,
          transports: ["websocket", "polling"],
          withCredentials: true,
          forceNew: false,
          multiplex: true,
        });

        // Set up basic event handlers
        newSocket.on("connect", () => {
          setConnected(true);

          // Join the chat room now that we're connected
          newSocket.emit("join room", roomId);

          // Send the typing indicator now that we're connected
          newSocket.emit("typing", payload);
        });

        // Store the socket in the ref
        socketRef.current = newSocket;
        return;
      }

      // If socket exists but is not connected, connect it
      if (socketRef.current && !socketRef.current.connected) {
        // Connect the socket
        socketRef.current.connect();

        // Set up a one-time connect handler to send typing indicator when connected
        socketRef.current.once("connect", () => {
          socketRef.current.emit("typing", payload);
          setConnected(true);
        });

        return;
      }

      // If we get here, socket exists and is connected
      // Send typing event using the backend's expected event name
      socketRef.current.emit("typing", payload);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url] // Include url to ensure we use the correct socket server
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
