import React, { useState } from "react";
import "./FollowButton.css";

export const FollowButton = ({ isFollowing, toggleFollow }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <button
      className={`follow-btn ${isFollowing ? "following" : ""} ${
        isHovering && isFollowing ? "hovering" : ""
      }`}
      onClick={toggleFollow}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isFollowing ? (isHovering ? "Unfollow" : "Following") : "Follow"}
    </button>
  );
};
