/**
 * Video Call Component - Interface for active video calls
 */

import React, { useEffect } from 'react';
import { CallControls } from './CallControls';
import { CALL_STATES } from '../../api/webrtcService';
import { useUserData } from '../../hooks/useUserData';
import { useCallDuration } from '../../hooks/useCallDuration';
import './VideoCall.css';

export const VideoCall = ({
  localVideoRef,
  remoteVideoRef,
  isVideoEnabled,
  isAudioEnabled,
  callState,
  currentCall,
  onToggleVideo,
  onToggleAudio,
  onEnd
}) => {
  // Fetch participant user data
  const { userData: participantData, loading: participantLoading } = useUserData(currentCall?.otherUserId);

  // Call duration tracking
  const { formattedDuration, startTimer, stopTimer, resetTimer } = useCallDuration();

  // Start/stop timer based on call state
  useEffect(() => {
    if (callState === CALL_STATES.CONNECTED) {
      startTimer();
    } else if (callState === CALL_STATES.IDLE || callState === CALL_STATES.ENDED) {
      stopTimer();
      resetTimer();
    }

    return () => {
      stopTimer();
    };
  }, [callState, startTimer, stopTimer, resetTimer]);

  const getCallStatusText = () => {
    switch (callState) {
      case CALL_STATES.CONNECTING:
        return 'Connecting...';
      case CALL_STATES.CONNECTED:
        return 'Connected';
      default:
        return '';
    }
  };

  return (
    <div className="video-call">
      {/* Remote video (main view) */}
      <div className="remote-video-container">
        <video
          ref={remoteVideoRef}
          className="remote-video"
          autoPlay
          playsInline
          muted={false}
        />
        
        {/* Call status overlay */}
        <div className="call-status-overlay">
          <div className="call-status">
            <span className="call-status-text">{getCallStatusText()}</span>
            {callState === CALL_STATES.CONNECTED && (
              <span className="call-duration">{formattedDuration}</span>
            )}
          </div>
        </div>

        {/* Participant info */}
        {currentCall && (
          <div className="participant-info">
            <div className="participant-avatar">
              {participantData?.profilePicUrl && !participantLoading ? (
                <img
                  src={participantData.profilePicUrl}
                  alt={participantData.displayName}
                  className="participant-avatar-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <span
                className="participant-avatar-initials"
                style={{ display: participantData?.profilePicUrl && !participantLoading ? 'none' : 'flex' }}
              >
                {participantData?.initials || '?'}
              </span>
            </div>
            <span className="participant-name">
              {participantData?.displayName || currentCall.otherUserId || 'Unknown User'}
            </span>
          </div>
        )}
      </div>

      {/* Local video (picture-in-picture) */}
      <div className="local-video-container">
        <video
          ref={localVideoRef}
          className={`local-video ${!isVideoEnabled ? 'video-disabled' : ''}`}
          autoPlay
          playsInline
          muted={true}
        />
        
        {!isVideoEnabled && (
          <div className="video-disabled-overlay">
            <div className="video-disabled-icon">📷</div>
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="video-call-controls">
        <CallControls
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          onToggleVideo={onToggleVideo}
          onToggleAudio={onToggleAudio}
          onEnd={onEnd}
          showVideoToggle={true}
        />
      </div>
    </div>
  );
};
