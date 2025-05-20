
import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "../../features/messaging/hooks";
import { useAuthContext } from "./AuthProvider";
import { toast } from "react-toastify";
import { SOCKET_URL } from "../../constants";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  setSocket,
  setConnectionStatus,
  setOnlineUser,
  setLastSeen,
  selectConnectionStatus
} from "../../features/messaging/store/messagingSlice";

// Create context
const SocketContext = createContext(null);

/**
 * Socket Provider component
 * Uses Redux for state management but maintains the same context API
 * for backward compatibility with existing components
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuthContext();
  const dispatch = useAppDispatch();
  const connectionStatus = useAppSelector(selectConnectionStatus);
  const [lastReconnectAttempt, setLastReconnectAttempt] = useState(0);
  const reconnectCooldown = 5000; // 5 seconds between reconnect attempts

  // Use socket URL from constants with user information and enable silent mode
  // This will prevent connection-related toast notifications
  const socket = useSocket(SOCKET_URL, { silentMode: true });

  // Store socket instance in Redux
  useEffect(() => {
    if (socket) {
      dispatch(setSocket(socket));
    }
  }, [socket, dispatch]);

  // Log socket connection status changes and update Redux state
  useEffect(() => {
    // Update connection status in Redux
    dispatch(setConnectionStatus(socket.connectionStatus));

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
        // We don't show toast notifications here since we're using silent mode
      }
    }
  }, [socket.connected, socket.connectionStatus, socket.error, isAuthenticated, dispatch]);

  // Improved reconnection logic with better conditions and error handling
  useEffect(() => {
    // Only attempt reconnection if:
    // 1. User is authenticated
    // 2. Not on login page
    // 3. Socket is not connected OR connection status is 'disconnected'
    // 4. We haven't attempted reconnection recently (to prevent spam)
    const now = Date.now();
    const shouldReconnect =
      isAuthenticated() &&
      (!socket.connected || socket.connectionStatus === 'disconnected') &&
      window.location.pathname !== '/login' &&
      (now - lastReconnectAttempt > reconnectCooldown);

    // Additional check for messaging page - more aggressive reconnection
    const isOnMessagingPage = window.location.pathname.includes('/messages');

    if (shouldReconnect) {
      console.log(`Attempting to reconnect socket... (On messaging page: ${isOnMessagingPage})`);
      setLastReconnectAttempt(now);

      try {
        socket.reconnect();

        // We're using silent mode, so we don't show toast notifications for reconnection attempts
        // Only log to console
        if (isOnMessagingPage && socket.connectionStatus === 'disconnected') {
          console.log("Reconnecting to chat server...");
        }
      } catch (error) {
        console.error("Error reconnecting socket:", error);

        // Only show error toasts for critical failures, even in silent mode
        if (isOnMessagingPage) {
          toast.error("Failed to reconnect to chat server. Will retry shortly.", {
            autoClose: 3000,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthenticated,
    socket.connected,
    socket.connectionStatus,
    // Check location pathname to detect navigation to/from messaging page
    window.location.pathname
  ]);

  // Reconnect when user information changes
  useEffect(() => {
    if (user && isAuthenticated() && !socket.connected) {
      console.log("User information changed, reconnecting socket...");
      socket.reconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthenticated]);

  // Update online users and last seen times in Redux
  useEffect(() => {
    if (socket.onlineUsers) {
      Object.entries(socket.onlineUsers).forEach(([userId, isOnline]) => {
        dispatch(setOnlineUser({ userId, isOnline }));
      });
    }

    if (socket.lastSeenTimes) {
      Object.entries(socket.lastSeenTimes).forEach(([userId, timestamp]) => {
        dispatch(setLastSeen({ userId, timestamp }));
      });
    }
  }, [socket.onlineUsers, socket.lastSeenTimes, dispatch]);

  // Only provide socket context if authenticated
  if (!isAuthenticated()) {
    return children;
  }

  // Create enhanced socket object that includes Redux connection status
  const enhancedSocket = {
    ...socket,
    connectionStatus: connectionStatus || socket.connectionStatus,
  };

  return (
    <SocketContext.Provider value={enhancedSocket}>{children}</SocketContext.Provider>
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
