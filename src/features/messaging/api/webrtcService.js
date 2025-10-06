/**
 * WebRTC Service for managing peer connections and call state
 */

import audioNotificationManager from '../utils/audioNotifications';

// No longer need socketApi imports since we use direct socket calls

// WebRTC configuration
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

const PEER_CONNECTION_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10
};

// Call states
export const CALL_STATES = {
  IDLE: 'idle',
  INITIATING: 'initiating',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ENDED: 'ended',
  REJECTED: 'rejected',
  MISSED: 'missed',
  FAILED: 'failed'
};

// Call types
export const CALL_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video'
};

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentCall = null;
    this.callState = CALL_STATES.IDLE;
    this.eventListeners = {};
    this.unsubscribeFunctions = [];
    this.isInitialized = false;
    this.socket = null;
  }

  /**
   * Initialize the WebRTC service with socket instance
   * @param {Object} socketInstance - Socket instance from SocketProvider
   */
  initialize(socketInstance = null) {
    console.log('🔧 [WebRTC] Initialize called, isInitialized:', this.isInitialized);

    try {
      // Store socket instance if provided
      if (socketInstance) {
        console.log('🔧 [WebRTC] Updating socket instance');
        this.socket = socketInstance;
      }

      // Always initialize socket event listeners if we have a socket
      if (this.socket) {
        console.log('🔧 [WebRTC] Socket available, initializing listeners...');
        this.initializeSocketListeners();
      } else {
        console.warn('🔧 [WebRTC] No socket instance available for initialization');
      }

      if (!this.isInitialized) {
        this.isInitialized = true;
        console.log('✅ [WebRTC] Service initialized successfully');
      } else {
        console.log('✅ [WebRTC] Service re-initialized with new socket');
      }
    } catch (error) {
      console.error('❌ [WebRTC] Failed to initialize service:', error);
      throw error;
    }
  }

  /**
   * Initialize socket event listeners for WebRTC
   */
  initializeSocketListeners() {
    if (!this.socket) {
      console.warn('No socket instance available for WebRTC listeners');
      return;
    }

    console.log('🔧 [WebRTC] Starting to initialize socket listeners...');
    console.log('🔧 [WebRTC] Socket ID:', this.socket.id);
    console.log('🔧 [WebRTC] Socket connected:', this.socket.connected);

    try {
      // Call management events
      console.log('🔧 [WebRTC] Registering call:incoming listener...');
      this.socket.on('call:incoming', (data) => {
        console.log('📞 [WebRTC] call:incoming handler called with data:', data);
        try {
          this.handleIncomingCall(data);
        } catch (error) {
          console.error('❌ [WebRTC] Error in handleIncomingCall:', error);
        }
      });

      console.log('🔧 [WebRTC] Registering call:accepted listener...');
      this.socket.on('call:accepted', (data) => this.handleCallAccepted(data));

      console.log('🔧 [WebRTC] Registering call:rejected listener...');
      this.socket.on('call:rejected', (data) => this.handleCallRejected(data));

      console.log('🔧 [WebRTC] Registering call:ended listener...');
      this.socket.on('call:ended', (data) => this.handleCallEnded(data));

      // WebRTC signaling events
      console.log('🔧 [WebRTC] Registering WebRTC signaling listeners...');
      this.socket.on('webrtc:offer', (data) => this.handleOffer(data));
      this.socket.on('webrtc:answer', (data) => this.handleAnswer(data));
      this.socket.on('webrtc:ice-candidate', (data) => this.handleIceCandidate(data));

      // Verify listeners were registered
      const callIncomingListeners = this.socket.listeners('call:incoming');
      console.log('✅ [WebRTC] call:incoming listeners registered:', callIncomingListeners.length);

      console.log('✅ [WebRTC] All socket listeners initialized successfully');
    } catch (error) {
      console.error('❌ [WebRTC] Error initializing socket listeners:', error);
      throw error;
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        cb => cb !== callback
      );
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebRTC event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get user media (camera/microphone)
   * @param {boolean} video - Include video
   * @param {boolean} audio - Include audio
   * @returns {Promise<MediaStream>}
   */
  async getUserMedia(video = true, audio = true) {
    try {
      const constraints = {
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      
      console.log('Got user media:', stream);
      this.emit('localStreamReady', stream);
      
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      this.emit('error', { type: 'media', error });
      throw error;
    }
  }

  /**
   * Create peer connection
   * @returns {RTCPeerConnection}
   */
  createPeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event);
      this.remoteStream = event.streams[0];
      this.emit('remoteStreamReady', this.remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentCall) {
        console.log('Sending ICE candidate:', event.candidate);
        if (this.socket) {
          this.socket.emit('webrtc:ice-candidate', {
            callId: this.currentCall.callId,
            to: this.currentCall.otherUserId,
            candidate: event.candidate
          });
        }
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      this.emit('connectionStateChange', this.peerConnection.connectionState);
      
      if (this.peerConnection.connectionState === 'connected') {
        this.setCallState(CALL_STATES.CONNECTED);
      } else if (this.peerConnection.connectionState === 'failed') {
        this.setCallState(CALL_STATES.FAILED);
        this.handleCallFailed();
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
      this.emit('iceConnectionStateChange', this.peerConnection.iceConnectionState);
    };

    return this.peerConnection;
  }

  /**
   * Set call state and emit event
   * @param {string} state - New call state
   */
  setCallState(state) {
    const previousState = this.callState;
    this.callState = state;
    console.log(`Call state changed: ${previousState} -> ${state}`);
    this.emit('callStateChange', { previousState, currentState: state });
  }

  /**
   * Start a call
   * @param {string} toUserId - Target user ID
   * @param {string} callType - 'audio' or 'video'
   * @param {string} chatId - Optional chat ID
   * @returns {Promise<void>}
   */
  async startCall(toUserId, callType = CALL_TYPES.VIDEO, chatId = null) {
    try {
      console.log(`Starting ${callType} call to user:`, toUserId);

      // Check socket availability first
      if (!this.socket) {
        throw new Error('Socket not available');
      }

      this.setCallState(CALL_STATES.INITIATING);

      // Get user media
      const includeVideo = callType === CALL_TYPES.VIDEO;
      await this.getUserMedia(includeVideo, true);

      // Create peer connection
      this.createPeerConnection();

      // Add local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });
      }

      // Initiate call via socket

      this.socket.emit('call:initiate', { to: toUserId, callType, chatId }, (response) => {
        if (response && response.success) {
          this.currentCall = {
            callId: response.callId,
            otherUserId: toUserId,
            callType,
            chatId,
            isInitiator: true
          };
          this.setCallState(CALL_STATES.RINGING);
          console.log('Call initiated successfully:', response);

          // Emit outgoing call event for UI
          this.emit('outgoingCall', this.currentCall);
        } else {
          console.error('Failed to initiate call:', response);
          this.setCallState(CALL_STATES.FAILED);
          this.emit('error', { type: 'initiate', error: response?.error || 'Unknown error' });
        }
      });
      
    } catch (error) {
      console.error('Error starting call:', error);
      this.setCallState(CALL_STATES.FAILED);
      this.emit('error', { type: 'start', error });
      throw error;
    }
  }

  /**
   * Accept an incoming call
   * @param {Object} callData - Call data from incoming call event
   * @returns {Promise<void>}
   */
  async acceptCall(callData) {
    try {
      console.log('Accepting call:', callData);

      // Stop ringtone when accepting call
      audioNotificationManager.stopIncomingCallRingtone();

      // Check socket availability first
      if (!this.socket) {
        throw new Error('Socket not available');
      }

      this.setCallState(CALL_STATES.CONNECTING);
      
      // Get user media
      const includeVideo = callData.callType === CALL_TYPES.VIDEO;
      await this.getUserMedia(includeVideo, true);
      
      // Create peer connection
      this.createPeerConnection();
      
      // Add local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });
      }
      
      // Store call data
      this.currentCall = {
        callId: callData.callId,
        otherUserId: callData.from,
        callType: callData.callType,
        chatId: callData.chatId,
        isInitiator: false
      };
      
      // Accept call via socket
      this.socket.emit('call:accept', { callId: callData.callId, from: callData.from }, (response) => {
        if (response && response.success) {
          console.log('Call accepted successfully:', response);
        } else {
          console.error('Failed to accept call:', response);
          this.setCallState(CALL_STATES.FAILED);
          this.emit('error', { type: 'accept', error: response?.error || 'Unknown error' });
        }
      });
      
    } catch (error) {
      console.error('Error accepting call:', error);
      this.setCallState(CALL_STATES.FAILED);
      this.emit('error', { type: 'accept', error });
      throw error;
    }
  }

  /**
   * Reject an incoming call
   * @param {Object} callData - Call data from incoming call event
   */
  rejectCall(callData) {
    console.log('Rejecting call:', callData);

    // Stop ringtone when rejecting call
    audioNotificationManager.stopIncomingCallRingtone();

    if (this.socket) {
      this.socket.emit('call:reject', { callId: callData.callId, from: callData.from }, (response) => {
        if (response && response.success) {
          console.log('Call rejected successfully:', response);
        } else {
          console.error('Failed to reject call:', response);
        }
      });
    }

    this.setCallState(CALL_STATES.REJECTED);
    this.cleanup();
  }

  /**
   * End the current call
   */
  endCall() {
    if (!this.currentCall) {
      console.warn('No active call to end');
      return;
    }
    
    console.log('Ending call:', this.currentCall.callId);
    
    if (this.socket) {
      this.socket.emit('call:end', { callId: this.currentCall.callId, to: this.currentCall.otherUserId }, (response) => {
        if (response && response.success) {
          console.log('Call ended successfully:', response);
        } else {
          console.error('Failed to end call:', response);
        }
      });
    }
    
    this.setCallState(CALL_STATES.ENDED);
    this.cleanup();
  }

  /**
   * Handle incoming call
   * @param {Object} data - Call data
   */
  handleIncomingCall(data) {
    console.log('📞 [WebRTC] handleIncomingCall called with:', data);
    console.log('📞 [WebRTC] Current call state:', this.callState);
    console.log('📞 [WebRTC] Setting call state to RINGING');

    this.setCallState(CALL_STATES.RINGING);

    // Start audio notification for incoming call
    try {
      audioNotificationManager.startIncomingCallRingtone();
      console.log('🔊 [WebRTC] Started ringtone for incoming call');
    } catch (error) {
      console.warn('⚠️ [WebRTC] Failed to start ringtone:', error);
    }

    console.log('📞 [WebRTC] Emitting incomingCall event');
    this.emit('incomingCall', data);

    console.log('📞 [WebRTC] handleIncomingCall completed');
  }

  /**
   * Handle call accepted
   * @param {Object} data - Call data
   */
  async handleCallAccepted(data) {
    console.log('Call accepted:', data);

    if (!this.currentCall || this.currentCall.callId !== data.callId) {
      console.warn('Received call accepted for unknown call');
      return;
    }

    this.setCallState(CALL_STATES.CONNECTING);

    try {
      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      if (this.socket) {
        this.socket.emit('webrtc:offer', {
          callId: this.currentCall.callId,
          to: this.currentCall.otherUserId,
          sdp: offer
        });
      }
      console.log('Sent WebRTC offer');

    } catch (error) {
      console.error('Error creating offer:', error);
      this.setCallState(CALL_STATES.FAILED);
      this.emit('error', { type: 'offer', error });
    }
  }

  /**
   * Handle call rejected
   * @param {Object} data - Call data
   */
  handleCallRejected(data) {
    console.log('Call rejected:', data);

    // Stop ringtone
    audioNotificationManager.stopIncomingCallRingtone();

    this.setCallState(CALL_STATES.REJECTED);
    this.emit('callRejected', data);
    this.cleanup();
  }

  /**
   * Handle call ended
   * @param {Object} data - Call data
   */
  handleCallEnded(data) {
    console.log('Call ended:', data);

    // Stop ringtone
    audioNotificationManager.stopIncomingCallRingtone();

    this.setCallState(CALL_STATES.ENDED);
    this.emit('callEnded', data);
    this.cleanup();
  }

  /**
   * Handle WebRTC offer
   * @param {Object} data - Offer data
   */
  async handleOffer(data) {
    console.log('Received WebRTC offer:', data);

    if (!this.currentCall || this.currentCall.callId !== data.callId) {
      console.warn('Received offer for unknown call');
      return;
    }

    try {
      await this.peerConnection.setRemoteDescription(data.sdp);

      // Create and send answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      if (this.socket) {
        this.socket.emit('webrtc:answer', {
          callId: this.currentCall.callId,
          to: this.currentCall.otherUserId,
          sdp: answer
        });
      }
      console.log('Sent WebRTC answer');

    } catch (error) {
      console.error('Error handling offer:', error);
      this.setCallState(CALL_STATES.FAILED);
      this.emit('error', { type: 'offer', error });
    }
  }

  /**
   * Handle WebRTC answer
   * @param {Object} data - Answer data
   */
  async handleAnswer(data) {
    console.log('Received WebRTC answer:', data);

    if (!this.currentCall || this.currentCall.callId !== data.callId) {
      console.warn('Received answer for unknown call');
      return;
    }

    try {
      await this.peerConnection.setRemoteDescription(data.sdp);
      console.log('Set remote description from answer');

    } catch (error) {
      console.error('Error handling answer:', error);
      this.setCallState(CALL_STATES.FAILED);
      this.emit('error', { type: 'answer', error });
    }
  }

  /**
   * Handle ICE candidate
   * @param {Object} data - ICE candidate data
   */
  async handleIceCandidate(data) {
    console.log('Received ICE candidate:', data);

    if (!this.currentCall || this.currentCall.callId !== data.callId) {
      console.warn('Received ICE candidate for unknown call');
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(data.candidate);
      console.log('Added ICE candidate');

    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  /**
   * Handle call failed
   */
  handleCallFailed() {
    console.log('Call failed');
    this.emit('callFailed', { callId: this.currentCall?.callId });
    this.cleanup();
  }

  /**
   * Toggle video on/off
   */
  toggleVideo() {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.emit('videoToggled', videoTrack.enabled);
      return videoTrack.enabled;
    }
    return false;
  }

  /**
   * Toggle audio on/off
   */
  toggleAudio() {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.emit('audioToggled', audioTrack.enabled);
      return audioTrack.enabled;
    }
    return false;
  }

  /**
   * Get current call state
   * @returns {string}
   */
  getCallState() {
    return this.callState;
  }

  /**
   * Get current call info
   * @returns {Object|null}
   */
  getCurrentCall() {
    return this.currentCall;
  }

  /**
   * Check if currently in a call
   * @returns {boolean}
   */
  isInCall() {
    return this.callState === CALL_STATES.CONNECTED ||
           this.callState === CALL_STATES.CONNECTING ||
           this.callState === CALL_STATES.RINGING;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    console.log('Cleaning up WebRTC resources');

    // Stop ringtone
    audioNotificationManager.stopIncomingCallRingtone();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear remote stream
    this.remoteStream = null;

    // Clear current call
    this.currentCall = null;

    // Reset state
    this.setCallState(CALL_STATES.IDLE);

    this.emit('cleanup');
  }

  /**
   * Destroy the service and cleanup all resources
   */
  destroy() {
    console.log('Destroying WebRTC service');

    // Cleanup resources
    this.cleanup();

    // Unsubscribe from socket events
    this.unsubscribeFunctions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from socket event:', error);
      }
    });
    this.unsubscribeFunctions = [];

    // Clear event listeners
    this.eventListeners = {};
  }
}

// Create singleton instance
const webrtcService = new WebRTCService();

export default webrtcService;
export { WebRTCService };
