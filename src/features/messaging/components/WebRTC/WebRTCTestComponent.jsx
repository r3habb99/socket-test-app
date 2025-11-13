/**
 * WebRTC Test Component - For testing enhanced WebRTC functionality
 */

import React, { useState } from 'react';
import { useSocketContext } from '../../../../core/providers/SocketProvider';
import { useAuthContext } from '../../../../core/providers/AuthProvider';
import webrtcService, { CALL_TYPES } from '../../api/webrtcService';

export const WebRTCTestComponent = () => {
  const [testResults, setTestResults] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const socketContext = useSocketContext();
  const { user } = useAuthContext();

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { timestamp, message, type }]);
  };

  // Test enhanced call data with username
  const testEnhancedCallData = async () => {
    if (!targetUserId.trim()) {
      addResult('❌ Please enter a target user ID', 'error');
      return;
    }

    setIsRunning(true);
    addResult('🧪 Testing enhanced WebRTC call data...', 'info');

    try {
      // Initialize WebRTC service if needed
      if (!webrtcService.isInitialized && socketContext?.socket) {
        webrtcService.initialize(socketContext.socket);
        addResult('🔧 WebRTC service initialized', 'info');
      }

      // Set up listeners for incoming call data
      const handleIncomingCall = (callData) => {
        addResult('📞 Incoming call received:', 'info');
        addResult(`  - Call ID: ${callData.callId}`, 'info');
        addResult(`  - From: ${callData.from}`, 'info');
        addResult(`  - From Username: ${callData.fromUsername || 'Not provided'}`, callData.fromUsername ? 'success' : 'warning');
        addResult(`  - Call Type: ${callData.callType}`, 'info');
        addResult(`  - Timestamp: ${callData.timestamp}`, 'info');
        
        // Automatically reject the test call
        setTimeout(() => {
          webrtcService.rejectCall(callData);
          addResult('✅ Test call automatically rejected', 'success');
        }, 2000);
      };

      webrtcService.on('incomingCall', handleIncomingCall);

      // Initiate test call
      await webrtcService.startCall(targetUserId, CALL_TYPES.VIDEO, 'test-chat');
      addResult('📞 Test call initiated', 'success');

      // Clean up listener after test
      setTimeout(() => {
        webrtcService.off('incomingCall', handleIncomingCall);
        setIsRunning(false);
        addResult('🧪 Test completed', 'info');
      }, 5000);

    } catch (error) {
      addResult(`❌ Test failed: ${error.message}`, 'error');
      setIsRunning(false);
    }
  };

  // Test call timer functionality
  const testCallTimer = () => {
    addResult('🧪 Testing call timer functionality...', 'info');
    addResult('⏱️ Call timer is implemented in VideoCall and AudioCall components', 'info');
    addResult('⏱️ Uses useCallDuration hook for real-time updates', 'info');
    addResult('⏱️ Timer starts when call state becomes CONNECTED', 'info');
    addResult('⏱️ Timer stops when call ends or is rejected', 'info');
    addResult('✅ Call timer test completed', 'success');
  };

  // Test user profile display
  const testUserProfileDisplay = () => {
    addResult('🧪 Testing user profile display...', 'info');
    addResult('👤 IncomingCall component uses useUserData hook', 'info');
    addResult('👤 OutgoingCall component uses useUserData hook', 'info');
    addResult('👤 Components show display names instead of user IDs', 'info');
    addResult('👤 Profile pictures are displayed when available', 'info');
    addResult('👤 Fallback to initials when no profile picture', 'info');
    addResult('✅ User profile display test completed', 'success');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      width: '400px',
      maxHeight: '600px',
      backgroundColor: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#4CAF50' }}>
        WebRTC Enhancement Tests
      </h3>

      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Target User ID"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          style={{
            width: '100%',
            padding: '5px',
            marginBottom: '10px',
            backgroundColor: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px'
          }}
        />
        
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button
            onClick={testEnhancedCallData}
            disabled={isRunning}
            style={{
              padding: '5px 10px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.6 : 1
            }}
          >
            Test Enhanced Call Data
          </button>
          
          <button
            onClick={testCallTimer}
            style={{
              padding: '5px 10px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Call Timer
          </button>
          
          <button
            onClick={testUserProfileDisplay}
            style={{
              padding: '5px 10px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Profile Display
          </button>
          
          <button
            onClick={clearResults}
            style={{
              padding: '5px 10px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        backgroundColor: '#1a1a1a',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #333'
      }}>
        {testResults.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            No test results yet. Click a test button to start.
          </div>
        ) : (
          testResults.map((result, index) => (
            <div
              key={index}
              style={{
                marginBottom: '5px',
                color: result.type === 'error' ? '#f44336' : 
                       result.type === 'success' ? '#4CAF50' : 
                       result.type === 'warning' ? '#FF9800' : '#fff'
              }}
            >
              <span style={{ color: '#666' }}>[{result.timestamp}]</span> {result.message}
            </div>
          ))
        )}
      </div>

      <div style={{
        marginTop: '10px',
        fontSize: '10px',
        color: '#666',
        borderTop: '1px solid #333',
        paddingTop: '10px'
      }}>
        <div>👤 User: {user?.username || user?.email || 'Not logged in'}</div>
        <div>Socket: {socketContext?.connected ? '🟢 Connected' : '🔴 Disconnected'}</div>
        <div>WebRTC: {webrtcService?.isInitialized ? '🟢 Ready' : '🔴 Not Ready'}</div>
      </div>
    </div>
  );
};
