import React from "react";
import "./UserProfileModal.css";

export const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Profile</h2>
          <button className="close-button" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        <div className="profile-user-info">
          <div className="profile-avatar">
            {user.username?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="profile-details">
            <h3 className="profile-name">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.username || "User"}
            </h3>
            <p className="profile-username">@{user.username || "username"}</p>
          </div>
        </div>
        
        <div className="profile-actions">
          <button className="profile-action-button">
            <i className="fa-solid fa-message"></i>
            Message
          </button>
          <button className="profile-action-button">
            <i className="fa-solid fa-video"></i>
            Video Call
          </button>
          <button className="profile-action-button">
            <i className="fa-solid fa-phone"></i>
            Voice Call
          </button>
        </div>
        
        <div className="profile-info-section">
          <div className="profile-info-item">
            <i className="fa-solid fa-envelope"></i>
            <span>{user.email || "No email available"}</span>
          </div>
          <div className="profile-info-item">
            <i className="fa-solid fa-user"></i>
            <span>User ID: {user._id || user.id || "Unknown"}</span>
          </div>
          <div className="profile-info-item">
            <i className="fa-solid fa-clock"></i>
            <span>Active now</span>
          </div>
        </div>
      </div>
    </div>
  );
};
