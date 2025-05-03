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

      // Get sender ID (might be _id or id or an object with _id/id)
      const senderId =
        typeof newMessage.sender === "object"
          ? newMessage.sender._id || newMessage.sender.id
          : newMessage.sender;

      // Check if this is a message we just sent (to avoid duplicates)
      const isRecentlySentMessage = recentlySentMessages[messageId];

      if (isRecentlySentMessage) {
        console.log(
          "Ignoring message we just sent to avoid duplication:",
          messageId
        );
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
    if (!chatId || !isConnected) {
      console.warn("Cannot join chat room: invalid chat ID or not connected");
      return;
    }

    // Don't join the same chat room again
    if (currentChatId === chatId) {
      console.log("Already in chat room:", chatId);
      return;
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
    if (!currentChatId || !isConnected) {
      console.warn("Cannot send message: no chat room joined or not connected");
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

    try {
      console.log("📤 Sending message:", messageContent);

      // Stop typing indicator
      handleTyping(false);

      // Send message via API
      const savedMessageResponse = await sendMessageApi(
        currentChatId,
        messageContent
      );
      console.log("API response for sending message:", savedMessageResponse);

      // Extract the actual message data
      let savedMessage = savedMessageResponse;
      if (savedMessageResponse && savedMessageResponse.data) {
        savedMessage = savedMessageResponse.data;
        console.log("Using nested message data:", savedMessage);
      }

      if (!savedMessage) {
        console.error("Failed to save message:", savedMessageResponse);
        throw new Error("Failed to save message");
      }

      // Add message to local state
      const formattedMessage = {
        ...savedMessage,
        sender: savedMessage.sender || { _id: userId, username },
        chat: savedMessage.chat || { _id: currentChatId },
      };

      console.log("Adding message to local state:", formattedMessage);

      // Get message ID (might be _id or id)
      const messageId = formattedMessage._id || formattedMessage.id;

      // Track this message as recently sent to prevent duplication
      setRecentlySentMessages((prev) => ({
        ...prev,
        [messageId]: true,
      }));

      // Set a timeout to remove the message from tracking after a short delay
      setTimeout(() => {
        setRecentlySentMessages((prev) => {
          const updated = { ...prev };
          delete updated[messageId];
          return updated;
        });
      }, 5000); // 5 seconds should be enough for the socket to echo back

      // Send message via socket AFTER tracking it
      sendSocketMessage({
        content: messageContent,
        chat: currentChatId,
        sender: userId,
      });

      // Add to messages if not already there
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some((msg) => (msg._id || msg.id) === messageId);

        if (exists) {
          console.log(
            "Message already exists in the list, not adding again:",
            messageId
          );
          return prev;
        }

        console.log("Adding new message to the list:", messageId);
        return [...prev, formattedMessage];
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
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
