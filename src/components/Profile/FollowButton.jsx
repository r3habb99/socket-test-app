import React from "react";
import "./css/profile.css";

export const FollowButton = ({ isFollowing, toggleFollow }) => {
  return (
    <button
      className={`follow-btn ${isFollowing ? "following" : ""}`}
      onClick={toggleFollow}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
};
