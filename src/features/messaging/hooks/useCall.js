/**
 * Simplified hook for call functionality
 */

import { useState, useCallback } from 'react';
import { useWebRTC } from './useWebRTC';
import { CALL_STATES, CALL_TYPES } from '../api/webrtcService';

/**
 * Simplified hook for call functionality
 * @param {Object} options - Configuration options
 * @returns {Object} Call state and methods
 */
export const useCall = (options = {}) => {
  const [showCallModal, setShowCallModal] = useState(false);
  const [callModalType, setCallModalType] = useState('incoming'); // 'incoming', 'outgoing', 'active'

  const webrtc = useWebRTC({
    ...options,
    onIncomingCall: (callData) => {
      setCallModalType('incoming');
      setShowCallModal(true);
      if (options.onIncomingCall) {
        options.onIncomingCall(callData);
      }
    },
    onCallStateChange: (state) => {
      if (state === CALL_STATES.INITIATING || state === CALL_STATES.RINGING) {
        setCallModalType('outgoing');
        setShowCallModal(true);
      } else if (state === CALL_STATES.CONNECTING || state === CALL_STATES.CONNECTED) {
        setCallModalType('active');
        setShowCallModal(true);
      } else if (state === CALL_STATES.ENDED || state === CALL_STATES.REJECTED || state === CALL_STATES.FAILED) {
        setShowCallModal(false);
      }

      if (options.onCallStateChange) {
        options.onCallStateChange(state);
      }
    }
  });

  /**
   * Start a video call
   * @param {string} toUserId - Target user ID
   * @param {string} chatId - Optional chat ID
   */
  const startVideoCall = useCallback(async (toUserId, chatId = null) => {
    setCallModalType('outgoing');
    setShowCallModal(true);
    await webrtc.startCall(toUserId, CALL_TYPES.VIDEO, chatId);
  }, [webrtc]);

  /**
   * Start an audio call
   * @param {string} toUserId - Target user ID
   * @param {string} chatId - Optional chat ID
   */
  const startAudioCall = useCallback(async (toUserId, chatId = null) => {
    setCallModalType('outgoing');
    setShowCallModal(true);
    await webrtc.startCall(toUserId, CALL_TYPES.AUDIO, chatId);
  }, [webrtc]);

  /**
   * Accept the incoming call
   */
  const acceptCall = useCallback(async () => {
    await webrtc.acceptCall();
  }, [webrtc]);

  /**
   * Reject the incoming call
   */
  const rejectCall = useCallback(() => {
    webrtc.rejectCall();
    setShowCallModal(false);
  }, [webrtc]);

  /**
   * End the current call
   */
  const endCall = useCallback(() => {
    webrtc.endCall();
    setShowCallModal(false);
  }, [webrtc]);

  /**
   * Close call modal
   */
  const closeCallModal = useCallback(() => {
    if (webrtc.isInCall()) {
      endCall();
    } else {
      setShowCallModal(false);
    }
  }, [webrtc, endCall]);

  /**
   * Check if user is available for calls
   * @returns {boolean}
   */
  const isAvailableForCalls = useCallback(() => {
    return webrtc.callState === CALL_STATES.IDLE;
  }, [webrtc.callState]);

  /**
   * Get call status text
   * @returns {string}
   */
  const getCallStatusText = useCallback(() => {
    switch (webrtc.callState) {
      case CALL_STATES.IDLE:
        return 'Available';
      case CALL_STATES.INITIATING:
        return 'Initiating call...';
      case CALL_STATES.RINGING:
        return webrtc.currentCall?.isInitiator ? 'Calling...' : 'Incoming call';
      case CALL_STATES.CONNECTING:
        return 'Connecting...';
      case CALL_STATES.CONNECTED:
        return 'In call';
      case CALL_STATES.ENDED:
        return 'Call ended';
      case CALL_STATES.REJECTED:
        return 'Call rejected';
      case CALL_STATES.FAILED:
        return 'Call failed';
      default:
        return 'Unknown';
    }
  }, [webrtc.callState, webrtc.currentCall]);

  return {
    // WebRTC state and methods
    ...webrtc,
    
    // Call modal state
    showCallModal,
    callModalType,
    
    // Simplified methods
    startVideoCall,
    startAudioCall,
    acceptCall,
    rejectCall,
    endCall,
    closeCallModal,
    
    // Utility methods
    isAvailableForCalls,
    getCallStatusText
  };
};
