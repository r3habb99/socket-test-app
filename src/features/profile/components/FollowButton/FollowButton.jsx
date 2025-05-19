import React, { useState, useEffect } from "react";
import "./FollowButton.css";

export const FollowButton = ({ isFollowing, toggleFollow }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [buttonState, setButtonState] = useState(isFollowing);

  // Update button state when isFollowing prop changes
  useEffect(() => {
    setButtonState(isFollowing);
  }, [isFollowing]);

  const handleClick = () => {
    // Call the parent's toggleFollow function
    toggleFollow();
  };

  return (
    <button
      className={`follow-btn ${buttonState ? "following" : ""} ${
        isHovering && buttonState ? "hovering" : ""
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {buttonState ? (isHovering ? "Unfollow" : "Following") : "Follow"}
    </button>
  );
};
