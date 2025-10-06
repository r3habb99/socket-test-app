/**
 * Call Controls Component - Control buttons for calls
 */

import React from 'react';
import './CallControls.css';

export const CallControls = ({
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onEnd,
  showVideoToggle = true
}) => {
  return (
    <div className="call-controls">
      {/* Audio toggle */}
      <button
        className={`control-button audio-button ${isAudioEnabled ? 'enabled' : 'disabled'}`}
        onClick={onToggleAudio}
        title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        <span className="control-icon">
          {isAudioEnabled ? '🎤' : '🔇'}
        </span>
      </button>

      {/* Video toggle (only show for video calls) */}
      {showVideoToggle && (
        <button
          className={`control-button video-button ${isVideoEnabled ? 'enabled' : 'disabled'}`}
          onClick={onToggleVideo}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          <span className="control-icon">
            {isVideoEnabled ? '📹' : '📷'}
          </span>
        </button>
      )}

      {/* End call */}
      <button
        className="control-button end-button"
        onClick={onEnd}
        title="End call"
      >
        <span className="control-icon">📞</span>
      </button>
    </div>
  );
};
