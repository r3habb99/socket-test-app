/**
 * Call Modal Component - Main interface for video/audio calls
 */

import React from 'react';
import { VideoCall } from './VideoCall';
import { AudioCall } from './AudioCall';
import { IncomingCall } from './IncomingCall';
import { OutgoingCall } from './OutgoingCall';
import { CALL_TYPES } from '../../api/webrtcService';
import './CallModal.css';

export const CallModal = ({
  show,
  callType,
  modalType, // 'incoming', 'outgoing', 'active'
  callState,
  currentCall,
  incomingCall,
  localVideoRef,
  remoteVideoRef,
  isVideoEnabled,
  isAudioEnabled,
  onAccept,
  onReject,
  onEnd,
  onToggleVideo,
  onToggleAudio,
  onClose
}) => {
  if (!show) return null;

  const renderCallContent = () => {
    switch (modalType) {
      case 'incoming':
        return (
          <IncomingCall
            callData={incomingCall}
            onAccept={onAccept}
            onReject={onReject}
          />
        );
      
      case 'outgoing':
        return (
          <OutgoingCall
            callData={currentCall}
            callState={callState}
            onEnd={onEnd}
          />
        );
      
      case 'active':
        if (callType === CALL_TYPES.VIDEO) {
          return (
            <VideoCall
              localVideoRef={localVideoRef}
              remoteVideoRef={remoteVideoRef}
              isVideoEnabled={isVideoEnabled}
              isAudioEnabled={isAudioEnabled}
              callState={callState}
              currentCall={currentCall}
              onToggleVideo={onToggleVideo}
              onToggleAudio={onToggleAudio}
              onEnd={onEnd}
            />
          );
        } else {
          return (
            <AudioCall
              isAudioEnabled={isAudioEnabled}
              callState={callState}
              currentCall={currentCall}
              onToggleAudio={onToggleAudio}
              onEnd={onEnd}
            />
          );
        }
      
      default:
        return null;
    }
  };

  return (
    <div className="call-modal-overlay">
      <div className="call-modal">
        <div className="call-modal-header">
          <button 
            className="call-modal-close"
            onClick={onClose}
            aria-label="Close call"
          >
            ×
          </button>
        </div>
        
        <div className="call-modal-content">
          {renderCallContent()}
        </div>
      </div>
    </div>
  );
};
