/**
 * Offline message queue utilities
 * Handles storing and retrieving messages when offline
 */

const OFFLINE_QUEUE_KEY = 'offline_message_queue';

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
    const updatedQueue = queue.filter(msg => msg._id !== messageId && msg.id !== messageId);
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
      if (msg._id === messageId || msg.id === messageId) {
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
