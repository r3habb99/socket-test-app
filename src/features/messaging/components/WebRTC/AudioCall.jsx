/**
 * Audio Call Component - Interface for active audio calls
 */

import React, { useEffect } from 'react';
import { CallControls } from './CallControls';
import { CALL_STATES } from '../../api/webrtcService';
import { useUserData } from '../../hooks/useUserData';
import { useCallDuration } from '../../hooks/useCallDuration';
import './AudioCall.css';

export const AudioCall = ({
  isAudioEnabled,
  callState,
  currentCall,
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
    <div className="audio-call">
      {/* Audio call interface */}
      <div className="audio-call-content">
        {/* Participant avatar */}
        <div className="participant-avatar">
          <div className="avatar-circle">
            {participantData?.profilePicUrl && !participantLoading ? (
              <img
                src={participantData.profilePicUrl}
                alt={participantData.displayName}
                className="avatar-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span
              className="avatar-initials"
              style={{ display: participantData?.profilePicUrl && !participantLoading ? 'none' : 'flex' }}
            >
              {participantData?.initials || '?'}
            </span>
          </div>

          {/* Audio indicator */}
          <div className={`audio-indicator ${callState === CALL_STATES.CONNECTED ? 'active' : ''}`}>
            <div className="audio-wave"></div>
            <div className="audio-wave"></div>
            <div className="audio-wave"></div>
          </div>
        </div>

        {/* Call info */}
        <div className="call-info">
          <h3 className="participant-name">
            {participantData?.displayName || currentCall?.otherUserId || 'Unknown User'}
          </h3>

          <div className="call-status">
            <span className="call-status-text">{getCallStatusText()}</span>
            {callState === CALL_STATES.CONNECTED && (
              <span className="call-duration">{formattedDuration}</span>
            )}
          </div>
        </div>

        {/* Audio status */}
        <div className="audio-status">
          <div className={`mic-status ${isAudioEnabled ? 'enabled' : 'disabled'}`}>
            <span className="mic-icon">
              {isAudioEnabled ? '🎤' : '🔇'}
            </span>
            <span className="mic-text">
              {isAudioEnabled ? 'Microphone On' : 'Microphone Off'}
            </span>
          </div>
        </div>
      </div>

      {/* Call controls */}
      <div className="audio-call-controls">
        <CallControls
          isAudioEnabled={isAudioEnabled}
          onToggleAudio={onToggleAudio}
          onEnd={onEnd}
          showVideoToggle={false}
        />
      </div>
    </div>
  );
};
