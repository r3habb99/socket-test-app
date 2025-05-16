import React from 'react';
import { Tooltip } from 'antd';
import { 
  LoadingOutlined, 
  CheckOutlined, 
  CheckCircleOutlined, 
  CheckCircleFilled, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { 
  MESSAGE_STATUS, 
  getMessageStatusText, 
  getMessageStatusColor 
} from '../../utils/messageStatus';
import './MessageStatus.css';

/**
 * Message status indicator component
 * @param {Object} props - Component props
 * @param {string} props.status - Message status
 * @param {boolean} props.showText - Whether to show status text
 * @returns {JSX.Element} Message status component
 */
const MessageStatus = ({ status, showText = false }) => {
  // If no status is provided, don't render anything
  if (!status) return null;

  // Get the appropriate icon based on status
  const renderIcon = () => {
    switch (status) {
      case MESSAGE_STATUS.SENDING:
        return <LoadingOutlined className="message-status-icon" />;
      case MESSAGE_STATUS.SENT:
        return <CheckOutlined className="message-status-icon" />;
      case MESSAGE_STATUS.DELIVERED:
        return <CheckCircleOutlined className="message-status-icon" />;
      case MESSAGE_STATUS.READ:
        return <CheckCircleFilled className="message-status-icon" />;
      case MESSAGE_STATUS.FAILED:
        return <ExclamationCircleOutlined className="message-status-icon" />;
      default:
        return null;
    }
  };

  // Get the status text
  const statusText = getMessageStatusText(status);
  
  // Get the status color
  const statusColor = getMessageStatusColor(status);

  return (
    <Tooltip title={statusText} placement="left">
      <div 
        className="message-status-container"
        style={{ color: statusColor }}
      >
        {renderIcon()}
        {showText && <span className="message-status-text">{statusText}</span>}
      </div>
    </Tooltip>
  );
};

export default MessageStatus;
