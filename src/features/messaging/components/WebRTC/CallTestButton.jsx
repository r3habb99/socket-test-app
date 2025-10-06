/**
 * Test button component for simulating incoming calls
 * This is for testing purposes only
 */

import React from 'react';
import webrtcService from '../../api/webrtcService';
import { CALL_TYPES } from '../../api/webrtcService';

export const CallTestButton = ({ targetUserId = 'test-user-123' }) => {
  const simulateIncomingCall = (callType = CALL_TYPES.VIDEO) => {
    console.log('🧪 Simulating incoming call...');
    
    // Create mock call data
    const mockCallData = {
      callId: `test-call-${Date.now()}`,
      from: targetUserId,
      callType: callType,
      chatId: 'test-chat-123',
      timestamp: new Date().toISOString()
    };

    // Trigger the incoming call handler directly
    if (webrtcService.isInitialized) {
      webrtcService.handleIncomingCall(mockCallData);
      console.log('✅ Mock incoming call triggered');
    } else {
      console.error('❌ WebRTC service not initialized');
      alert('WebRTC service not initialized. Please ensure you are connected to the socket.');
    }
  };

  const simulateVideoCall = () => {
    simulateIncomingCall(CALL_TYPES.VIDEO);
  };

  const simulateAudioCall = () => {
    simulateIncomingCall(CALL_TYPES.AUDIO);
  };

  const testAudioNotification = async () => {
    try {
      const audioNotificationManager = (await import('../../utils/audioNotifications')).default;
      await audioNotificationManager.playNotificationSound();
      console.log('✅ Audio notification test completed');
    } catch (error) {
      console.error('❌ Audio notification test failed:', error);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      zIndex: 9999,
      background: 'rgba(0,0,0,0.8)',
      padding: '10px',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <h4 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '12px' }}>
        Call Test Controls
      </h4>
      
      <button
        onClick={simulateVideoCall}
        style={{
          padding: '6px 12px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        📹 Test Video Call
      </button>
      
      <button
        onClick={simulateAudioCall}
        style={{
          padding: '6px 12px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        📞 Test Audio Call
      </button>
      
      <button
        onClick={testAudioNotification}
        style={{
          padding: '6px 12px',
          backgroundColor: '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        🔔 Test Audio
      </button>
      
      <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>
        Target: {targetUserId}
      </div>
    </div>
  );
};
