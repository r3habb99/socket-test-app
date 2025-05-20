import React from 'react';
import { Tooltip } from 'antd';
import { useSocketContext } from '../../../../features/socket/components/SocketProviderCompat';
import './UserStatus.css';

/**
 * UserStatus component displays online status and last seen time
 * @param {Object} props - Component props
 * @param {string} props.userId - User ID to check status for
 * @param {string} props.size - Size of the status indicator ('small', 'medium', 'large')
 * @param {boolean} props.showText - Whether to show status text
 * @param {boolean} props.showLastSeen - Whether to show last seen time
 * @returns {JSX.Element} UserStatus component
 */
const UserStatus = ({
  userId,
  size = 'medium',
  showText = false,
  showLastSeen = false
}) => {
  const socketContext = useSocketContext();

  if (!userId) return null;

  // Check if user is online
  const isOnline = socketContext.isUserOnline(userId);

  // Get last seen time if user is offline and showLastSeen is true
  const lastSeen = !isOnline && showLastSeen
    ? socketContext.getLastSeen(userId)
    : null;

  // Format last seen time
  const formattedLastSeen = lastSeen
    ? socketContext.formatLastSeen(lastSeen)
    : null;

  // Determine status text
  const statusText = isOnline
    ? 'Online'
    : formattedLastSeen
      ? `Last seen ${formattedLastSeen}`
      : 'Offline';

  // Determine CSS classes
  const statusClass = isOnline ? 'online' : 'offline';
  const sizeClass = `size-${size}`;

  return (
    <Tooltip title={statusText}>
      <div className="user-status-container">
        <div className={`status-indicator ${statusClass} ${sizeClass}`} />
        {showText && (
          <span className="status-text">{statusText}</span>
        )}
      </div>
    </Tooltip>
  );
};

export default UserStatus;
