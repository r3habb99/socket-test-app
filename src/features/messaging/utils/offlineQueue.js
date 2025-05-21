/**
 * Offline Queue Utilities
 * Manages offline message queue for sending messages when reconnected
 */

const OFFLINE_QUEUE_KEY = 'offline_message_queue';
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Add a message to the offline queue
 * @param {Object} message - Message to queue
 * @returns {Array} Updated queue
 */
export const addToOfflineQueue = (message) => {
  try {
    // Get existing queue
    const queue = getOfflineQueue();

    // Add message with timestamp
    const queuedMessage = {
      ...message,
      queuedAt: new Date().toISOString(),
      attempts: 0
    };

    // Add to queue
    const updatedQueue = [...queue, queuedMessage];

    // Save updated queue
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));

    return updatedQueue;
  } catch (error) {
    console.error('Failed to add message to offline queue:', error);
    return [];
  }
};

/**
 * Get the offline message queue
 * @returns {Array} Offline message queue
 */
export const getOfflineQueue = () => {
  try {
    const queueString = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueString ? JSON.parse(queueString) : [];
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
};

/**
 * Remove a message from the offline queue
 * @param {string} messageId - ID of message to remove
 * @returns {Array} Updated queue
 */
export const removeFromOfflineQueue = (messageId) => {
  try {
    const queue = getOfflineQueue();
    const updatedQueue = queue.filter(msg =>
      msg._id !== messageId &&
      msg.id !== messageId &&
      msg.tempId !== messageId
    );
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    return updatedQueue;
  } catch (error) {
    console.error('Failed to remove message from offline queue:', error);
    return [];
  }
};

/**
 * Clear the offline message queue
 * @returns {boolean} Success status
 */
export const clearOfflineQueue = () => {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear offline queue:', error);
    return false;
  }
};

/**
 * Update a message in the offline queue
 * @param {string} messageId - ID of message to update
 * @param {Object} updates - Updates to apply
 * @returns {Array} Updated queue
 */
export const updateOfflineMessage = (messageId, updates) => {
  try {
    const queue = getOfflineQueue();
    const updatedQueue = queue.map(msg => {
      if (msg._id === messageId || msg.id === messageId) {
        return { ...msg, ...updates, updatedAt: new Date().toISOString() };
      }
      return msg;
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    return updatedQueue;
  } catch (error) {
    console.error('Failed to update message in offline queue:', error);
    return [];
  }
};

/**
 * Increment attempt count for a message in the offline queue
 * @param {string} messageId - ID of message to update
 * @returns {Object|null} Updated message or null if not found
 */
export const incrementAttemptCount = (messageId) => {
  try {
    const queue = getOfflineQueue();
    let updatedMessage = null;

    const updatedQueue = queue.map(msg => {
      if (msg._id === messageId || msg.id === messageId || msg.tempId === messageId) {
        updatedMessage = {
          ...msg,
          attempts: (msg.attempts || 0) + 1,
          lastAttempt: new Date().toISOString()
        };
        return updatedMessage;
      }
      return msg;
    });

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    return updatedMessage;
  } catch (error) {
    console.error('Failed to increment attempt count:', error);
    return null;
  }
};

/**
 * Get messages that should be retried
 * @returns {Array} Messages to retry
 */
export const getMessagesToRetry = () => {
  try {
    // Get current queue
    const queue = getOfflineQueue();

    // Filter messages that haven't exceeded max retry attempts
    return queue.filter(message => (message.attempts || 0) < MAX_RETRY_ATTEMPTS);
  } catch (error) {
    console.error('Error getting messages to retry:', error);
    return [];
  }
};

/**
 * Remove messages that have exceeded max retry attempts
 * @returns {Array} Updated queue
 */
export const removeFailedMessages = () => {
  try {
    // Get current queue
    const queue = getOfflineQueue();

    // Filter out messages that have exceeded max retry attempts
    const updatedQueue = queue.filter(message => (message.attempts || 0) < MAX_RETRY_ATTEMPTS);

    // Save updated queue
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));

    return updatedQueue;
  } catch (error) {
    console.error('Error removing failed messages:', error);
    return [];
  }
};
