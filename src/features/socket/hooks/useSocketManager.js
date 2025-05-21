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
  selectLastSeenTimes,
  selectReconnectAttempts,
  selectJoinedRooms,
} from '../store/socketSlice';
import { createEventHandlers } from '../utils/eventHandlers';
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

    // Create event handlers
    const handlers = createEventHandlers(dispatch, { silentMode });

    // Connection events
    socketInstance.on('connect', () => {
      handlers.handleConnect();

      // Rejoin rooms
      joinedRooms.forEach(roomId => {
        socketInstance.emit('join room', roomId);
      });
    });

    socketInstance.on('disconnect', handlers.handleDisconnect);
    socketInstance.on('connect_error', handlers.handleConnectError);
    socketInstance.on('reconnect_attempt', handlers.handleReconnectAttempt);
    socketInstance.on('reconnect', handlers.handleReconnect);

    // User presence events
    socketInstance.on('user online', handlers.handleUserOnline);
    socketInstance.on('user offline', handlers.handleUserOffline);
    socketInstance.on('user joined', handlers.handleUserJoined);
    socketInstance.on('user left', handlers.handleUserLeft);
    socketInstance.on('user reconnected', handlers.handleUserReconnected);

    // Message events
    socketInstance.on('message received', handlers.handleMessageReceived);
    socketInstance.on('message delivered', handlers.handleMessageDelivered);
    socketInstance.on('message read confirmation', handlers.handleMessageReadConfirmation);
    socketInstance.on('messages bulk read', handlers.handleMessagesBulkRead);
    socketInstance.on('message edited', handlers.handleMessageEdited);
    socketInstance.on('message deleted', handlers.handleMessageDeleted);
    socketInstance.on('resend message', handlers.handleResendMessage);

    // Typing indicators
    socketInstance.on('user typing', handlers.handleUserTyping);
    socketInstance.on('user stopped typing', handlers.handleUserStoppedTyping);
    socketInstance.on('typing', handlers.handleUserTyping); // For backward compatibility
    socketInstance.on('stop typing', handlers.handleUserStoppedTyping); // For backward compatibility

    // Chat updates
    socketInstance.on('chat updated', handlers.handleChatUpdated);
    socketInstance.on('user added to group', handlers.handleUserAddedToGroup);
    socketInstance.on('user removed from group', handlers.handleUserRemovedFromGroup);
    socketInstance.on('group name updated', handlers.handleGroupNameUpdated);

    // Error events
    socketInstance.on('error', handlers.handleError);
    socketInstance.on('server error', handlers.handleServerError);

    // Notifications
    socketInstance.on('notification', handlers.handleNotification);

    // Store all event names for cleanup
    const eventNames = [
      'connect', 'disconnect', 'connect_error', 'reconnect_attempt', 'reconnect',
      'user online', 'user offline', 'user joined', 'user left', 'user reconnected',
      'message received', 'message delivered', 'message read confirmation',
      'messages bulk read', 'message edited', 'message deleted', 'resend message',
      'user typing', 'user stopped typing', 'typing', 'stop typing',
      'chat updated', 'user added to group', 'user removed from group', 'group name updated',
      'error', 'server error', 'notification'
    ];

    // Store event names in ref for cleanup
    eventNames.forEach(eventName => {
      eventHandlersRef.current[eventName] = true;
    });

  }, [dispatch, joinedRooms, silentMode]);

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

    // Store a reference to the current event handlers at the time the effect runs
    // This prevents the cleanup function from using a stale ref value
    const currentEventHandlersSnapshot = { ...eventHandlersRef.current };

    return () => {
      // Clean up socket on unmount using the snapshot we captured
      const currentSocket = socket;

      if (currentSocket) {
        // Remove all event listeners
        Object.keys(currentEventHandlersSnapshot).forEach(event => {
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
  const sendMessage = useCallback(async (messageData, callback) => {
    // Import the API function here to avoid circular dependencies
    const { sendMessage: apiSendMessage } = require('../../messaging/api/messagingApi');

    try {
      // Generate a temporary ID for the message if not provided
      const tempId = messageData.tempId || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create a temporary message object for optimistic UI updates
      const tempMessage = {
        ...messageData,
        _id: tempId,
        id: tempId,
        tempId,
        status: 'sending',
        timestamp: new Date().toISOString(),
        sender: messageData.sender || localStorage.getItem('userId'),
      };

      // First, try to send the message via API to ensure it's saved in the database
      const apiResponse = await apiSendMessage({
        content: messageData.content,
        chatId: messageData.chatId
      });

      // If API call was successful, emit the socket event for real-time updates
      if (socket && socket.connected) {
        // Include the saved message ID from the API response if available
        const socketData = {
          ...messageData,
          _id: apiResponse?.data?._id || apiResponse?.data?.id || tempId,
          id: apiResponse?.data?._id || apiResponse?.data?.id || tempId,
          tempId, // Include tempId for matching on response
          status: 'sent',
        };

        // Emit the message with acknowledgment callback
        socket.emit('new message', socketData, (socketResponse) => {
          if (callback) {
            // Combine API and socket responses
            callback({
              success: true,
              apiResponse,
              socketResponse,
              message: apiResponse?.data || socketData,
              tempId,
            });
          }
        });
      } else if (callback) {
        // If socket is not connected, just return the API response
        callback({
          success: true,
          apiResponse,
          socketConnected: false,
          message: apiResponse?.data,
          tempId,
          status: 'sent', // Mark as sent since it's saved in the database
        });
      }

      return {
        success: true,
        tempMessage,
        finalMessage: apiResponse?.data,
      };
    } catch (error) {
      console.error('Error sending message:', error);

      // Try socket-only as fallback if API fails
      if (socket && socket.connected) {
        // Generate a temporary ID for the message if not provided
        const tempId = messageData.tempId || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create a temporary message object
        const tempMessage = {
          ...messageData,
          _id: tempId,
          id: tempId,
          tempId,
          status: 'sending',
          timestamp: new Date().toISOString(),
          sender: messageData.sender || localStorage.getItem('userId'),
        };

        // Emit the message with acknowledgment callback
        socket.emit('new message', tempMessage, (socketResponse) => {
          if (callback) {
            callback({
              success: socketResponse?.success || false,
              socketResponse,
              message: socketResponse?.message || tempMessage,
              tempId,
              status: socketResponse?.success ? 'sent' : 'failed',
            });
          }
        });

        return {
          success: true,
          tempMessage,
          socketOnly: true,
        };
      }

      if (callback) {
        callback({
          success: false,
          error: error.message || 'Failed to send message',
          apiError: error,
          status: 'failed',
        });
      }

      return {
        success: false,
        error: error.message || 'Failed to send message',
      };
    }
  }, [socket]);

  /**
   * Send typing indicator
   * @param {string} chatId - Chat ID
   * @param {boolean} isTyping - Whether user is typing
   */
  const sendTyping = useCallback((chatId, isTyping) => {
    if (!socket || !socket.connected) return false;

    // Get user info
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    if (!userId || !chatId) return false;

    // Create payload with all required fields
    const payload = {
      userId,
      username,
      chatId,
      isTyping
    };

    // Use both event formats for compatibility
    // 1. The standard event name with isTyping flag
    socket.emit('typing', payload);

    // 2. The specific event names for typing state
    const eventName = isTyping ? 'typing' : 'stop typing';
    socket.emit(eventName, payload);

    // Update local state
    dispatch(setTypingUser({ userId, chatId, isTyping }));

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

  /**
   * Mark a message as read
   * @param {string} messageId - Message ID
   * @param {string} chatId - Chat ID
   */
  const markMessageRead = useCallback((messageId, chatId) => {
    if (!socket || !socket.connected || !messageId || !chatId) return false;

    socket.emit('message read', { messageId, chatId });
    return true;
  }, [socket]);

  /**
   * Mark all messages in a chat as read
   * @param {string} chatId - Chat ID
   */
  const markAllMessagesRead = useCallback((chatId) => {
    if (!socket || !socket.connected || !chatId) return false;

    socket.emit('mark messages read', { chatId });
    return true;
  }, [socket]);

  /**
   * Send a message edit
   * @param {string} messageId - Message ID
   * @param {string} chatId - Chat ID
   * @param {string} content - New message content
   * @param {Function} callback - Callback function
   */
  const editMessage = useCallback((messageId, chatId, content, callback) => {
    if (!socket || !socket.connected || !messageId || !chatId || !content) return false;

    socket.emit('edit message', { messageId, chatId, content }, callback);
    return true;
  }, [socket]);

  /**
   * Delete a message
   * @param {string} messageId - Message ID
   * @param {string} chatId - Chat ID
   * @param {Function} callback - Callback function
   */
  const deleteMessage = useCallback((messageId, chatId, callback) => {
    if (!socket || !socket.connected || !messageId || !chatId) return false;

    socket.emit('delete message', { messageId, chatId }, callback);
    return true;
  }, [socket]);

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

    // Message management methods
    markMessageRead,
    markAllMessagesRead,
    editMessage,
    deleteMessage,
  };
};

export default useSocketManager;
