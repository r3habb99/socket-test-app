
import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "../../features/messaging/hooks";
import { useAuthContext } from "./AuthProvider";
import { toast } from "react-toastify";
import { SOCKET_URL } from "../../constants";
import webrtcService, { CALL_STATES } from "../../features/messaging/api/webrtcService";
import { CallModal } from "../../features/messaging/components/WebRTC";

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

  // Global call state
  const [globalIncomingCall, setGlobalIncomingCall] = useState(null);
  const [showGlobalCallModal, setShowGlobalCallModal] = useState(false);
  const [globalCallState, setGlobalCallState] = useState(CALL_STATES.IDLE);

  // Use socket URL from constants with user information and enable silent mode
  // This will prevent connection-related toast notifications
  const socket = useSocket(SOCKET_URL, { silentMode: true });

  // Extract messages state to make SocketProvider reactive to changes
  const messages = socket?.messages || [];
  const setMessages = socket?.setMessages || (() => {});



  // Initialize WebRTC service globally when socket is connected
  useEffect(() => {
    if (socket.connected && socket.getSocket() && isAuthenticated()) {
      try {
        webrtcService.initialize(socket.getSocket());

        // Set up global incoming call handler
        const handleGlobalIncomingCall = (callData) => {

          // Show global call modal for incoming calls
          setGlobalIncomingCall(callData);
          setShowGlobalCallModal(true);

          // Also show a toast notification as backup
          toast.info(`📞 Incoming ${callData.callType} call from ${callData.from}`, {
            position: "top-right",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            onClick: () => {
              // Focus on the call modal when toast is clicked
              setShowGlobalCallModal(true);
            }
          });
        };

        // Set up global call state change handler
        const handleGlobalCallStateChange = ({ currentState }) => {
          setGlobalCallState(currentState);

          // Hide modal when call ends
          if (currentState === CALL_STATES.ENDED ||
              currentState === CALL_STATES.REJECTED ||
              currentState === CALL_STATES.FAILED) {
            setShowGlobalCallModal(false);
            setGlobalIncomingCall(null);
          }
        };

        // Listen for incoming calls and state changes globally
        webrtcService.on('incomingCall', handleGlobalIncomingCall);
        webrtcService.on('callStateChange', handleGlobalCallStateChange);

        // Cleanup function
        return () => {
          webrtcService.off('incomingCall', handleGlobalIncomingCall);
          webrtcService.off('callStateChange', handleGlobalCallStateChange);
        };
      } catch (error) {
        console.error('❌ [SocketProvider] Failed to initialize WebRTC service:', error);
      }
    }
  }, [socket, isAuthenticated]);

  // Global call action handlers
  const handleGlobalAcceptCall = async () => {
    try {
      if (globalIncomingCall) {
        await webrtcService.acceptCall(globalIncomingCall);
      }
    } catch (error) {
      console.error('❌ [SocketProvider] Failed to accept call:', error);
      toast.error('Failed to accept call');
    }
  };

  const handleGlobalRejectCall = () => {
    try {
      if (globalIncomingCall) {
        webrtcService.rejectCall(globalIncomingCall);
        setShowGlobalCallModal(false);
        setGlobalIncomingCall(null);
      }
    } catch (error) {
      console.error('❌ [SocketProvider] Failed to reject call:', error);
      toast.error('Failed to reject call');
    }
  };

  const handleGlobalEndCall = () => {
    try {
      webrtcService.endCall();
      setShowGlobalCallModal(false);
      setGlobalIncomingCall(null);
    } catch (error) {
      console.error('❌ [SocketProvider] Failed to end call:', error);
      toast.error('Failed to end call');
    }
  };

  const handleGlobalCloseModal = () => {
    if (globalCallState === CALL_STATES.RINGING && globalIncomingCall) {
      // If there's an incoming call, reject it
      handleGlobalRejectCall();
    } else {
      // Otherwise just close the modal
      setShowGlobalCallModal(false);
      setGlobalIncomingCall(null);
    }
  };

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
        // We don't show toast notifications here since we're using silent mode
      } else if (socket.connectionStatus === 'disconnected') {
        // Cleanup WebRTC service when socket disconnects
        try {
          webrtcService.destroy();
        } catch (error) {
          console.error("Error cleaning up WebRTC service:", error);
        }
      }
    }
  }, [socket.connected, socket.connectionStatus, socket.error, isAuthenticated]);

  // Improved reconnection logic with better conditions and error handling
  useEffect(() => {
    // Only attempt reconnection if:
    // 1. User is authenticated
    // 2. Not on login page
    // 3. Socket is not connected OR connection status is 'disconnected'
    // 4. We haven't attempted reconnection recently (to prevent spam)
    // 5. Socket is not currently connecting or reconnecting
    const now = Date.now();
    const shouldReconnect =
      isAuthenticated() &&
      (!socket.connected || socket.connectionStatus === 'disconnected') &&
      window.location.pathname !== '/login' &&
      socket.connectionStatus !== 'connecting' &&
      socket.connectionStatus !== 'reconnecting' &&
      (now - lastReconnectAttempt > reconnectCooldown);

    // Additional check for messaging page - more aggressive reconnection
    const isOnMessagingPage = window.location.pathname.includes('/messages');

    if (shouldReconnect) {
      setLastReconnectAttempt(now);

      try {
        socket.reconnect();

        // We're using silent mode, so we don't show toast notifications for reconnection attempts
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

  // Reconnect when user information changes - with cooldown
  useEffect(() => {
    const now = Date.now();
    if (user && isAuthenticated() && !socket.connected &&
        socket.connectionStatus !== 'connecting' &&
        socket.connectionStatus !== 'reconnecting' &&
        (now - lastReconnectAttempt > reconnectCooldown)) {
      setLastReconnectAttempt(now);
      socket.reconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthenticated]);

  // Only provide socket context if authenticated
  if (!isAuthenticated()) {
    return children;
  }

  // Create enhanced context value that includes both socket and messages state
  const contextValue = {
    ...socket,
    // Expose messages state and functions that components expect (using extracted reactive variables)
    messages,
    setMessages,
    // Ensure all socket functions are available
    connected: socket.connected,
    getSocket: socket.getSocket,
    joinChat: socket.joinChat,
    sendMessage: socket.sendMessage,
    subscribe: socket.subscribe || (() => () => {}), // Add subscribe method if missing
  };


  return (
    <SocketContext.Provider value={contextValue}>
      {children}

      {/* Global Call Modal - Handles incoming calls across the application */}
      <CallModal
        show={showGlobalCallModal}
        callType={globalIncomingCall?.callType}
        modalType="incoming"
        callState={globalCallState}
        currentCall={null}
        incomingCall={globalIncomingCall}
        localVideoRef={null}
        remoteVideoRef={null}
        isVideoEnabled={true}
        isAudioEnabled={true}
        onAccept={handleGlobalAcceptCall}
        onReject={handleGlobalRejectCall}
        onEnd={handleGlobalEndCall}
        onToggleVideo={() => {}}
        onToggleAudio={() => {}}
        onClose={handleGlobalCloseModal}
      />
    </SocketContext.Provider>
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
