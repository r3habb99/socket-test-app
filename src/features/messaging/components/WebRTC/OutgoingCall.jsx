/**
 * Outgoing Call Component - Interface for outgoing call status
 */

import React from 'react';
import { CALL_STATES } from '../../api/webrtcService';
import { useUserData } from '../../hooks/useUserData';
import './OutgoingCall.css';

export const OutgoingCall = ({
  callData,
  callState,
  onEnd
}) => {
  // Always call hooks at the top level, before any early returns
  // Fetch recipient user data
  const { userData: recipientData, loading: recipientLoading } = useUserData(callData?.otherUserId);

  // Early return after all hooks have been called
  if (!callData) return null;

  const getCallTypeText = () => {
    return callData.callType === 'video' ? 'Video Call' : 'Audio Call';
  };

  const getCallTypeIcon = () => {
    return callData.callType === 'video' ? '📹' : '📞';
  };

  const getStatusText = () => {
    switch (callState) {
      case CALL_STATES.INITIATING:
        return 'Initiating call...';
      case CALL_STATES.RINGING:
        return 'Calling...';
      case CALL_STATES.CONNECTING:
        return 'Connecting...';
      default:
        return 'Calling...';
    }
  };

  return (
    <div className="outgoing-call">
      <div className="outgoing-call-content">
        {/* Call type indicator */}
        <div className="call-type-indicator">
          <span className="call-type-icon">{getCallTypeIcon()}</span>
          <span className="call-type-text">{getCallTypeText()}</span>
        </div>

        {/* Recipient avatar */}
        <div className="recipient-avatar">
          <div className="avatar-circle calling">
            {recipientData?.profilePicUrl && !recipientLoading ? (
              <img
                src={recipientData.profilePicUrl}
                alt={recipientData.displayName}
                className="avatar-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span
              className="avatar-initials"
              style={{ display: recipientData?.profilePicUrl && !recipientLoading ? 'none' : 'flex' }}
            >
              {recipientData?.initials || '?'}
            </span>
          </div>
        </div>

        {/* Recipient info */}
        <div className="recipient-info">
          <h3 className="recipient-name">
            {recipientLoading ? 'Loading...' : (
              recipientData?.displayName ||
              callData.otherUsername ||
              callData.otherUserId ||
              'Unknown User'
            )}
          </h3>
          <p className="status-text">{getStatusText()}</p>
        </div>

        {/* Loading indicator */}
        <div className="loading-indicator">
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>

        {/* End call button */}
        <div className="call-actions">
          <button
            className="action-button end-button"
            onClick={onEnd}
            title="End call"
          >
            <span className="action-icon end-icon">📞</span>
          </button>
        </div>

        {/* Calling animation */}
        <div className="calling-animation">
          <div className="wave wave-1"></div>
          <div className="wave wave-2"></div>
          <div className="wave wave-3"></div>
        </div>
      </div>
    </div>
  );
};
