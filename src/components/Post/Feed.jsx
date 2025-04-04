// components/Post/Feed.jsx
import React from "react";
import { CreatePost, PostList } from "./index";

import "./css/feed.css";

export const Feed = () => {
  return (
    <div className="feed-container">
      <CreatePost />
      <PostList />
    </div>
  );
};
