import React from "react";
import { likePost } from "../../apis";

export const LikeButton = ({ postId, isLiked, onLike }) => {
  const handleLike = async () => {
    try {
      await likePost(postId);
      onLike(); // Callback to update state in parent component
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  return <button onClick={handleLike}>{isLiked ? "Liked" : "Like"}</button>;
};
