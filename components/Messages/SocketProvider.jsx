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
import { getUserById } from "../../apis/auth";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );

  // Debug userId
  console.log("SocketProvider userId:", userId);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  // Add a ref to track recently sent messages to prevent duplicates
  const [recentlySentMessages, setRecentlySentMessages] = useState({});
  // Cache for user information to avoid repeated API calls
  const [userCache, setUserCache] = useState({});

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
    // Always try to set up event listeners, even if not connected
    // This ensures we catch events when the connection is established

    // Check if socket is initialized
    const socket = getSocket();
    if (!socket) {
      console.error("Cannot set up event listeners: socket is null");

      // Try to initialize the socket if we have user info
      if (userId && username) {
        console.log("Attempting to initialize socket for event listeners");
        const newSocket = initializeSocket(userId, username);
        if (newSocket) {
          setIsConnected(true);
          console.log(`Socket initialized successfully for event listeners`);
        }
      }
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

      // Make sure the sender object has a username
      if (
        typeof newMessage.sender === "object" &&
        !newMessage.sender.username
      ) {
        // If the sender is the current user, add the username
        if (String(senderId) === String(userId)) {
          newMessage.sender.username = username;
          console.log(
            "Added username to sender object for current user:",
            username
          );
        } else {
          // For other users, try to get their username from the message data
          // This is important for incoming messages from other users
          if (newMessage.senderUsername) {
            newMessage.sender.username = newMessage.senderUsername;
            console.log(
              "Added username to sender object from message data:",
              newMessage.senderUsername
            );
          } else {
            // If no username is available, use a placeholder
            console.log("No username available for sender:", senderId);
            // Try to fetch user info here if needed
          }
        }
      } else if (typeof newMessage.sender !== "object") {
        // If the sender is just an ID, create a proper sender object
        if (String(senderId) === String(userId)) {
          // For current user
          newMessage.sender = {
            _id: senderId,
            id: senderId,
            username: username,
          };
          console.log(
            "Created sender object with username for current user:",
            username
          );
        } else if (newMessage.senderUsername) {
          // For other users with username in message data
          newMessage.sender = {
            _id: senderId,
            id: senderId,
            username: newMessage.senderUsername,
          };
          console.log(
            "Created sender object with username from message data:",
            newMessage.senderUsername
          );
        } else {
          // For other users without username
          newMessage.sender = {
            _id: senderId,
            id: senderId,
          };
          console.log(
            "Created sender object without username for user:",
            senderId
          );

          // Try to fetch user info from cache first
          if (userCache[senderId]) {
            console.log(
              "Using cached user info for sender:",
              userCache[senderId]
            );
            newMessage.sender.username = userCache[senderId].username;
          } else {
            // Fetch user info from API
            console.log("Fetching user info for sender:", senderId);

            // Create a function to fetch and update user info
            const fetchUserInfo = async () => {
              try {
                const userData = await getUserById(senderId);
                console.log("Fetched user info:", userData);

                if (userData && userData.data && userData.data.username) {
                  // Update the cache
                  setUserCache((prev) => ({
                    ...prev,
                    [senderId]: userData.data,
                  }));

                  // Update the message sender
                  setMessages((prevMessages) => {
                    return prevMessages.map((msg) => {
                      // Find messages from this sender that don't have a username
                      if (
                        (msg.sender._id === senderId ||
                          msg.sender.id === senderId) &&
                        !msg.sender.username
                      ) {
                        // Create a new message object with the username
                        return {
                          ...msg,
                          sender: {
                            ...msg.sender,
                            username: userData.data.username,
                          },
                        };
                      }
                      return msg;
                    });
                  });
                }
              } catch (error) {
                console.error("Error fetching user info:", error);
              }
            };

            // Execute the fetch function
            fetchUserInfo();
          }
        }
      }

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

      // Always process messages for the current chat
      // This ensures we don't miss messages even if the currentChatId state hasn't updated yet
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

        // Mark message as read automatically if it's not from the current user
        if (senderId !== userId) {
          try {
            console.log("Marking message as read:", messageId);
            markMessageReadViaSocket(messageId, currentChatId);
          } catch (error) {
            console.error("Error marking message as read:", error);
          }
        }

        // Force a notification for new messages
        if (senderId !== userId) {
          toast.info(
            `New message from ${newMessage.sender?.username || "User"}`
          );

          // If the sender doesn't have a username, refresh messages to get the latest data
          if (!newMessage.sender?.username) {
            console.log(
              "Sender has no username, refreshing messages to get updated data"
            );
            // Add a small delay to ensure the message is saved on the server
            setTimeout(() => {
              refreshMessages();
            }, 500);
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

    // Return cleanup function to unsubscribe from all events
    return () => {
      console.log("Cleaning up socket event listeners");
      unsubscribeMessageReceived();
      unsubscribeMessageDelivered();
      unsubscribeUserTyping();
      unsubscribeUserStoppedTyping();
      unsubscribeMessageReadConfirmation();
    };
  }, [userId, username, currentChatId, recentlySentMessages]);

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
        sender: {
          _id: userId,
          id: userId, // Add id as well to ensure compatibility
          username,
        },
        chat: { _id: currentChatId },
        createdAt: new Date(),
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

      // Scroll to the bottom to show the new message
      setTimeout(() => {
        const messagesContainer = document.querySelector(".messages-container");
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);

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

        // Send message via socket with acknowledgement
        sendSocketMessage(
          {
            content: messageContent,
            chat: currentChatId,
            sender: userId,
            username: username, // Include username in the message data
          },
          (acknowledgement) => {
            if (acknowledgement && acknowledgement.success) {
              console.log("Message sent successfully:", acknowledgement);
            } else {
              console.error("Failed to send message:", acknowledgement);
              toast.warning(
                "Message may not have been delivered. Please check your connection."
              );
            }
          }
        );
      } else {
        // Fallback to API if socket is not connected
        console.log("Socket not connected, falling back to API");
        const savedMessageResponse = await sendMessageApi(
          currentChatId,
          messageContent,
          { username } // Pass username as additional data
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

  // Function to refresh messages for the current chat
  const refreshMessages = async () => {
    if (!currentChatId) {
      console.warn("Cannot refresh messages: no chat room joined");
      return;
    }

    try {
      console.log("Refreshing messages for chat:", currentChatId);
      const { getMessagesForChat } = require("../../apis/messages");
      const refreshedMessages = await getMessagesForChat(currentChatId);

      console.log("Refreshed messages:", refreshedMessages);

      // Check if we have a valid messages array
      let msgs = refreshedMessages;

      // If the response has a data property, use that
      if (refreshedMessages && refreshedMessages.data) {
        console.log("Using nested messages data");
        msgs = refreshedMessages.data;
      }

      // Ensure we have an array of messages
      if (!Array.isArray(msgs)) {
        console.error("Invalid messages data format:", refreshedMessages);
        return;
      }

      // Sort messages by createdAt timestamp if available
      if (msgs.length > 0 && msgs[0].createdAt) {
        msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      // Update the messages state
      setMessages(msgs);

      console.log("Messages refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh messages:", error);
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
        refreshMessages, // Add the refresh function to the context
        markMessageRead: (messageId) =>
          markMessageReadViaSocket(messageId, currentChatId),
        // Add a reconnect function for manual reconnection
        reconnect: () => {
          if (userId && username) {
            console.log("Manual reconnection attempt");
            const newSocket = initializeSocket(userId, username);
            if (newSocket) {
              setIsConnected(true);
              if (currentChatId) {
                joinRoom(currentChatId);
              }
              toast.success("Reconnected to chat server");
              return true;
            }
          }
          return false;
        },
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
