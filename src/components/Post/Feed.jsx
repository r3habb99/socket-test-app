// components/Post/Feed.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreatePost, PostList } from "./index";
import { getPosts } from "../../apis";
import { isTokenExpired } from "../../apis/auth";
import {
  onNewPost,
  onPostLiked,
  onPostRetweeted,
  onPostDeleted,
} from "../../apis/socket";
import { useSocket } from "../Messages/SocketProvider";

import "./css/feed.css";

export const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const checkAuthentication = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found, redirecting to login");
      navigate("/login");
      return false;
    }

    if (isTokenExpired(token)) {
      console.error("Token is expired, redirecting to login");
      localStorage.removeItem("token");
      navigate("/login");
      return false;
    }

    return true;
  };

  const fetchPosts = async () => {
    if (!checkAuthentication()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getPosts();
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        setPosts([]);
        console.error("Unexpected response:", data);
        setError("Failed to load posts. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up real-time updates for posts
  useEffect(() => {
    if (!isConnected) return;

    // Handle new posts
    const unsubscribeNewPost = onNewPost((newPost) => {
      console.log("New post received:", newPost);
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    });

    // Handle post likes
    const unsubscribePostLiked = onPostLiked((updatedPost) => {
      console.log("Post liked:", updatedPost);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === updatedPost.id ? updatedPost : post
        )
      );
    });

    // Handle post retweets
    const unsubscribePostRetweeted = onPostRetweeted((updatedPost) => {
      console.log("Post retweeted:", updatedPost);
      setPosts((prevPosts) => {
        // Remove the post if it already exists
        const filteredPosts = prevPosts.filter(
          (post) => post.id !== updatedPost.id
        );
        // Add the updated post at the top
        return [updatedPost, ...filteredPosts];
      });
    });

    // Handle post deletions
    const unsubscribePostDeleted = onPostDeleted((deletedPostId) => {
      console.log("Post deleted:", deletedPostId);
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== deletedPostId)
      );
    });

    // Clean up subscriptions
    return () => {
      unsubscribeNewPost();
      unsubscribePostLiked();
      unsubscribePostRetweeted();
      unsubscribePostDeleted();
    };
  }, [isConnected]);

  return (
    <div className="feed-container">
      <CreatePost onPostCreated={fetchPosts} />
      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : error ? (
        <div className="error-message">
          {error}
          <button onClick={fetchPosts} className="retry-button">
            Retry
          </button>
        </div>
      ) : (
        <PostList posts={posts} setPosts={setPosts} />
      )}
    </div>
  );
};
