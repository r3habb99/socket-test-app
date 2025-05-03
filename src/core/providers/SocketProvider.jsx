import React, { createContext, useContext } from "react";
import { useSocket } from "../../features/messaging/hooks";
import { useAuthContext } from "./AuthProvider";

// Create context
const SocketContext = createContext(null);

/**
 * Socket Provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  const socket = useSocket();

  // Only render children if authenticated
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
