/**
 * Call Debugger Component - For testing WebRTC call functionality
 */

import React, { useState, useEffect } from 'react';
import { useSocketContext } from '../../../../core/providers/SocketProvider';
import webrtcService from '../../api/webrtcService';

export const CallDebugger = () => {
  const [logs, setLogs] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const socketContext = useSocketContext();

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  useEffect(() => {
    // Get current user info
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      const token = localStorage.getItem('token');

      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        addLog(`👤 Current user: ${user.username || user.email || user._id}`, 'info');
      }

      // Log authentication details
      addLog(`🔑 Auth details:`, 'info');
      addLog(`  - User ID: ${userId || 'Not found'}`, 'info');
      addLog(`  - Username: ${username || 'Not found'}`, 'info');
      addLog(`  - Token: ${token ? 'Present' : 'Missing'}`, 'info');

    } catch (error) {
      addLog('❌ Could not get current user info', 'error');
    }
  }, []);

  useEffect(() => {
    if (socketContext?.socket && !isListening) {
      setIsListening(true);
      
      // Listen for all call-related events
      socketContext.socket.on('call:incoming', (data) => {
        addLog(`📞 Incoming call from ${data.from} (${data.callType})`, 'success');
        console.log('Call debugger - incoming call:', data);
      });

      socketContext.socket.on('call:accepted', (data) => {
        addLog(`✅ Call accepted by ${data.from}`, 'success');
      });

      socketContext.socket.on('call:rejected', (data) => {
        addLog(`❌ Call rejected by ${data.from}`, 'warning');
      });

      socketContext.socket.on('call:ended', (data) => {
        addLog(`📴 Call ended`, 'info');
      });

      socketContext.socket.on('call:error', (data) => {
        addLog(`🚨 Call error: ${data.message}`, 'error');
      });

      // WebRTC events
      socketContext.socket.on('webrtc:offer', (data) => {
        addLog(`🔄 WebRTC offer received`, 'info');
      });

      socketContext.socket.on('webrtc:answer', (data) => {
        addLog(`🔄 WebRTC answer received`, 'info');
      });

      socketContext.socket.on('webrtc:ice-candidate', (data) => {
        addLog(`🧊 ICE candidate received`, 'info');
      });

      addLog(`🔌 Socket connected, listening for call events`, 'success');
    }

    return () => {
      if (socketContext?.socket) {
        socketContext.socket.off('call:incoming');
        socketContext.socket.off('call:accepted');
        socketContext.socket.off('call:rejected');
        socketContext.socket.off('call:ended');
        socketContext.socket.off('call:error');
        socketContext.socket.off('webrtc:offer');
        socketContext.socket.off('webrtc:answer');
        socketContext.socket.off('webrtc:ice-candidate');
      }
    };
  }, [socketContext?.socket, isListening]);

  const checkUserOnline = async () => {
    if (!targetUserId.trim()) {
      addLog('❌ Please enter a target user ID', 'error');
      return;
    }

    try {
      addLog(`🔍 Checking if user ${targetUserId} is online...`, 'info');

      // Emit a test event to check if user is reachable
      socketContext.socket.emit('check-user-online', { userId: targetUserId }, (response) => {
        if (response?.online) {
          addLog(`✅ User ${targetUserId} is online and reachable (${response.socketCount} connections)`, 'success');
        } else {
          addLog(`❌ User ${targetUserId} is not online or not found`, 'error');
        }
        addLog(`🔍 Response: ${JSON.stringify(response)}`, 'info');
      });
    } catch (error) {
      addLog(`❌ Error checking user: ${error.message}`, 'error');
    }
  };

  const checkAllOnlineUsers = () => {
    addLog('🔍 Requesting list of all online users...', 'info');

    socketContext.socket.emit('get-online-users', {}, (response) => {
      if (response?.success) {
        addLog(`👥 Online users (${response.users.length}):`, 'info');
        response.users.forEach(user => {
          addLog(`  - ${user.userId} (${user.username}) - ${user.socketCount} connection(s)`, 'info');
        });
      } else {
        addLog(`❌ Error getting online users: ${response?.error || 'Unknown error'}`, 'error');
      }
    });
  };

  const testSocketAuth = () => {
    addLog('🔐 Testing socket authentication...', 'info');

    if (!socketContext?.socket) {
      addLog('❌ No socket connection', 'error');
      return;
    }

    const socket = socketContext.socket;
    addLog(`🔌 Socket ID: ${socket.id}`, 'info');
    addLog(`🔗 Socket connected: ${socket.connected}`, 'info');
    addLog(`🌐 Socket URL: ${socket.io.uri}`, 'info');

    // Check localStorage auth data
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');

    addLog(`📱 LocalStorage auth:`, 'info');
    addLog(`  - User ID: ${userId || 'Missing'}`, userId ? 'success' : 'error');
    addLog(`  - Username: ${username || 'Missing'}`, username ? 'success' : 'error');
    addLog(`  - Token: ${token ? 'Present' : 'Missing'}`, token ? 'success' : 'error');

    // Check auth data in socket handshake
    const authData = socket.handshake?.auth;
    if (authData) {
      addLog(`🔑 Socket auth data found:`, 'success');
      addLog(`  - User ID: ${authData.userId || 'Missing'}`, 'info');
      addLog(`  - Username: ${authData.username || 'Missing'}`, 'info');
      addLog(`  - Token: ${authData.token ? 'Present' : 'Missing'}`, 'info');
    } else {
      addLog(`❌ No auth data in socket handshake`, 'error');
      addLog(`💡 This means socket was created without auth data`, 'warning');
    }

    // Test a simple ping to server
    socket.emit('ping', { timestamp: Date.now() }, (response) => {
      if (response) {
        addLog(`🏓 Ping response: ${JSON.stringify(response)}`, 'success');
      } else {
        addLog(`❌ No ping response received`, 'error');
      }
    });
  };

  const forceReconnectSocket = () => {
    addLog('🔄 Force reconnecting socket with auth...', 'info');

    if (!socketContext?.socket) {
      addLog('❌ No socket to reconnect', 'error');
      return;
    }

    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');

    if (!userId || !username) {
      addLog('❌ Missing auth data in localStorage', 'error');
      addLog('💡 Please login again', 'warning');
      return;
    }

    try {
      // Disconnect current socket
      socketContext.socket.disconnect();
      addLog('🔌 Disconnected current socket', 'info');

      // Force reconnect (this should trigger the socket provider to create a new connection)
      setTimeout(() => {
        if (socketContext.reconnect) {
          socketContext.reconnect();
          addLog('🔄 Triggered socket reconnection', 'success');
        } else {
          addLog('❌ No reconnect function available', 'error');
        }
      }, 1000);

    } catch (error) {
      addLog(`❌ Error reconnecting: ${error.message}`, 'error');
    }
  };

  const forceInitializeWebRTC = () => {
    addLog('🔧 Force initializing WebRTC service...', 'info');

    if (!socketContext?.socket) {
      addLog('❌ No socket available for initialization', 'error');
      addLog(`🔍 Socket context: ${JSON.stringify({
        hasContext: !!socketContext,
        hasSocket: !!socketContext?.socket,
        connected: socketContext?.connected,
        socketId: socketContext?.socket?.id
      })}`, 'info');
      return;
    }

    try {
      webrtcService.initialize(socketContext.socket);
      addLog('✅ WebRTC service force initialized', 'success');
      addLog(`🔌 Socket ID: ${socketContext.socket.id}`, 'info');
      addLog(`🔍 Socket connected: ${socketContext.socket.connected}`, 'info');
      addLog(`🎧 Event listeners: ${Object.keys(socketContext.socket._callbacks || {}).join(', ')}`, 'info');
    } catch (error) {
      addLog(`❌ Force initialization failed: ${error.message}`, 'error');
    }
  };

  const testIncomingCall = () => {
    addLog('🧪 Testing incoming call simulation...', 'info');

    // Simulate an incoming call
    const mockCallData = {
      callId: 'test-call-123',
      from: 'test-user-456',
      callType: 'audio',
      chatId: 'test-chat',
      timestamp: new Date()
    };

    // Trigger the incoming call handler directly
    if (webrtcService.isInitialized) {
      webrtcService.handleIncomingCall(mockCallData);
      addLog('✅ Mock incoming call triggered', 'success');
    } else {
      addLog('❌ WebRTC service not initialized', 'error');
      addLog('💡 Try clicking "🔧 Force Init" first', 'warning');
    }
  };

  const testDirectCallListener = () => {
    if (!socketContext?.socket) {
      addLog('❌ No socket available', 'error');
      return;
    }

    const socket = socketContext.socket;
    addLog('🔍 Testing direct call:incoming listener...', 'info');

    // Check current listeners
    const listeners = socket.listeners('call:incoming');
    addLog(`🔍 Current call:incoming listeners: ${listeners.length}`, 'info');

    // List all listeners for debugging
    listeners.forEach((listener, index) => {
      addLog(`  Listener ${index + 1}: ${listener.toString().substring(0, 100)}...`, 'info');
    });

    // Add a direct listener for call:incoming
    const handleDirectIncoming = (data) => {
      addLog(`📞 DIRECT call:incoming received: ${JSON.stringify(data)}`, 'success');
    };

    socket.on('call:incoming', handleDirectIncoming);
    addLog('✅ Direct listener registered for call:incoming', 'success');

    // Check listeners again
    const newListeners = socket.listeners('call:incoming');
    addLog(`🔍 New call:incoming listeners count: ${newListeners.length}`, 'info');

    // Clean up after 30 seconds
    setTimeout(() => {
      socket.off('call:incoming', handleDirectIncoming);
      addLog('🧹 Direct listener removed', 'info');
    }, 30000);
  };

  const checkWebRTCListeners = () => {
    if (!socketContext?.socket) {
      addLog('❌ No socket available', 'error');
      return;
    }

    const socket = socketContext.socket;
    addLog('🔍 Checking WebRTC service listeners...', 'info');

    // Check if WebRTC service is initialized
    addLog(`🔧 WebRTC initialized: ${webrtcService.isInitialized}`, 'info');

    // Check socket listeners for WebRTC events
    const webrtcEvents = ['call:incoming', 'call:accepted', 'call:rejected', 'call:ended', 'webrtc:offer', 'webrtc:answer', 'webrtc:ice-candidate'];

    webrtcEvents.forEach(event => {
      const listeners = socket.listeners(event);
      addLog(`📡 ${event}: ${listeners.length} listener(s)`, listeners.length > 0 ? 'success' : 'warning');
    });

    // Check if socket instance matches
    const webrtcSocket = webrtcService.socket;
    const contextSocket = socketContext.socket;
    addLog(`🔌 Socket instances match: ${webrtcSocket === contextSocket}`, webrtcSocket === contextSocket ? 'success' : 'error');
    addLog(`🔌 WebRTC socket ID: ${webrtcSocket?.id || 'undefined'}`, 'info');
    addLog(`🔌 Context socket ID: ${contextSocket?.id || 'undefined'}`, 'info');
  };

  const testCall = async (callType) => {
    if (!targetUserId.trim()) {
      addLog('❌ Please enter a target user ID', 'error');
      return;
    }

    try {
      addLog(`📞 Initiating ${callType} call to ${targetUserId}`, 'info');

      // Initialize WebRTC service if needed
      if (!webrtcService.isInitialized && socketContext?.socket) {
        webrtcService.initialize(socketContext.socket);
        addLog('🔧 WebRTC service initialized', 'info');
      }

      await webrtcService.startCall(targetUserId, callType, 'test-chat');
      addLog(`✅ Call initiated successfully`, 'success');
    } catch (error) {
      addLog(`❌ Call failed: ${error.message}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogStyle = (type) => {
    switch (type) {
      case 'success': return { color: '#52c41a' };
      case 'warning': return { color: '#faad14' };
      case 'error': return { color: '#ff4d4f' };
      default: return { color: '#1890ff' };
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      width: '400px', 
      background: 'white', 
      border: '1px solid #d9d9d9', 
      borderRadius: '6px', 
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 9999,
      maxHeight: '500px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 'bold' }}>
        📞 WebRTC Call Debugger
      </h4>
      
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Target User ID"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '8px'
          }}
        />
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button
            onClick={checkUserOnline}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#722ed1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            🔍 Check Online
          </button>
          <button
            onClick={testSocketAuth}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#13c2c2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            🔐 Test Auth
          </button>
          <button
            onClick={checkAllOnlineUsers}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#52c41a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            👥 All Users
          </button>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button
            onClick={forceReconnectSocket}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#eb2f96',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            🔄 Reconnect
          </button>
          <button
            onClick={forceInitializeWebRTC}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#fa541c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            🔧 Force Init
          </button>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button
            onClick={testIncomingCall}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#fa8c16',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            🧪 Test Incoming
          </button>
          <button
            onClick={testDirectCallListener}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#722ed1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            🔍 Test Direct
          </button>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button
            onClick={checkWebRTCListeners}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#fa541c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            📡 Check Listeners
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => testCall('audio')}
            style={{
              flex: 1,
              padding: '6px 12px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            📞 Audio Call
          </button>
          <button
            onClick={() => testCall('video')}
            style={{
              flex: 1,
              padding: '6px 12px',
              background: '#52c41a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            📹 Video Call
          </button>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        maxHeight: '300px',
        background: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: '4px',
        padding: '8px',
        fontSize: '11px',
        fontFamily: 'monospace'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
            No events yet...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              <span style={{ color: '#666' }}>[{log.timestamp}]</span>{' '}
              <span style={getLogStyle(log.type)}>{log.message}</span>
            </div>
          ))
        )}
      </div>

      <button
        onClick={clearLogs}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          background: '#f5f5f5',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        Clear Logs
      </button>

      <div style={{
        marginTop: '8px',
        fontSize: '10px',
        color: '#666',
        borderTop: '1px solid #f0f0f0',
        paddingTop: '8px'
      }}>
        <div>👤 User: {currentUser?.username || currentUser?.email || currentUser?._id || 'Not logged in'}</div>
        <div>Socket: {socketContext?.connected ? '🟢 Connected' : '🔴 Disconnected'}</div>
        <div>WebRTC: {webrtcService?.isInitialized ? '🟢 Ready' : '🔴 Not Ready'}</div>
      </div>
    </div>
  );
};
