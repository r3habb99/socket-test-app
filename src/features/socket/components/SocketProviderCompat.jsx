/**
 * Socket Provider Compatibility Layer
 * Provides backward compatibility with the old SocketProvider context API
 * while using the new socket slice under the hood
 */
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/hooks';
import { useSocketManager } from '../hooks/useSocketManager';
import { useAuthContext } from '../../../core/providers/AuthProvider';
import {
  selectSocket,
  selectConnectionStatus,
  selectOnlineUsers,
  selectLastSeenTimes,
  initializeSocket,
} from '../store/socketSlice';

// Create context
const SocketContext = createContext(null);

/**
 * Socket Provider Compatibility component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const SocketProviderCompat = ({ children }) => {
  const { isAuthenticated, user } = useAuthContext();
  const dispatch = useAppDispatch();

  // Get socket state from Redux
  const socket = useAppSelector(selectSocket);
  const connectionStatus = useAppSelector(selectConnectionStatus);
  const onlineUsers = useAppSelector(selectOnlineUsers);
  const lastSeenTimes = useAppSelector(selectLastSeenTimes);

  // Local state for messages and chat
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState({}); // eslint-disable-line no-unused-vars
  const [currentChatId, setCurrentChatId] = useState(null);

  // Use our new socket manager hook with silent mode enabled
  const socketManager = useSocketManager({ silentMode: true, autoConnect: true });

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (isAuthenticated() && user) {
      dispatch(initializeSocket());
    }
  }, [dispatch, isAuthenticated, user]);

  // Create a subscribe function that matches the old API
  const subscribe = useCallback((event, handler) => {
    if (!socket) return () => {};
    return socketManager.subscribe(event, handler);
  }, [socket, socketManager]);

  // Helper functions for user status
  const isUserOnline = useCallback((userId) => {
    if (!userId) return false;
    return onlineUsers[userId] === true;
  }, [onlineUsers]);

  const getLastSeen = useCallback((userId) => {
    if (!userId) return null;
    return lastSeenTimes[userId] || null;
  }, [lastSeenTimes]);

  const formatLastSeen = useCallback((timestamp) => {
    if (!timestamp) return 'a while ago';

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
      if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
      if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting last seen time:', error);
      return 'a while ago';
    }
  }, []);

  // Function to refresh messages for a chat
  const refreshMessages = useCallback(async (chatId) => {
    if (!chatId && !currentChatId) return;

    try {
      // This would typically call an API to get messages
      // For now, we'll just use the existing messages
      return messages;
    } catch (error) {
      console.error('Error refreshing messages:', error);
      return [];
    }
  }, [currentChatId, messages]);

  // Only provide socket context if authenticated
  if (!isAuthenticated()) {
    return children;
  }

  // Create a compatibility object that matches the old API
  const compatSocket = {
    // User info
    userId: user?.id || localStorage.getItem('userId'),
    username: user?.username || localStorage.getItem('username'),

    // Connection state
    connected: connectionStatus === 'connected',
    connectionStatus,

    // User presence state
    onlineUsers,
    lastSeenTimes,
    isUserOnline,
    getLastSeen,
    formatLastSeen,

    // Chat state
    messages,
    setMessages,
    message,
    setMessage,
    typingUsers,
    currentChatId,

    // Socket methods
    subscribe,
    joinChatRoom: (chatId) => {
      setCurrentChatId(chatId);
      return socketManager.joinChatRoom(chatId);
    },
    joinChat: (chatId) => {
      setCurrentChatId(chatId);
      return socketManager.joinChatRoom(chatId);
    },
    leaveChatRoom: socketManager.leaveChatRoom,
    leaveChat: socketManager.leaveChatRoom,
    sendMessage: socketManager.sendMessage,
    sendTyping: socketManager.sendTyping,
    handleTyping: (isTyping, chatId) => {
      const targetChatId = chatId || currentChatId;
      if (!targetChatId) return;
      socketManager.sendTyping(targetChatId, isTyping);
    },
    markMessageRead: (messageId, chatId) => {
      if (!socket) return;
      socket.emit('message read', { messageId, chatId: chatId || currentChatId });
    },
    reconnect: () => {
      if (socket) {
        socket.connect();
        return true;
      }
      return false;
    },
    refreshMessages,

    // Direct socket access (for backward compatibility)
    socket,
  };

  return (
    <SocketContext.Provider value={compatSocket}>{children}</SocketContext.Provider>
  );
};

/**
 * Custom hook to use the socket context
 * @returns {Object} Socket context
 */
export const useSocketContext = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }

  return context;
};

export default SocketProviderCompat;
