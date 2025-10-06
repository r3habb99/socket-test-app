/**
 * Incoming Call Component - Interface for incoming call notifications
 */

import React from 'react';
import { useUserData } from '../../hooks/useUserData';
import './IncomingCall.css';

export const IncomingCall = ({
  callData,
  onAccept,
  onReject
}) => {
  if (!callData) return null;

  // Fetch caller user data
  const { userData: callerData, loading: callerLoading } = useUserData(callData.from);

  const getCallTypeText = () => {
    return callData.callType === 'video' ? 'Video Call' : 'Audio Call';
  };

  const getCallTypeIcon = () => {
    return callData.callType === 'video' ? '📹' : '📞';
  };

  return (
    <div className="incoming-call">
      <div className="incoming-call-content">
        {/* Call type indicator */}
        <div className="call-type-indicator">
          <span className="call-type-icon">{getCallTypeIcon()}</span>
          <span className="call-type-text">{getCallTypeText()}</span>
        </div>

        {/* Caller avatar */}
        <div className="caller-avatar">
          <div className="avatar-circle pulsing">
            {callerData?.profilePicUrl && !callerLoading ? (
              <img
                src={callerData.profilePicUrl}
                alt={callerData.displayName}
                className="avatar-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span
              className="avatar-initials"
              style={{ display: callerData?.profilePicUrl && !callerLoading ? 'none' : 'flex' }}
            >
              {callerData?.initials || '?'}
            </span>
          </div>
        </div>

        {/* Caller info */}
        <div className="caller-info">
          <h3 className="caller-name">
            {callerData?.displayName || callData.from || 'Unknown User'}
          </h3>
          <p className="incoming-text">Incoming {callData.callType} call</p>
        </div>

        {/* Call actions */}
        <div className="call-actions">
          <button
            className="action-button reject-button"
            onClick={() => onReject(callData)}
            title="Reject call"
          >
            <span className="action-icon reject-icon">📞</span>
          </button>

          <button
            className="action-button accept-button"
            onClick={() => onAccept(callData)}
            title="Accept call"
          >
            <span className="action-icon accept-icon">📞</span>
          </button>
        </div>

        {/* Ringing animation */}
        <div className="ringing-animation">
          <div className="ring ring-1"></div>
          <div className="ring ring-2"></div>
          <div className="ring ring-3"></div>
        </div>
      </div>
    </div>
  );
};
