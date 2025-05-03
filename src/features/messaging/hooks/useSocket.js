import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

/**
 * Custom hook for socket.io functionality
 * @param {string} url - Socket server URL
 * @returns {Object} Socket methods and state
 */
export const useSocket = (url = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000') => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    // Create socket instance
    const socket = io(url, {
      auth: {
        token
      }
    });

    // Set up event listeners
    socket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      setError(err.message);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Store socket instance in ref
    socketRef.current = socket;

    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, [url]);

  // Join a chat room
  const joinChat = useCallback((chatId) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('join chat', chatId);
    }
  }, [connected]);

  // Leave a chat room
  const leaveChat = useCallback((chatId) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('leave chat', chatId);
    }
  }, [connected]);

  // Send a message
  const sendMessage = useCallback((messageData) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('new message', messageData);
    }
  }, [connected]);

  // Subscribe to an event
  const subscribe = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  return {
    connected,
    error,
    joinChat,
    leaveChat,
    sendMessage,
    subscribe
  };
};
