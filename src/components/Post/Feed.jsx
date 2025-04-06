// components/Post/Feed.jsx
import React, { useEffect, useState } from "react";
import { CreatePost, PostList } from "./index";
import { getPosts } from "../../apis";

import "./css/feed.css";

export const Feed = () => {
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      const data = await getPosts();
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        setPosts([]);
        console.error("Unexpected response:", data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="feed-container">
      <CreatePost onPostCreated={fetchPosts} />
      <PostList posts={posts} setPosts={setPosts} />
    </div>
  );
};
