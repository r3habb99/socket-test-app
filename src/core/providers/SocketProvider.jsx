
import React, { createContext, useContext, useEffect } from "react";
import { useSocket } from "../../features/messaging/hooks";
import { useAuthContext } from "./AuthProvider";
import { toast } from "react-toastify";
import { getSocketUrl } from "../../shared/utils/envUtils";

// Create context
const SocketContext = createContext(null);

/**
 * Socket Provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  // Use socket URL from envUtils
  const socketUrl = getSocketUrl();
  const socket = useSocket(socketUrl);

  // Log socket connection status changes
  useEffect(() => {
    // Only show socket errors if the user is authenticated and we're not on the login page
    if (isAuthenticated() && socket.error && window.location.pathname !== '/login') {
      console.error("Socket connection error:", socket.error);
      toast.error(`Socket error: ${socket.error}`);
    }
  }, [socket.connected, socket.error, isAuthenticated]);

  // Attempt to reconnect socket when authentication changes - only once
  useEffect(() => {
    // Only attempt reconnection if authenticated and not on login page
    if (isAuthenticated() && !socket.connected && window.location.pathname !== '/login') {
      console.log(
        "User is authenticated but socket is not connected. Attempting to reconnect..."
      );
      socket.reconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Intentionally omitting socket to prevent reconnection loops

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
