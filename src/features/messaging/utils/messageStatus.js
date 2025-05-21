/**
 * Message Status Utilities
 * Manages message status tracking and updates
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
 * Check if status should be updated
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - New status
 * @returns {boolean} Whether status should be updated
 */
export const shouldUpdateStatus = (currentStatus, newStatus) => {
  const statusPriority = {
    [MESSAGE_STATUS.FAILED]: 0,
    [MESSAGE_STATUS.SENDING]: 1,
    [MESSAGE_STATUS.SENT]: 2,
    [MESSAGE_STATUS.DELIVERED]: 3,
    [MESSAGE_STATUS.READ]: 4,
  };

  // If current status is undefined, always update
  if (!currentStatus) return true;

  // If new status is undefined, don't update
  if (!newStatus) return false;

  // Only update if new status has higher priority
  return statusPriority[newStatus] > (statusPriority[currentStatus] || 0);
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
      // Only update if the new status has higher priority
      if (shouldUpdateStatus(message.status, status)) {
        return {
          ...message,
          status
        };
      }
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

/**
 * Check if message is from current user
 * @param {Object} message - Message object
 * @returns {boolean} Whether message is from current user
 */
export const isMessageFromCurrentUser = (message) => {
  const currentUserId = localStorage.getItem('userId');
  return String(message.sender?._id || message.sender?.id || message.sender) === String(currentUserId);
};

/**
 * Format message timestamp
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted timestamp
 */
export const formatMessageTimestamp = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isThisYear) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};
