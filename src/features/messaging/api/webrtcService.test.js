/**
 * WebRTC Service Tests
 */

import webrtcService, { CALL_STATES, CALL_TYPES } from './webrtcService';

// Mock socket
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

describe('WebRTC Service', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset service state
    webrtcService.isInitialized = false;
    webrtcService.socket = null;
    webrtcService.currentCall = null;
    webrtcService.callState = CALL_STATES.IDLE;
  });

  describe('Initialization', () => {
    test('should initialize with socket instance', () => {
      webrtcService.initialize(mockSocket);
      
      expect(webrtcService.isInitialized).toBe(true);
      expect(webrtcService.socket).toBe(mockSocket);
      expect(mockSocket.on).toHaveBeenCalledWith('call:incoming', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('call:accepted', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('call:rejected', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('call:ended', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('webrtc:offer', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('webrtc:answer', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('webrtc:ice-candidate', expect.any(Function));
    });

    test('should not initialize twice', () => {
      webrtcService.initialize(mockSocket);
      webrtcService.initialize(mockSocket);
      
      // Should only be called once
      expect(mockSocket.on).toHaveBeenCalledTimes(7);
    });

    test('should handle initialization without socket', () => {
      expect(() => {
        webrtcService.initialize();
      }).not.toThrow();
      
      expect(webrtcService.isInitialized).toBe(true);
      expect(webrtcService.socket).toBe(null);
    });
  });

  describe('Call Management', () => {
    beforeEach(() => {
      webrtcService.initialize(mockSocket);
    });

    test('should start a video call', async () => {
      const mockCallback = jest.fn();
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'call:initiate') {
          callback({ success: true, callId: 'test-call-id' });
        }
      });

      // Mock getUserMedia
      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => []
        })
      };

      // Mock RTCPeerConnection
      global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
        addTrack: jest.fn(),
        createOffer: jest.fn().mockResolvedValue({}),
        setLocalDescription: jest.fn().mockResolvedValue(),
        onicecandidate: null,
        ontrack: null,
        onconnectionstatechange: null,
        oniceconnectionstatechange: null
      }));

      await webrtcService.startCall('user123', CALL_TYPES.VIDEO, 'chat123');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'call:initiate',
        { to: 'user123', callType: CALL_TYPES.VIDEO, chatId: 'chat123' },
        expect.any(Function)
      );
      expect(webrtcService.callState).toBe(CALL_STATES.RINGING);
      expect(webrtcService.currentCall).toEqual({
        callId: 'test-call-id',
        otherUserId: 'user123',
        callType: CALL_TYPES.VIDEO,
        chatId: 'chat123',
        isInitiator: true
      });
    });

    test('should handle call initiation failure', async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'call:initiate') {
          callback({ success: false, error: 'User not available' });
        }
      });

      // Mock getUserMedia
      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => []
        })
      };

      // Mock RTCPeerConnection
      global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
        addTrack: jest.fn(),
        onicecandidate: null,
        ontrack: null,
        onconnectionstatechange: null,
        oniceconnectionstatechange: null
      }));

      await webrtcService.startCall('user123', CALL_TYPES.VIDEO);

      expect(webrtcService.callState).toBe(CALL_STATES.FAILED);
    });

    test('should reject a call', () => {
      const callData = {
        callId: 'test-call-id',
        from: 'user123',
        callType: CALL_TYPES.VIDEO
      };

      webrtcService.rejectCall(callData);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'call:reject',
        { callId: 'test-call-id', from: 'user123' },
        expect.any(Function)
      );
      expect(webrtcService.callState).toBe(CALL_STATES.REJECTED);
    });

    test('should end a call', () => {
      webrtcService.currentCall = {
        callId: 'test-call-id',
        otherUserId: 'user123'
      };

      webrtcService.endCall();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'call:end',
        { callId: 'test-call-id', to: 'user123' },
        expect.any(Function)
      );
      expect(webrtcService.callState).toBe(CALL_STATES.ENDED);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing socket for call initiation', async () => {
      webrtcService.socket = null;

      await expect(webrtcService.startCall('user123')).rejects.toThrow('Socket not available');
    });

    test('should handle missing socket for call acceptance', async () => {
      webrtcService.socket = null;
      const callData = { callId: 'test', from: 'user123', callType: CALL_TYPES.VIDEO };

      await expect(webrtcService.acceptCall(callData)).rejects.toThrow('Socket not available');
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources', () => {
      webrtcService.initialize(mockSocket);
      webrtcService.currentCall = { callId: 'test' };
      webrtcService.callState = CALL_STATES.CONNECTED;

      webrtcService.cleanup();

      expect(webrtcService.currentCall).toBe(null);
      expect(webrtcService.callState).toBe(CALL_STATES.IDLE);
    });

    test('should destroy service', () => {
      webrtcService.initialize(mockSocket);
      
      webrtcService.destroy();

      expect(webrtcService.currentCall).toBe(null);
      expect(webrtcService.callState).toBe(CALL_STATES.IDLE);
    });
  });
});
