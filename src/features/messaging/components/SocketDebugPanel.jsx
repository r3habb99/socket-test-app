import React, { useState, useEffect } from 'react';
import { Button, Card, Switch, Typography, Collapse, Badge, Tag, List, Divider } from 'antd';
import { BugOutlined, SettingOutlined, CloseOutlined } from '@ant-design/icons';
import { setDebugMode, isDebugMode, getJoinedRooms } from '../utils/socketDebug';
import { useSocketContext } from '../../../core/providers/SocketProvider';
import './SocketDebugPanel.css';

const { Text } = Typography;
const { Panel } = Collapse;

/**
 * Socket Debug Panel Component
 * Provides a UI for debugging socket connections and events
 */
export const SocketDebugPanel = () => {
  const [visible, setVisible] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(isDebugMode());
  const [joinedRooms, setJoinedRooms] = useState([]);
  const socket = useSocketContext();

  // Update joined rooms every second
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setJoinedRooms(getJoinedRooms());
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  // Toggle debug mode
  const handleToggleDebug = (checked) => {
    setDebugMode(checked);
    setDebugEnabled(checked);
  };

  // Reconnect socket
  const handleReconnect = () => {
    if (socket && socket.reconnect) {
      socket.reconnect();
    }
  };

  // Get connection status badge
  const getStatusBadge = () => {
    if (!socket) return <Badge status="default" text="Not initialized" />;

    switch (socket.connectionStatus) {
      case 'connected':
        return <Badge status="success" text="Connected" />;
      case 'connecting':
        return <Badge status="processing" text="Connecting..." />;
      case 'reconnecting':
        return <Badge status="warning" text={`Reconnecting (Attempt ${socket.reconnectAttempts})`} />;
      case 'disconnected':
        return <Badge status="error" text="Disconnected" />;
      default:
        return <Badge status="default" text="Unknown" />;
    }
  };

  // Toggle panel visibility
  const togglePanel = () => {
    setVisible(!visible);
  };

  if (!visible) {
    return (
      <Button
        type="primary"
        shape="circle"
        icon={<BugOutlined />}
        className="socket-debug-toggle"
        onClick={togglePanel}
        title="Socket Debug Panel"
      />
    );
  }

  return (
    <div className="socket-debug-panel">
      <Card
        title={
          <div className="socket-debug-header">
            <BugOutlined /> Socket Debug Panel
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={togglePanel}
              className="close-button"
            />
          </div>
        }
        size="small"
      >
        <div className="socket-debug-content">
          <div className="socket-debug-controls">
            <div className="debug-switch">
              <Switch
                checked={debugEnabled}
                onChange={handleToggleDebug}
                size="small"
              />
              <Text style={{ marginLeft: 8 }}>Enable Debug Mode</Text>
            </div>
            <Button
              type="primary"
              size="small"
              onClick={handleReconnect}
              icon={<SettingOutlined />}
              disabled={!socket || socket.connectionStatus === 'connected'}
            >
              Reconnect
            </Button>
          </div>

          <Divider orientation="left">Connection Status</Divider>
          <div className="status-section">
            {getStatusBadge()}
          </div>

          <Divider orientation="left">Joined Rooms</Divider>
          <div className="rooms-section">
            {joinedRooms.length === 0 ? (
              <Text type="secondary">No rooms joined</Text>
            ) : (
              <List
                size="small"
                dataSource={joinedRooms}
                renderItem={room => (
                  <List.Item>
                    <Tag color="blue">{room}</Tag>
                  </List.Item>
                )}
              />
            )}
          </div>

          <Collapse ghost>
            <Panel header="Connection Details" key="1">
              <div className="details-section">
                <div className="detail-item">
                  <Text strong>Socket ID:</Text>
                  <Text>{socket?.socket?.id || 'Not connected'}</Text>
                </div>
                <div className="detail-item">
                  <Text strong>Current Chat:</Text>
                  <Text>{socket?.currentChatId || 'None'}</Text>
                </div>
                <div className="detail-item">
                  <Text strong>Typing Users:</Text>
                  <Text>
                    {Object.keys(socket?.typingUsers || {}).length > 0
                      ? Object.values(socket?.typingUsers || {})
                          .map(user => user.username)
                          .join(', ')
                      : 'None'}
                  </Text>
                </div>
              </div>
            </Panel>
          </Collapse>
        </div>
      </Card>
    </div>
  );
};
