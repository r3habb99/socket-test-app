/**
 * Custom hook for WebRTC functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import webrtcService, { CALL_STATES, CALL_TYPES } from '../api/webrtcService';
import { toast } from 'react-toastify';
import { useSocketContext } from '../../../core/providers/SocketProvider';

/**
 * Custom hook for WebRTC calling functionality
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoAcceptCalls - Auto accept incoming calls (for testing)
 * @param {Function} options.onIncomingCall - Callback for incoming calls
 * @param {Function} options.onCallStateChange - Callback for call state changes
 * @returns {Object} WebRTC state and methods
 */
export const useWebRTC = (options = {}) => {
  const {
    autoAcceptCalls = false,
    onIncomingCall,
    onCallStateChange
  } = options;

  // Get socket context
  const socketContext = useSocketContext();

  // Call state
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState(null);

  // Media streams
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Connection state
  const [connectionState, setConnectionState] = useState('new');
  const [iceConnectionState, setIceConnectionState] = useState('new');

  // Refs for video elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Check WebRTC service initialization status when socket is available
  useEffect(() => {
    if (socketContext && socketContext.socket && socketContext.connected) {
      if (!webrtcService.isInitialized) {
        try {
          console.log('🔧 [useWebRTC] WebRTC service not initialized, initializing with socket:', socketContext.socket.id);
          webrtcService.initialize(socketContext.socket);
          console.log('✅ [useWebRTC] WebRTC service initialized from useWebRTC hook');
        } catch (error) {
          console.error('❌ [useWebRTC] Failed to initialize WebRTC service:', error);
        }
      } else {
        console.log('✅ [useWebRTC] WebRTC service already initialized globally, ensuring socket is current');
        // Ensure the service has the current socket instance
        if (webrtcService.socket !== socketContext.socket) {
          console.log('🔧 [useWebRTC] Updating WebRTC service socket instance');
          webrtcService.initialize(socketContext.socket);
        }
      }
    } else {
      console.log('⏳ [useWebRTC] Waiting for socket connection...', {
        socketContext: !!socketContext,
        socket: !!socketContext?.socket,
        connected: socketContext?.connected,
        socketId: socketContext?.socket?.id
      });
    }
  }, [socketContext]);

  // Initialize WebRTC service event listeners
  useEffect(() => {
    const handleCallStateChange = ({ currentState }) => {
      setCallState(currentState);
      if (onCallStateChange) {
        onCallStateChange(currentState);
      }
    };

    const handleIncomingCall = (callData) => {
      console.log('Incoming call received:', callData);
      setIncomingCall(callData);
      
      if (onIncomingCall) {
        onIncomingCall(callData);
      }
      
      if (autoAcceptCalls) {
        // Auto-accept the call by calling the service directly
        webrtcService.acceptCall(callData).catch(error => {
          console.error('Error auto-accepting call:', error);
        });
      } else {
        toast.info(`Incoming ${callData.callType} call from ${callData.from}`, {
          autoClose: false,
          closeOnClick: false
        });
      }
    };

    const handleLocalStreamReady = (stream) => {
      console.log('Local stream ready:', stream);
      setLocalStream(stream);
      
      // Set local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    };

    const handleRemoteStreamReady = (stream) => {
      console.log('Remote stream ready:', stream);
      setRemoteStream(stream);
      
      // Set remote video element
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    const handleConnectionStateChange = (state) => {
      console.log('Connection state changed:', state);
      setConnectionState(state);
    };

    const handleIceConnectionStateChange = (state) => {
      console.log('ICE connection state changed:', state);
      setIceConnectionState(state);
    };

    const handleVideoToggled = (enabled) => {
      setIsVideoEnabled(enabled);
    };

    const handleAudioToggled = (enabled) => {
      setIsAudioEnabled(enabled);
    };

    const handleCallRejected = (data) => {
      console.log('Call rejected:', data);
      setIncomingCall(null);
      toast.info('Call was rejected');
    };

    const handleCallEnded = (data) => {
      console.log('Call ended:', data);
      setIncomingCall(null);
      setCurrentCall(null);
      toast.info('Call ended');
    };

    const handleCallFailed = (data) => {
      console.log('Call failed:', data);
      setIncomingCall(null);
      setCurrentCall(null);
      toast.error('Call failed');
    };

    const handleError = (errorData) => {
      console.error('WebRTC error:', errorData);
      setError(errorData);
      toast.error(`Call error: ${errorData.error?.message || 'Unknown error'}`);
    };

    const handleCleanup = () => {
      console.log('WebRTC cleanup');
      setLocalStream(null);
      setRemoteStream(null);
      setCurrentCall(null);
      setIncomingCall(null);
      setConnectionState('new');
      setIceConnectionState('new');
      setError(null);
    };

    // Register event listeners
    webrtcService.on('callStateChange', handleCallStateChange);
    webrtcService.on('incomingCall', handleIncomingCall);
    webrtcService.on('localStreamReady', handleLocalStreamReady);
    webrtcService.on('remoteStreamReady', handleRemoteStreamReady);
    webrtcService.on('connectionStateChange', handleConnectionStateChange);
    webrtcService.on('iceConnectionStateChange', handleIceConnectionStateChange);
    webrtcService.on('videoToggled', handleVideoToggled);
    webrtcService.on('audioToggled', handleAudioToggled);
    webrtcService.on('callRejected', handleCallRejected);
    webrtcService.on('callEnded', handleCallEnded);
    webrtcService.on('callFailed', handleCallFailed);
    webrtcService.on('error', handleError);
    webrtcService.on('cleanup', handleCleanup);

    // Cleanup on unmount
    return () => {
      webrtcService.off('callStateChange', handleCallStateChange);
      webrtcService.off('incomingCall', handleIncomingCall);
      webrtcService.off('localStreamReady', handleLocalStreamReady);
      webrtcService.off('remoteStreamReady', handleRemoteStreamReady);
      webrtcService.off('connectionStateChange', handleConnectionStateChange);
      webrtcService.off('iceConnectionStateChange', handleIceConnectionStateChange);
      webrtcService.off('videoToggled', handleVideoToggled);
      webrtcService.off('audioToggled', handleAudioToggled);
      webrtcService.off('callRejected', handleCallRejected);
      webrtcService.off('callEnded', handleCallEnded);
      webrtcService.off('callFailed', handleCallFailed);
      webrtcService.off('error', handleError);
      webrtcService.off('cleanup', handleCleanup);
    };
  }, [autoAcceptCalls, onIncomingCall, onCallStateChange]);

  // Update current call when call state changes
  useEffect(() => {
    setCurrentCall(webrtcService.getCurrentCall());
  }, [callState]);

  /**
   * Start a call
   * @param {string} toUserId - Target user ID
   * @param {string} callType - 'audio' or 'video'
   * @param {string} chatId - Optional chat ID
   */
  const startCall = useCallback(async (toUserId, callType = CALL_TYPES.VIDEO, chatId = null) => {
    try {
      setError(null);

      // Ensure WebRTC service is initialized
      if (!webrtcService.isInitialized) {
        if (socketContext?.socket) {
          console.log('🔧 [useWebRTC] WebRTC not initialized, initializing now...');
          webrtcService.initialize(socketContext.socket);
        } else {
          throw new Error('Socket not available for WebRTC initialization');
        }
      }

      await webrtcService.startCall(toUserId, callType, chatId);
    } catch (error) {
      console.error('Error starting call:', error);
      setError({ type: 'start', error });
    }
  }, [socketContext?.socket]);

  /**
   * Accept an incoming call
   * @param {Object} callData - Call data (optional, uses incomingCall if not provided)
   */
  const acceptCall = useCallback(async (callData = null) => {
    try {
      setError(null);
      const dataToUse = callData || incomingCall;
      if (!dataToUse) {
        throw new Error('No incoming call to accept');
      }

      // Ensure WebRTC service is initialized
      if (!webrtcService.isInitialized) {
        if (socketContext?.socket) {
          console.log('🔧 [useWebRTC] WebRTC not initialized, initializing now...');
          webrtcService.initialize(socketContext.socket);
        } else {
          throw new Error('Socket not available for WebRTC initialization');
        }
      }

      await webrtcService.acceptCall(dataToUse);
      setIncomingCall(null);
    } catch (error) {
      console.error('Error accepting call:', error);
      setError({ type: 'accept', error });
    }
  }, [incomingCall, socketContext?.socket]);

  /**
   * Reject an incoming call
   * @param {Object} callData - Call data (optional, uses incomingCall if not provided)
   */
  const rejectCall = useCallback((callData = null) => {
    try {
      setError(null);
      const dataToUse = callData || incomingCall;
      if (!dataToUse) {
        throw new Error('No incoming call to reject');
      }
      
      webrtcService.rejectCall(dataToUse);
      setIncomingCall(null);
    } catch (error) {
      console.error('Error rejecting call:', error);
      setError({ type: 'reject', error });
    }
  }, [incomingCall]);

  /**
   * End the current call
   */
  const endCall = useCallback(() => {
    try {
      setError(null);
      webrtcService.endCall();
    } catch (error) {
      console.error('Error ending call:', error);
      setError({ type: 'end', error });
    }
  }, []);

  /**
   * Toggle video on/off
   */
  const toggleVideo = useCallback(() => {
    try {
      return webrtcService.toggleVideo();
    } catch (error) {
      console.error('Error toggling video:', error);
      setError({ type: 'toggleVideo', error });
      return false;
    }
  }, []);

  /**
   * Toggle audio on/off
   */
  const toggleAudio = useCallback(() => {
    try {
      return webrtcService.toggleAudio();
    } catch (error) {
      console.error('Error toggling audio:', error);
      setError({ type: 'toggleAudio', error });
      return false;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check if currently in a call
   */
  const isInCall = useCallback(() => {
    return webrtcService.isInCall();
  }, []);

  return {
    // State
    callState,
    currentCall,
    incomingCall,
    isVideoEnabled,
    isAudioEnabled,
    error,
    localStream,
    remoteStream,
    connectionState,
    iceConnectionState,
    
    // Refs for video elements
    localVideoRef,
    remoteVideoRef,
    
    // Methods
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
    clearError,
    isInCall,
    
    // Constants
    CALL_STATES,
    CALL_TYPES
  };
};
