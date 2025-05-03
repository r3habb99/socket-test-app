import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

// Socket.io connection URL - should match your backend
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8080';

let socket = null;

/**
 * Initialize socket connection
 * @param {string} userId - User ID
 * @param {string} username - Username
 * @returns {Object|null} Socket instance or null if initialization failed
 */
export const initializeSocket = (userId, username) => {
  if (!userId || !username) {
    console.error('Cannot initialize socket: missing userId or username');
    return null;
  }

  try {
    if (socket) {
      // If socket already exists, disconnect it first
      console.log('Disconnecting existing socket before creating a new one');
      socket.disconnect();
    }

    console.log(`Creating new socket connection for user: ${userId} (${username})`);

    // Create new socket connection with auth data
    socket = io(SOCKET_URL, {
      auth: {
        userId,
        username,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'], // Try WebSocket first, then fall back to polling
    });

    if (!socket) {
      console.error('Failed to create socket: io() returned null');
      return null;
    }

    // Set up event handlers
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error(`Connection error: ${error.message}`);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);

      // Try to reconnect for any disconnect reason
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('Attempting to reconnect after disconnect...');
        setTimeout(() => {
          socket.connect();
        }, 1000);
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      toast.success('Reconnected to chat server');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    toast.error(`Failed to connect: ${error.message}`);
    return null;
  }
};

/**
 * Get the socket instance
 * @returns {Object|null} Socket instance or null if not initialized
 */
export const getSocket = () => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');

    // Try to initialize with stored user data
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    if (userId && username) {
      console.log('Attempting to initialize socket with stored user data');
      return initializeSocket(userId, username);
    }
  }
  return socket;
};

/**
 * Join a chat room
 * @param {string} roomId - Room ID to join
 */
export const joinChatRoom = (roomId) => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
    return;
  }
  socket.emit('join room', roomId);
};

/**
 * Leave a chat room
 * @param {string} roomId - Room ID to leave
 */
export const leaveChatRoom = (roomId) => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
    return;
  }
  socket.emit('leave room', roomId);
};

/**
 * Send a message via socket
 * @param {Object} message - Message object
 * @param {Function} callback - Callback function
 */
export const sendSocketMessage = (message, callback) => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
    if (callback) callback({ success: false, error: 'Socket not initialized' });
    return;
  }

  if (!socket.connected) {
    console.warn('Socket is not connected. Attempting to reconnect...');
    socket.connect();
    if (callback) callback({ success: false, error: 'Socket not connected' });
    return;
  }

  // Ensure the message has a senderUsername field if username is provided
  if (message.username && !message.senderUsername) {
    message.senderUsername = message.username;
  }

  socket.emit('new message', message, (response) => {
    if (callback) callback(response);
  });
};

/**
 * Send typing indicator
 * @param {string} chatId - Chat ID
 * @param {boolean} isTyping - Whether user is typing
 */
export const sendTypingIndicator = (chatId, isTyping) => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
    return;
  }
  
  const eventName = isTyping ? 'typing' : 'stop typing';
  socket.emit(eventName, { chatId });
};

/**
 * Mark message as read
 * @param {string} messageId - Message ID
 * @param {string} chatId - Chat ID
 */
export const markMessageReadViaSocket = (messageId, chatId) => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
    return;
  }
  socket.emit('message read', { messageId, chatId });
};

/**
 * Mark all messages in a chat as read
 * @param {string} chatId - Chat ID
 */
export const markAllMessagesReadViaSocket = (chatId) => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
    return;
  }
  socket.emit('mark messages read', { chatId });
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected');
  }
};

/**
 * Create a safe event handler
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
const createSafeEventHandler = (event, callback) => {
  if (!socket) {
    console.warn(`Cannot subscribe to ${event}: Socket not initialized`);
    return () => {};
  }

  socket.on(event, callback);
  return () => socket.off(event, callback);
};

// Event handlers
export const onMessageReceived = (callback) => createSafeEventHandler('message received', callback);
export const onMessageDelivered = (callback) => createSafeEventHandler('message delivered', callback);
export const onUserTyping = (callback) => createSafeEventHandler('user typing', callback);
export const onUserStoppedTyping = (callback) => createSafeEventHandler('user stopped typing', callback);
export const onMessageReadConfirmation = (callback) => createSafeEventHandler('message read confirmation', callback);
export const onMessagesBulkRead = (callback) => createSafeEventHandler('messages bulk read', callback);
export const onUserJoined = (callback) => createSafeEventHandler('user joined', callback);
export const onUserLeft = (callback) => createSafeEventHandler('user left', callback);
export const onUserOnline = (callback) => createSafeEventHandler('user online', callback);
export const onUserOffline = (callback) => createSafeEventHandler('user offline', callback);
export const onNewPost = (callback) => createSafeEventHandler('new post', callback);
export const onPostLiked = (callback) => createSafeEventHandler('post liked', callback);
export const onPostRetweeted = (callback) => createSafeEventHandler('post retweeted', callback);
export const onPostDeleted = (callback) => createSafeEventHandler('post deleted', callback);
