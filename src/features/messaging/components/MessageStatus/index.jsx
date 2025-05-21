import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'antd';
import { 
  CheckOutlined, 
  CheckCircleOutlined, 
  CheckCircleFilled, 
  LoadingOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { MESSAGE_STATUS, getMessageStatusText } from '../../utils/messageStatus';
import './MessageStatus.css';

/**
 * Message Status Component
 * Displays the status of a message (sending, sent, delivered, read, failed)
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Message status
 * @param {boolean} props.showText - Whether to show status text
 * @param {string} props.className - Additional CSS class
 * @returns {JSX.Element} Message status component
 */
const MessageStatus = ({ status, showText = false, className = '' }) => {
  // Get icon based on status
  const getIcon = () => {
    switch (status) {
      case MESSAGE_STATUS.SENDING:
        return <LoadingOutlined className="message-status-icon sending" />;
      case MESSAGE_STATUS.SENT:
        return <CheckOutlined className="message-status-icon sent" />;
      case MESSAGE_STATUS.DELIVERED:
        return <CheckCircleOutlined className="message-status-icon delivered" />;
      case MESSAGE_STATUS.READ:
        return <CheckCircleFilled className="message-status-icon read" />;
      case MESSAGE_STATUS.FAILED:
        return <ExclamationCircleOutlined className="message-status-icon failed" />;
      default:
        return null;
    }
  };

  // Get status text
  const statusText = getMessageStatusText(status);

  // If no status or no icon, return null
  if (!status || !getIcon()) {
    return null;
  }

  return (
    <Tooltip title={statusText}>
      <div className={`message-status ${className}`}>
        {getIcon()}
        {showText && <span className="message-status-text">{statusText}</span>}
      </div>
    </Tooltip>
  );
};

MessageStatus.propTypes = {
  status: PropTypes.oneOf(Object.values(MESSAGE_STATUS)),
  showText: PropTypes.bool,
  className: PropTypes.string,
};

export default MessageStatus;
