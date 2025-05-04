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

      // If socket exists but is not connected, try to connect it
      if (socketRef.current && !socketRef.current.connected) {
        console.log("Socket exists but not connected, attempting to connect");
        socketRef.current.connect();
      }

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
      reconnectionAttempts: 5, // Increased from 3
      reconnectionDelay: 1000,
      timeout: 20000, // Increased from 10000
      autoConnect: true, // Connect automatically
      transports: ["websocket", "polling"], // Try websocket first, then polling
      withCredentials: true, // Enable CORS credentials
      forceNew: false, // Reuse existing connections
      multiplex: true, // Enable multiplexing
    });

    // Log connection status
    console.log(
      "Socket connection status:",
      socket.connected ? "Connected" : "Disconnected"
    );

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

    // Message received handler - updated to match backend event
    const messageReceivedHandler = (newMessage) => {
      console.log("📥 Message received:", newMessage);

      // Enhanced logging to debug message structure
      console.log("Message structure:", {
        id: newMessage._id || newMessage.id,
        content: newMessage.content,
        sender: newMessage.sender,
        chat: newMessage.chat,
        timestamp: newMessage.createdAt,
      });

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

      console.log(
        `Message for chat: ${messageChat}, current chat: ${currentChatIdRef.current}`
      );

      // IMPORTANT: Make sure we're in the right chat room
      // If this message is for a chat we're not currently in, join that chat room
      if (
        messageChat &&
        messageChat !== currentChatIdRef.current &&
        socketRef.current
      ) {
        console.log(
          `Message is for chat ${messageChat} but we're in ${
            currentChatIdRef.current || "no chat"
          }`
        );

        // We don't want to automatically switch chats, but we do want to make sure
        // we're joined to the chat room to receive future messages
        if (socketRef.current.connected) {
          console.log(
            `Joining chat room ${messageChat} to receive future messages`
          );
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

          // If no temp message found, just add the message to avoid missing it
          console.log("No temp message found, adding as new message");
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
          console.log(
            "Message already exists in the list, not adding again:",
            messageId
          );
          return prevMessages;
        }

        // Only add the message if it's for the current chat
        if (messageChat === currentChatIdRef.current) {
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
            // This will be handled by the component that uses this hook
            console.log("Notification clicked for chat:", messageChat);

            // If we have a socket and the message is for a different chat,
            // we could potentially switch to that chat here
            if (socketRef.current && messageChat !== currentChatIdRef.current) {
              console.log(`User clicked notification for chat ${messageChat}`);
              // We don't automatically switch chats here, but we could expose
              // this functionality to the component that uses this hook

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
      console.log("✍️ User typing:", data);

      // Enhanced logging to debug typing data
      console.log("Typing data structure:", data);

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

        console.log(
          `User ${data.username} (${data.userId}) is typing in room ${roomId}`
        );
      }
    };

    // User stopped typing handler
    const userStoppedTypingHandler = (data) => {
      console.log("✋ User stopped typing:", data);

      // Extract the chat/room ID from the data
      const roomId = data.roomId || data.chatId;

      // Only process typing events for the current chat
      if (roomId === currentChatIdRef.current) {
        setTypingUsers((prev) => {
          const newTypingUsers = { ...prev };
          delete newTypingUsers[data.userId];
          console.log(
            `User ${data.username} (${data.userId}) stopped typing in room ${roomId}`
          );
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
        console.log("Already in chat room:", chatId);
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
        console.log("Socket not initialized, creating new socket connection");

        const userId = localStorage.getItem("userId");
        const username = localStorage.getItem("username");

        if (!userId || !username) {
          console.warn("Cannot initialize socket: missing user info");
          toast.error("User information required to connect to chat");
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
          console.log("Socket connected successfully");
          setConnected(true);

          // Join the chat room now that we're connected
          console.log(`Joining chat room ${chatId} after connection`);
          newSocket.emit("join room", chatId);
        });

        // Store the socket in the ref
        socketRef.current = newSocket;

        return;
      }

      // If we have a socket, handle the chat room joining

      // If we're in a different chat room, leave it first
      if (currentChatIdRef.current !== chatId && socketRef.current.connected) {
        console.log(`Leaving previous chat room: ${currentChatIdRef.current}`);
        socketRef.current.emit("leave room", currentChatIdRef.current);
      }

      // Check connection status
      if (socketRef.current.connected) {
        console.log("Joining chat room:", chatId);

        // Use only the event name that matches the backend
        socketRef.current.emit("join room", chatId);

        // Log success
        console.log(`Successfully joined chat room: ${chatId}`);
      } else {
        console.warn("Socket not connected, attempting to connect");

        // Connect the socket if not connected
        socketRef.current.connect();

        // Set up a one-time connect handler to join the room when connected
        socketRef.current.once("connect", () => {
          console.log(`Socket connected, now joining room: ${chatId}`);
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

        // Prepare the message payload according to the backend's expected format
        const messagePayload = {
          content: messageData.content.trim(),
          chat: chatId, // This is what the backend expects
        };

        // Check if socket exists
        if (!socketRef.current) {
          console.log(
            "Socket not initialized, creating new socket connection for sending message"
          );

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
            console.log("Socket connected successfully for sending message");
            setConnected(true);

            // Join the chat room now that we're connected
            console.log(
              `Joining chat room ${chatId} after connection for sending message`
            );
            newSocket.emit("join room", chatId);

            // Send the message now that we're connected
            console.log("Now sending message:", messagePayload);
            newSocket.emit("new message", messagePayload, (response) => {
              console.log("Message send acknowledgement:", response);
              if (response && !response.success) {
                toast.warning(
                  "Message may not have been delivered. Please check your connection."
                );
              } else {
                console.log("Message delivered successfully");
              }
            });
          });

          // Store the socket in the ref
          socketRef.current = newSocket;
          return;
        }

        // If socket exists but is not connected, connect it
        if (socketRef.current && !socketRef.current.connected) {
          console.log(
            "Socket exists but not connected, connecting for sending message"
          );

          // Connect the socket
          socketRef.current.connect();

          // Set up a one-time connect handler to send message when connected
          socketRef.current.once("connect", () => {
            console.log("Socket connected, now sending message");

            // Join the chat room first
            socketRef.current.emit("join room", chatId);

            // Then send the message
            socketRef.current.emit(
              "new message",
              messagePayload,
              (response) => {
                console.log("Message send acknowledgement:", response);
                if (response && !response.success) {
                  toast.warning(
                    "Message may not have been delivered. Please check your connection."
                  );
                } else {
                  console.log("Message delivered successfully");
                }
              }
            );

            setConnected(true);
          });

          return;
        }

        // If we get here, socket exists and is connected
        console.log("Socket connected, sending message directly");
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
        console.log(
          "Cannot send typing indicator: no chat ID provided or selected"
        );
        return;
      }

      // Get user info
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");

      if (!userId || !username) {
        console.warn("Cannot send typing indicator: missing user info");
        return;
      }

      // Prepare the payload according to the backend's expected format
      const payload = {
        roomId: roomId, // Backend expects roomId
        isTyping: isTyping, // Backend expects isTyping boolean
      };

      console.log(
        `Preparing to send typing indicator: ${
          isTyping ? "typing" : "stopped typing"
        } for room ${roomId}`
      );

      // Check if socket exists
      if (!socketRef.current) {
        console.log(
          "Socket not initialized, creating new socket connection for typing"
        );

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
          console.log("Socket connected successfully for typing");
          setConnected(true);

          // Join the chat room now that we're connected
          console.log(
            `Joining chat room ${roomId} after connection for typing`
          );
          newSocket.emit("join room", roomId);

          // Send the typing indicator now that we're connected
          console.log(
            `Now sending typing indicator: ${
              isTyping ? "typing" : "stopped typing"
            }`
          );
          newSocket.emit("typing", payload);
        });

        // Store the socket in the ref
        socketRef.current = newSocket;
        return;
      }

      // If socket exists but is not connected, connect it
      if (socketRef.current && !socketRef.current.connected) {
        console.log("Socket exists but not connected, connecting for typing");

        // Connect the socket
        socketRef.current.connect();

        // Set up a one-time connect handler to send typing indicator when connected
        socketRef.current.once("connect", () => {
          console.log("Socket connected, now sending typing indicator");
          socketRef.current.emit("typing", payload);
          setConnected(true);
        });

        return;
      }

      // If we get here, socket exists and is connected
      console.log(
        `Sending ${
          isTyping ? "typing" : "stopped typing"
        } indicator for chat: ${roomId}`
      );
      console.log("Sending typing payload:", payload);

      // Send typing event using the backend's expected event name
      socketRef.current.emit("typing", payload);

      // Log confirmation
      console.log(
        `Typing indicator (${
          isTyping ? "typing" : "stopped typing"
        }) sent successfully`
      );
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
