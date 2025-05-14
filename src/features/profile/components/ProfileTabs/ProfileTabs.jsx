import React from 'react';
import './ProfileTabs.css';

export const ProfileTabs = ({ activeTab, setActiveTab, userId }) => {
  return (
    <div className="profile-tabs-container">
      <div
        className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
        onClick={() => setActiveTab('posts')}
      >
        Posts
      </div>
      <div
        className={`profile-tab ${activeTab === 'replies' ? 'active' : ''}`}
        onClick={() => setActiveTab('replies')}
      >
        Replies
      </div>
      <div
        className={`profile-tab ${activeTab === 'media' ? 'active' : ''}`}
        onClick={() => setActiveTab('media')}
      >
        Media
      </div>
      <div
        className={`profile-tab ${activeTab === 'likes' ? 'active' : ''}`}
        onClick={() => setActiveTab('likes')}
      >
        Likes
      </div>
    </div>
  );
};
