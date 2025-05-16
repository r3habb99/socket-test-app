
import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "../../features/messaging/hooks";
import { useAuthContext } from "./AuthProvider";
import { toast } from "react-toastify";
import { SOCKET_URL } from "../../constants";

// Create context
const SocketContext = createContext(null);

/**
 * Socket Provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuthContext();
  const [lastReconnectAttempt, setLastReconnectAttempt] = useState(0);
  const reconnectCooldown = 5000; // 5 seconds between reconnect attempts

  // Use socket URL from constants with user information
  const socket = useSocket(SOCKET_URL);

  // Log socket connection status changes
  useEffect(() => {
    // Only show socket errors if the user is authenticated and we're not on the login page
    if (isAuthenticated() && socket.error && window.location.pathname !== '/login') {
      console.error("Socket connection error:", socket.error);

      // Show toast notification for connection errors
      if (socket.connectionStatus === 'disconnected') {
        toast.error(`Chat connection error: ${socket.error}`, {
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    }

    // Show connection status changes
    if (isAuthenticated() && window.location.pathname.includes('/messages')) {
      if (socket.connectionStatus === 'connected' && !socket.connected) {
        // This handles the case where the state is out of sync
        console.warn("Connection state mismatch: status is 'connected' but socket is disconnected");
      }

      if (socket.connected) {
        console.log("Socket connected successfully");
      }
    }
  }, [socket.connected, socket.connectionStatus, socket.error, isAuthenticated]);

  // Attempt to reconnect socket when authentication changes or when connection is lost
  useEffect(() => {
    // Only attempt reconnection if:
    // 1. User is authenticated
    // 2. Not on login page
    // 3. Socket is not connected
    // 4. We haven't attempted reconnection recently (to prevent spam)
    const now = Date.now();
    const shouldReconnect =
      isAuthenticated() &&
      !socket.connected &&
      window.location.pathname !== '/login' &&
      (now - lastReconnectAttempt > reconnectCooldown);

    if (shouldReconnect) {
      console.log("Attempting to reconnect socket...");
      setLastReconnectAttempt(now);
      socket.reconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, socket.connected]); // Include socket.connected to attempt reconnection when connection is lost

  // Reconnect when user information changes
  useEffect(() => {
    if (user && isAuthenticated() && !socket.connected) {
      console.log("User information changed, reconnecting socket...");
      socket.reconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthenticated]);

  // Only provide socket context if authenticated
  if (!isAuthenticated()) {
    return children;
  }

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

/**
 * Custom hook to use the socket context
 * @returns {Object} Socket context
 */
export const useSocketContext = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }

  return context;
};
