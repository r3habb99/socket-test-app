/**
 * Message status utilities for handling message delivery status
 */

// Message status constants
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

/**
 * Get the appropriate icon for a message status
 * @param {string} status - Message status
 * @returns {string} Icon name
 */
export const getMessageStatusIcon = (status) => {
  switch (status) {
    case MESSAGE_STATUS.SENDING:
      return 'loading';
    case MESSAGE_STATUS.SENT:
      return 'check';
    case MESSAGE_STATUS.DELIVERED:
      return 'check-circle';
    case MESSAGE_STATUS.READ:
      return 'check-circle-fill';
    case MESSAGE_STATUS.FAILED:
      return 'exclamation-circle';
    default:
      return '';
  }
};

/**
 * Get the color for a message status
 * @param {string} status - Message status
 * @returns {string} Color
 */
export const getMessageStatusColor = (status) => {
  switch (status) {
    case MESSAGE_STATUS.SENDING:
      return '#8899a6';
    case MESSAGE_STATUS.SENT:
      return '#8899a6';
    case MESSAGE_STATUS.DELIVERED:
      return '#1d9bf0';
    case MESSAGE_STATUS.READ:
      return '#1d9bf0';
    case MESSAGE_STATUS.FAILED:
      return '#f44336';
    default:
      return '#8899a6';
  }
};

/**
 * Get the text description for a message status
 * @param {string} status - Message status
 * @returns {string} Description
 */
export const getMessageStatusText = (status) => {
  switch (status) {
    case MESSAGE_STATUS.SENDING:
      return 'Sending...';
    case MESSAGE_STATUS.SENT:
      return 'Sent';
    case MESSAGE_STATUS.DELIVERED:
      return 'Delivered';
    case MESSAGE_STATUS.READ:
      return 'Read';
    case MESSAGE_STATUS.FAILED:
      return 'Failed to send';
    default:
      return '';
  }
};

/**
 * Update message status in messages array
 * @param {Array} messages - Messages array
 * @param {string} messageId - Message ID
 * @param {string} status - New status
 * @returns {Array} Updated messages array
 */
export const updateMessageStatus = (messages, messageId, status) => {
  return messages.map(message => {
    if ((message._id === messageId || message.id === messageId)) {
      return {
        ...message,
        status
      };
    }
    return message;
  });
};

/**
 * Mark messages as read
 * @param {Array} messages - Messages array
 * @param {string} chatId - Chat ID
 * @param {string} userId - Current user ID
 * @returns {Array} Updated messages array with read status
 */
export const markMessagesAsRead = (messages, chatId, userId) => {
  return messages.map(message => {
    // Only mark messages from other users as read
    if (
      message.chat === chatId &&
      String(message.sender?._id || message.sender?.id || message.sender) !== String(userId) &&
      message.status !== MESSAGE_STATUS.READ
    ) {
      return {
        ...message,
        status: MESSAGE_STATUS.READ
      };
    }
    return message;
  });
};

/**
 * Get unread message count for a chat
 * @param {Array} messages - Messages array
 * @param {string} chatId - Chat ID
 * @param {string} userId - Current user ID
 * @returns {number} Unread message count
 */
export const getUnreadMessageCount = (messages, chatId, userId) => {
  return messages.filter(
    message =>
      message.chat === chatId &&
      String(message.sender?._id || message.sender?.id || message.sender) !== String(userId) &&
      message.status !== MESSAGE_STATUS.READ
  ).length;
};
