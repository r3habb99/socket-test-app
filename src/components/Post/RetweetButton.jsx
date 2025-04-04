import React from "react";
import { retweetPost } from "../../apis";

export const RetweetButton = ({ postId }) => {
  const handleRetweet = async () => {
    try {
      await retweetPost(postId);
      alert("Post retweeted successfully!");
    } catch (error) {
      console.error("Error retweeting post:", error);
    }
  };

  return <button onClick={handleRetweet}>Retweet</button>;
};
