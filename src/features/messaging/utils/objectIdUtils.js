/**
 * Utility functions for handling MongoDB ObjectId conversion to strings
 * This prevents React from throwing "Objects are not valid as a React child" errors
 * when ObjectIds with buffer properties are rendered in components.
 */

/**
 * Convert ObjectId to string using multiple fallback methods
 * @param {*} objectId - The ObjectId to convert
 * @returns {string} - String representation of the ObjectId
 */
export const convertObjectIdToString = (objectId) => {
  if (typeof objectId === "string") {
    return objectId;
  } else if (objectId && typeof objectId === "object") {
    // Try standard ObjectId methods
    if (typeof objectId.toString === "function") {
      const stringResult = objectId.toString();
      if (stringResult && stringResult !== "[object Object]" && stringResult.length === 24) {
        return stringResult;
      }
    }

    // Try toHexString method
    if (typeof objectId.toHexString === "function") {
      try {
        return objectId.toHexString();
      } catch (e) {
        // Ignore errors
      }
    }

    // Try $oid property
    if (objectId.$oid) {
      return objectId.$oid;
    }

    // Try str property
    if (objectId.str) {
      return objectId.str;
    }

    // Handle BSON ObjectId buffer property
    if (objectId.buffer && typeof objectId.buffer === 'object' && objectId.buffer !== null) {
      const buffer = objectId.buffer;
      const keys = Object.keys(buffer);
      if (keys.length === 12 && keys.every(key => !isNaN(key) && parseInt(key) >= 0 && parseInt(key) <= 11)) {
        // Convert buffer object {0: 104, 1: 48, ...} to hex string
        const bytes = [];
        for (let i = 0; i < 12; i++) {
          bytes.push(buffer[i]);
        }
        return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
      }
    }

    // Try direct property access for hex string
    const possibleHexProps = ['hex', 'hexString', 'id'];
    for (const prop of possibleHexProps) {
      if (objectId[prop] && typeof objectId[prop] === 'string' && objectId[prop].length === 24) {
        return objectId[prop];
      }
    }
  }
  return objectId; // Return as-is if conversion fails
};

/**
 * Sanitize message object by converting all ObjectIds to strings
 * @param {Object} message - The message object to sanitize
 * @returns {Object} - Sanitized message object with ObjectIds converted to strings
 */
// Helper function to ensure valid date format
const sanitizeDate = (dateValue) => {
  if (!dateValue) return dateValue;

  // If it's already a valid date string, return it
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? new Date().toISOString() : dateValue;
  }

  // If it's a Date object, convert to ISO string
  if (dateValue instanceof Date) {
    return dateValue.toISOString();
  }

  // If it's an ObjectId, it might be a timestamp - convert to string first, then try as date
  if (typeof dateValue === 'object') {
    const stringValue = convertObjectIdToString(dateValue);
    // If conversion resulted in a hex string, it's not a date - use current time
    if (stringValue && stringValue.length === 24 && /^[0-9a-f]+$/i.test(stringValue)) {
      return new Date().toISOString();
    }
    // Try to parse as date
    const date = new Date(stringValue);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  // Fallback to current time
  return new Date().toISOString();
};

export const sanitizeMessageObject = (message) => {
  if (!message || typeof message !== 'object') {
    return message;
  }

  const sanitized = { ...message };

  // Convert message ID
  if (sanitized._id) {
    sanitized._id = convertObjectIdToString(sanitized._id);
  }
  if (sanitized.id) {
    sanitized.id = convertObjectIdToString(sanitized.id);
  }

  // Convert chat ID
  if (sanitized.chat && typeof sanitized.chat === 'object') {
    sanitized.chat = { ...sanitized.chat };
    if (sanitized.chat._id) {
      sanitized.chat._id = convertObjectIdToString(sanitized.chat._id);
    }
    if (sanitized.chat.id) {
      sanitized.chat.id = convertObjectIdToString(sanitized.chat.id);
    }
  }

  // Convert sender ID
  if (sanitized.sender && typeof sanitized.sender === 'object') {
    sanitized.sender = { ...sanitized.sender };
    if (sanitized.sender._id) {
      sanitized.sender._id = convertObjectIdToString(sanitized.sender._id);
    }
    if (sanitized.sender.id) {
      sanitized.sender.id = convertObjectIdToString(sanitized.sender.id);
    }
  }

  // Sanitize date fields
  if (sanitized.createdAt) {
    sanitized.createdAt = sanitizeDate(sanitized.createdAt);
  }
  if (sanitized.updatedAt) {
    sanitized.updatedAt = sanitizeDate(sanitized.updatedAt);
  }
  if (sanitized.timestamp) {
    sanitized.timestamp = sanitizeDate(sanitized.timestamp);
  }

  return sanitized;
};

/**
 * Sanitize an array of message objects
 * @param {Array} messages - Array of message objects to sanitize
 * @returns {Array} - Array of sanitized message objects
 */
export const sanitizeMessagesArray = (messages) => {
  if (!Array.isArray(messages)) {
    return messages;
  }

  return messages.map(sanitizeMessageObject);
};
