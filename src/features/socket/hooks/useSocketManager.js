import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/hooks';
import {
  initializeSocket,
  joinRoom,
  leaveRoom,
  disconnectSocket,
  setConnectionStatus,
  setOnlineUser,
  setTypingUser,
  setLastSeen,
  incrementReconnectAttempts,
  resetReconnectAttempts,
  selectSocket,
  selectConnectionStatus,
  selectOnlineUsers,
  selectTypingUsers,
  selectLastSeenTimes,
  selectIsUserOnline,
  selectLastSeen,
  selectReconnectAttempts,
  selectJoinedRooms,
} from '../store/socketSlice';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

/**
 * Custom hook for managing socket connections and events
 * @param {Object} options - Options for socket behavior
 * @param {boolean} options.silentMode - If true, connection-related toast notifications will be suppressed
 * @param {boolean} options.autoConnect - If true, socket will connect automatically on mount
 * @param {number} options.reconnectCooldown - Cooldown period in ms between reconnect attempts
 * @returns {Object} Socket methods and state
 */
export const useSocketManager = (options = {}) => {
  const {
    silentMode = false,
    autoConnect = true,
    reconnectCooldown = 5000,
  } = options;

  const dispatch = useAppDispatch();
  const socket = useAppSelector(selectSocket);
  const connectionStatus = useAppSelector(selectConnectionStatus);
  const onlineUsers = useAppSelector(selectOnlineUsers);
  const lastSeenTimes = useAppSelector(selectLastSeenTimes);
  const reconnectAttempts = useAppSelector(selectReconnectAttempts);
  const joinedRooms = useAppSelector(selectJoinedRooms);

  // Use refs to store event handlers to prevent unnecessary re-renders
  const eventHandlersRef = useRef({});
  const lastReconnectAttemptRef = useRef(0);

  /**
   * Set up event handlers for socket
   * @param {Object} socketInstance - Socket.io instance
   */
  const setupEventHandlers = useCallback((socketInstance) => {
    if (!socketInstance) return;

    // Connection events
    socketInstance.on('connect', () => {
      dispatch(setConnectionStatus('connected'));
      dispatch(resetReconnectAttempts());

      if (!silentMode) {
        toast.success('Connected to chat server');
      }

      // Rejoin rooms
      joinedRooms.forEach(roomId => {
        socketInstance.emit('join room', roomId);
      });
    });

    socketInstance.on('disconnect', () => {
      dispatch(setConnectionStatus('disconnected'));

      if (!silentMode) {
        toast.info('Disconnected from chat server');
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      dispatch(setConnectionStatus('disconnected'));
      dispatch(incrementReconnectAttempts());

      if (!silentMode) {
        toast.error(`Connection error: ${error.message}`);
      }
    });

    socketInstance.on('reconnect_attempt', () => {
      dispatch(setConnectionStatus('reconnecting'));
      dispatch(incrementReconnectAttempts());

      if (!silentMode && reconnectAttempts > 0) {
        toast.info(`Reconnecting... (Attempt ${reconnectAttempts + 1})`);
      }
    });

    // User presence events
    socketInstance.on('user online', ({ userId, username }) => {
      dispatch(setOnlineUser({ userId, isOnline: true }));
    });

    socketInstance.on('user offline', ({ userId }) => {
      dispatch(setOnlineUser({ userId, isOnline: false }));
      dispatch(setLastSeen({ userId, timestamp: new Date().toISOString() }));
    });

    // Typing events
    socketInstance.on('typing', ({ userId, chatId }) => {
      dispatch(setTypingUser({ userId, chatId, isTyping: true }));
    });

    socketInstance.on('stop typing', ({ userId, chatId }) => {
      dispatch(setTypingUser({ userId, chatId, isTyping: false }));
    });
  }, [dispatch, joinedRooms, reconnectAttempts, silentMode]);

  /**
   * Connect to socket server
   */
  const connect = useCallback(async () => {
    try {
      // Check if we're already connected
      if (socket && socket.connected) {
        return true;
      }

      // Check if we've attempted to reconnect recently
      const now = Date.now();
      if (now - lastReconnectAttemptRef.current < reconnectCooldown) {
        return false;
      }

      // Update last reconnect attempt time
      lastReconnectAttemptRef.current = now;

      // Update connection status
      dispatch(setConnectionStatus('connecting'));

      // Initialize socket
      const resultAction = await dispatch(initializeSocket());

      if (initializeSocket.fulfilled.match(resultAction)) {
        // Set up event handlers
        setupEventHandlers(resultAction.payload.socket);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error connecting to socket:', error);
      return false;
    }
  }, [dispatch, reconnectCooldown, socket, setupEventHandlers]);

  // Initialize socket on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      // Clean up socket on unmount
      // Store a reference to the current socket and event handlers
      const currentSocket = socket;
      const currentEventHandlers = { ...eventHandlersRef.current };

      if (currentSocket) {
        Object.keys(currentEventHandlers).forEach(event => {
          currentSocket.off(event);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Disconnect from socket server
   */
  const disconnect = useCallback(async () => {
    try {
      await dispatch(disconnectSocket());
      return true;
    } catch (error) {
      console.error('Error disconnecting socket:', error);
      return false;
    }
  }, [dispatch]);

  /**
   * Join a chat room
   * @param {string} roomId - Room ID to join
   */
  const joinChatRoom = useCallback(async (roomId) => {
    if (!socket || !socket.connected) {
      const connected = await connect();
      if (!connected) return false;
    }

    try {
      await dispatch(joinRoom(roomId));
      return true;
    } catch (error) {
      console.error(`Error joining room ${roomId}:`, error);
      return false;
    }
  }, [connect, dispatch, socket]);

  /**
   * Leave a chat room
   * @param {string} roomId - Room ID to leave
   */
  const leaveChatRoom = useCallback(async (roomId) => {
    if (!socket) return false;

    try {
      await dispatch(leaveRoom(roomId));
      return true;
    } catch (error) {
      console.error(`Error leaving room ${roomId}:`, error);
      return false;
    }
  }, [dispatch, socket]);

  /**
   * Send a message
   * @param {Object} messageData - Message data to send
   * @param {Function} callback - Callback function
   */
  const sendMessage = useCallback((messageData, callback) => {
    if (!socket || !socket.connected) {
      connect().then(connected => {
        if (connected) {
          socket.emit('new message', messageData, callback);
        } else if (callback) {
          callback({ success: false, error: 'Socket not connected' });
        }
      });
      return false;
    }

    socket.emit('new message', messageData, callback);
    return true;
  }, [connect, socket]);

  /**
   * Send typing indicator
   * @param {string} chatId - Chat ID
   * @param {boolean} isTyping - Whether user is typing
   */
  const sendTyping = useCallback((chatId, isTyping) => {
    if (!socket || !socket.connected) return false;

    const eventName = isTyping ? 'typing' : 'stop typing';
    socket.emit(eventName, { chatId });

    // Update local state
    const userId = localStorage.getItem('userId');
    if (userId) {
      dispatch(setTypingUser({ userId, chatId, isTyping }));
    }

    return true;
  }, [dispatch, socket]);

  /**
   * Subscribe to a socket event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  const subscribe = useCallback((event, handler) => {
    if (!socket) return () => {};

    // Store handler in ref
    eventHandlersRef.current[event] = handler;

    // Add event listener
    socket.on(event, handler);

    // Return unsubscribe function
    return () => {
      socket.off(event, handler);
      delete eventHandlersRef.current[event];
    };
  }, [socket]);

  /**
   * Format last seen time
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted last seen time
   */
  const formatLastSeen = useCallback((timestamp) => {
    if (!timestamp) return 'Unknown';

    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  }, []);

  // Create selector functions that don't use hooks directly
  const isUserOnline = useCallback((userId) => {
    return !!onlineUsers[userId];
  }, [onlineUsers]);

  const getLastSeen = useCallback((userId) => {
    return lastSeenTimes[userId];
  }, [lastSeenTimes]);

  // Pre-select typing users for all chats
  const allTypingUsers = useAppSelector(state => state.socket.typingUsers);

  const getTypingUsers = useCallback((chatId) => {
    return allTypingUsers[chatId] || {};
  }, [allTypingUsers]);

  return {
    // Connection state
    socket,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    reconnectAttempts,

    // User presence state
    onlineUsers,
    lastSeenTimes,
    isUserOnline,
    getLastSeen,
    formatLastSeen,

    // Typing state
    getTypingUsers,

    // Socket methods
    connect,
    disconnect,
    joinChatRoom,
    leaveChatRoom,
    sendMessage,
    sendTyping,
    subscribe,
  };
};

export default useSocketManager;
