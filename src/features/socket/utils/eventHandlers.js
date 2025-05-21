/**
 * Socket Event Handlers
 * Centralized handlers for all socket events
 */
import { toast } from 'react-toastify';
import { 
  setConnectionStatus, 
  setOnlineUser, 
  setTypingUser, 
  setLastSeen,
  resetReconnectAttempts,
  incrementReconnectAttempts
} from '../store/socketSlice';
import { addMessage, updateMessage, removeMessage, markMessageRead, markAllMessagesRead } from '../../messaging/store/messagingSlice';
import { addNotification } from '../../notification/store/notificationSlice';
import { updatePost, removePost } from '../../feed/store/feedSlice';

/**
 * Create event handlers for socket events
 * @param {Function} dispatch - Redux dispatch function
 * @param {Object} options - Options for event handlers
 * @param {boolean} options.silentMode - If true, connection-related toast notifications will be suppressed
 * @returns {Object} Event handlers
 */
export const createEventHandlers = (dispatch, options = {}) => {
  const { silentMode = false } = options;

  return {
    // Connection Events
    handleConnect: () => {
      dispatch(setConnectionStatus('connected'));
      dispatch(resetReconnectAttempts());

      if (!silentMode) {
        toast.success('Connected to chat server');
      }
    },

    handleDisconnect: (reason) => {
      dispatch(setConnectionStatus('disconnected'));

      if (!silentMode) {
        toast.info(`Disconnected from chat server: ${reason}`);
      }
    },

    handleConnectError: (error) => {
      console.error('Socket connection error:', error);
      dispatch(setConnectionStatus('disconnected'));
      dispatch(incrementReconnectAttempts());

      if (!silentMode) {
        toast.error(`Connection error: ${error.message}`);
      }
    },

    handleReconnectAttempt: (attempt) => {
      dispatch(setConnectionStatus('reconnecting'));

      if (!silentMode && attempt > 1) {
        toast.info(`Reconnecting... (Attempt ${attempt})`);
      }
    },

    handleReconnect: (attempt) => {
      dispatch(setConnectionStatus('connected'));
      dispatch(resetReconnectAttempts());

      if (!silentMode) {
        toast.success(`Reconnected to chat server (after ${attempt} attempts)`);
      }
    },

    // User Presence Events
    handleUserOnline: ({ userId, username }) => {
      dispatch(setOnlineUser({ userId, isOnline: true }));
    },

    handleUserOffline: ({ userId }) => {
      dispatch(setOnlineUser({ userId, isOnline: false }));
      dispatch(setLastSeen({ userId, timestamp: new Date().toISOString() }));
    },

    handleUserJoined: ({ userId, chatId, username }) => {
      // Could dispatch an action to update the chat participants
      console.log(`User ${username} (${userId}) joined chat ${chatId}`);
    },

    handleUserLeft: ({ userId, chatId, username }) => {
      // Could dispatch an action to update the chat participants
      console.log(`User ${username} (${userId}) left chat ${chatId}`);
    },

    handleUserReconnected: ({ userId, username }) => {
      dispatch(setOnlineUser({ userId, isOnline: true }));
      console.log(`User ${username} (${userId}) reconnected`);
    },

    // Message Events
    handleMessageReceived: (message) => {
      dispatch(addMessage(message));
    },

    handleMessageDelivered: ({ messageId, status }) => {
      dispatch(updateMessage({ messageId, updates: { status } }));
    },

    handleMessageReadConfirmation: ({ messageId, readBy, chatId }) => {
      dispatch(markMessageRead({ messageId, readBy, chatId }));
    },

    handleMessagesBulkRead: ({ chatId, readBy }) => {
      dispatch(markAllMessagesRead({ chatId, readBy }));
    },

    handleMessageEdited: (message) => {
      dispatch(updateMessage({ messageId: message._id, updates: message }));
    },

    handleMessageDeleted: ({ messageId, chatId }) => {
      dispatch(removeMessage({ messageId, chatId }));
    },

    handleResendMessage: (message) => {
      // This is for handling pending messages after reconnection
      dispatch(addMessage({ ...message, resending: true }));
    },

    // Typing Indicators
    handleUserTyping: ({ userId, chatId, username }) => {
      dispatch(setTypingUser({ userId, chatId, isTyping: true }));
    },

    handleUserStoppedTyping: ({ userId, chatId }) => {
      dispatch(setTypingUser({ userId, chatId, isTyping: false }));
    },

    // Chat Updates
    handleChatUpdated: (chat) => {
      // This would update the chat in the chats list
      console.log('Chat updated:', chat);
    },

    handleUserAddedToGroup: ({ chatId, userId, addedBy }) => {
      // This would update the chat participants
      console.log(`User ${userId} added to group ${chatId} by ${addedBy}`);
    },

    handleUserRemovedFromGroup: ({ chatId, userId, removedBy }) => {
      // This would update the chat participants
      console.log(`User ${userId} removed from group ${chatId} by ${removedBy}`);
    },

    handleGroupNameUpdated: ({ chatId, newName, updatedBy }) => {
      // This would update the chat name
      console.log(`Group ${chatId} renamed to ${newName} by ${updatedBy}`);
    },

    // Error Events
    handleError: (error) => {
      console.error('Socket error:', error);
      
      if (!silentMode) {
        toast.error(`Socket error: ${error.message || 'Unknown error'}`);
      }
    },

    handleServerError: (error) => {
      console.error('Server error:', error);
      
      if (!silentMode) {
        toast.error(`Server error: ${error.message || 'Unknown error'}`);
      }
    },

    // Notifications
    handleNotification: (notification) => {
      dispatch(addNotification(notification));
      
      // Show toast for notification if not in silent mode
      if (!silentMode && notification.message) {
        toast.info(notification.message);
      }
    },
  };
};

export default createEventHandlers;
