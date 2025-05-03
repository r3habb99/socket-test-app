import React, { useState, useEffect, createContext, useContext } from "react";
import { toast } from "react-toastify";
import {
  initializeSocket,
  getSocket,
  joinChatRoom as joinRoom,
  sendSocketMessage,
  onMessageReceived,
  onMessageDelivered,
  onUserTyping,
  onUserStoppedTyping,
  onMessageReadConfirmation,
  sendTypingIndicator,
  markMessageReadViaSocket,
  disconnectSocket,
} from "../../apis/socket";
import { sendMessage as sendMessageApi } from "../../apis/chat";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  // Add a ref to track recently sent messages to prevent duplicates
  const [recentlySentMessages, setRecentlySentMessages] = useState({});

  // Listen for storage events to update userId and username
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUserId = localStorage.getItem("userId");
      const storedUsername = localStorage.getItem("username");

      if (storedUserId && storedUserId !== userId) {
        console.log("UserId updated from storage:", storedUserId);
        setUserId(storedUserId);
      }

      if (storedUsername && storedUsername !== username) {
        console.log("Username updated from storage:", storedUsername);
        setUsername(storedUsername);
      }
    };

    // Force check localStorage on component mount
    const checkLocalStorage = () => {
      const storedUserId = localStorage.getItem("userId");
      const storedUsername = localStorage.getItem("username");

      console.log("Checking localStorage for user data:", {
        storedUserId,
        storedUsername,
      });

      if (storedUserId) {
        setUserId(storedUserId);
      }

      if (storedUsername) {
        setUsername(storedUsername);
      }
    };

    // Run immediately
    checkLocalStorage();

    // Also listen for storage events
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Initialize socket connection when component mounts
  useEffect(() => {
    if (userId && username) {
      try {
        // Check if we need to initialize the socket
        const socket = getSocket();
        if (!socket) {
          console.log(`Initializing socket for user: ${userId} (${username})`);
          const newSocket = initializeSocket(userId, username);

          if (newSocket) {
            setIsConnected(true);
            console.log(
              `📡 Socket initialized successfully for user: ${userId} (${username})`
            );
          } else {
            console.error("Failed to initialize socket: socket is null");
            toast.error("Failed to connect to chat server");
          }
        } else {
          console.log(
            `Socket already initialized for user: ${userId} (${username})`
          );
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        toast.error("Failed to connect to chat server");
      }
    } else {
      console.warn("Cannot initialize socket: missing userId or username");
      if (!userId) console.warn("Missing userId");
      if (!username) console.warn("Missing username");
    }

    return () => {
      console.log("SocketProvider unmounting, disconnecting socket");
      disconnectSocket();
    };
  }, [userId, username]);

  // Set up event listeners
  useEffect(() => {
    if (!isConnected) {
      console.warn("Cannot set up event listeners: not connected");
      return;
    }

    // Check if socket is initialized
    const socket = getSocket();
    if (!socket) {
      console.error("Cannot set up event listeners: socket is null");
      return;
    }

    console.log("Setting up socket event listeners");

    // Message received handler
    const unsubscribeMessageReceived = onMessageReceived((newMessage) => {
      console.log("📥 Message received:", newMessage);

      // Normalize chat ID (might be an object or a string)
      const messageChat =
        typeof newMessage.chat === "object"
          ? newMessage.chat._id || newMessage.chat.id
          : newMessage.chat;

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
      const isRecentlySentMessage =
        recentlySentMessages[messageId] ||
        Object.keys(recentlySentMessages).some((key) =>
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
              msg.sender._id === senderId
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

      if (messageChat === currentChatId) {
        // Check if this message is already in the messages array
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
          return [...prevMessages, newMessage];
        });

        // Mark message as read automatically if it's not from the current user
        if (senderId !== userId) {
          try {
            console.log("Marking message as read:", messageId);
            markMessageReadViaSocket(messageId, currentChatId);
          } catch (error) {
            console.error("Error marking message as read:", error);
          }
        }
      }
    });

    // Message delivered handler
    const unsubscribeMessageDelivered = onMessageDelivered((data) => {
      console.log("📤 Message delivered:", data);
    });

    // User typing handler
    const unsubscribeUserTyping = onUserTyping((data) => {
      console.log("✍️ User typing:", data);
      setTypingUsers((prev) => ({
        ...prev,
        [data.userId]: {
          username: data.username,
          timestamp: new Date(data.timestamp),
        },
      }));
    });

    // User stopped typing handler
    const unsubscribeUserStoppedTyping = onUserStoppedTyping((data) => {
      console.log("✋ User stopped typing:", data);
      setTypingUsers((prev) => {
        const newTypingUsers = { ...prev };
        delete newTypingUsers[data.userId];
        return newTypingUsers;
      });
    });

    // Message read confirmation handler
    const unsubscribeMessageReadConfirmation = onMessageReadConfirmation(
      (data) => {
        console.log("�️ Message read:", data);
        // You could update the UI to show read receipts here
      }
    );

    return () => {
      unsubscribeMessageReceived();
      unsubscribeMessageDelivered();
      unsubscribeUserTyping();
      unsubscribeUserStoppedTyping();
      unsubscribeMessageReadConfirmation();
    };
  }, [isConnected, currentChatId, userId, recentlySentMessages]);

  // Join chat room
  const joinChatRoom = (chatId) => {
    if (!chatId) {
      console.warn("Cannot join chat room: invalid chat ID");
      return;
    }

    // Don't join the same chat room again
    if (currentChatId === chatId) {
      console.log("Already in chat room:", chatId);
      return;
    }

    // If not connected, try to initialize the socket first
    if (!isConnected) {
      if (userId && username) {
        console.log(
          "Not connected, attempting to initialize socket before joining room"
        );
        try {
          const newSocket = initializeSocket(userId, username);
          if (newSocket) {
            setIsConnected(true);
            console.log(
              `Socket initialized successfully for user: ${userId} (${username})`
            );

            // Now join the room
            console.log("Joining chat room:", chatId);
            joinRoom(chatId);
            setCurrentChatId(chatId);
            console.log("Successfully joined chat room:", chatId);
            return;
          } else {
            console.error("Failed to initialize socket: socket is null");
            toast.error("Failed to connect to chat server");
            return;
          }
        } catch (error) {
          console.error("Failed to initialize socket:", error);
          toast.error("Failed to connect to chat server");
          return;
        }
      } else {
        console.warn(
          "Cannot join chat room: not connected and missing userId or username"
        );
        return;
      }
    }

    console.log("Joining chat room:", chatId);
    joinRoom(chatId);
    setCurrentChatId(chatId);

    // Log success message
    console.log("Successfully joined chat room:", chatId);
  };

  // Handle typing indicator with debounce
  const handleTyping = (isTyping) => {
    if (!currentChatId || !isConnected) return;

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Send typing indicator
    sendTypingIndicator(currentChatId, isTyping);

    // If user is typing, set a timeout to automatically stop typing indicator
    if (isTyping) {
      const timeout = setTimeout(() => {
        sendTypingIndicator(currentChatId, false);
      }, 3000); // 3 seconds
      setTypingTimeout(timeout);
    }
  };

  // Send message
  const sendMessage = async (messageContent) => {
    if (!currentChatId) {
      console.warn("Cannot send message: no chat room joined");
      return;
    }

    if (!userId) {
      console.warn("Cannot send message: no user ID");
      return;
    }

    if (!messageContent.trim()) {
      console.warn("Cannot send message: empty message");
      return;
    }

    // If not connected, try to initialize the socket first
    if (!isConnected && userId && username) {
      console.log(
        "Not connected, attempting to initialize socket before sending message"
      );
      try {
        const newSocket = initializeSocket(userId, username);
        if (newSocket) {
          setIsConnected(true);
          console.log(
            `Socket initialized successfully for user: ${userId} (${username})`
          );

          // Join the chat room if needed
          joinRoom(currentChatId);
          console.log(
            "Joined chat room before sending message:",
            currentChatId
          );
        } else {
          console.error("Failed to initialize socket: socket is null");
          toast.error("Failed to connect to chat server");
        }
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        toast.error("Failed to connect to chat server");
      }
    }

    try {
      console.log("📤 Sending message:", messageContent);

      // Stop typing indicator
      handleTyping(false);

      // Create a temporary message for immediate display
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        content: messageContent,
        sender: { _id: userId, username },
        chat: { _id: currentChatId },
        createdAt: new Date(),
        isTemp: true,
      };

      // Add the temporary message to the UI immediately
      setMessages((prev) => [...prev, tempMessage]);

      // IMPORTANT: Only use socket to send the message, not both API and socket
      // This prevents duplicate messages in the database
      if (isConnected) {
        // Send via socket only
        console.log("Sending message via socket only");

        // Track this message to prevent duplication when it comes back from the server
        const tempId = tempMessage._id;
        const trackingKey = `${messageContent}-${Date.now()}`;

        setRecentlySentMessages((prev) => ({
          ...prev,
          [tempId]: true,
          [trackingKey]: true, // Also track by content+timestamp as fallback
        }));

        // Clean up tracking after 10 seconds
        setTimeout(() => {
          setRecentlySentMessages((prev) => {
            const updated = { ...prev };
            delete updated[tempId];
            delete updated[trackingKey];
            return updated;
          });
        }, 10000);

        // Send message via socket
        sendSocketMessage({
          content: messageContent,
          chat: currentChatId,
          sender: userId,
        });
      } else {
        // Fallback to API if socket is not connected
        console.log("Socket not connected, falling back to API");
        const savedMessageResponse = await sendMessageApi(
          currentChatId,
          messageContent
        );

        // Extract the actual message data
        let savedMessage = savedMessageResponse;
        if (savedMessageResponse && savedMessageResponse.data) {
          savedMessage = savedMessageResponse.data;
        }

        if (!savedMessage) {
          throw new Error("Failed to save message");
        }

        // Replace the temporary message with the real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempMessage._id
              ? {
                  ...savedMessage,
                  sender: savedMessage.sender || { _id: userId, username },
                  chat: savedMessage.chat || { _id: currentChatId },
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");

      // Remove the temporary message if there was an error
      setMessages((prev) => prev.filter((msg) => !msg.isTemp));
    }
  };

  return (
    <SocketContext.Provider
      value={{
        userId,
        setUserId,
        username,
        setUsername,
        currentChatId,
        messages,
        setMessages,
        message,
        setMessage,
        typingUsers,
        isConnected,
        joinChatRoom,
        sendMessage,
        handleTyping,
        markMessageRead: (messageId) =>
          markMessageReadViaSocket(messageId, currentChatId),
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
