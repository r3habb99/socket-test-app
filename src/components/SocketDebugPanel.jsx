import React, { useState, useEffect } from 'react';
import { useSocketContext } from '../core/providers/SocketProvider';

const SocketDebugPanel = () => {
  const socketContext = useSocketContext();
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState([]);

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-19), { timestamp, message, type }]);
  };

  // Monitor socket state changes
  useEffect(() => {
    if (socketContext.connected) {
      addLog('Socket connected', 'success');
    } else {
      addLog('Socket disconnected', 'error');
    }
  }, [socketContext.connected]);

  useEffect(() => {
    addLog(`Connection status: ${socketContext.connectionStatus}`, 'info');
  }, [socketContext.connectionStatus]);

  useEffect(() => {
    addLog(`Messages count: ${socketContext.messages?.length || 0}`, 'info');
  }, [socketContext.messages?.length]);

  if (!isVisible) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          backgroundColor: '#007bff',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
        onClick={() => setIsVisible(true)}
      >
        Debug
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        width: '300px',
        maxHeight: '400px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 9999,
        fontSize: '11px',
        fontFamily: 'monospace'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <strong>Socket Debug Panel</strong>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <div>Connected: {socketContext.connected ? '✅' : '❌'}</div>
        <div>Status: {socketContext.connectionStatus}</div>
        <div>Messages: {socketContext.messages?.length || 0}</div>
        <div>Current Chat: {socketContext.currentChatId || 'None'}</div>
        <div>Socket ID: {socketContext.socket?.id || 'None'}</div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={() => socketContext.reconnect()}
          style={{ 
            padding: '5px 10px', 
            marginRight: '5px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Reconnect
        </button>
        <button 
          onClick={() => setLogs([])}
          style={{ 
            padding: '5px 10px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Clear Logs
        </button>
      </div>

      <div 
        style={{ 
          maxHeight: '200px', 
          overflowY: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '5px',
          borderRadius: '3px'
        }}
      >
        <strong>Recent Logs:</strong>
        {logs.map((log, index) => (
          <div 
            key={index}
            style={{ 
              color: log.type === 'success' ? '#28a745' : 
                     log.type === 'error' ? '#dc3545' : '#ffffff',
              fontSize: '10px',
              marginTop: '2px'
            }}
          >
            [{log.timestamp}] {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocketDebugPanel;
