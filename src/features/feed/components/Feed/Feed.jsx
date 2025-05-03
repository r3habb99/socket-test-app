import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { useAuthContext } from "../../../../core/providers/AuthProvider";
import { getPosts } from "../../api/postApi";
import { CreatePost } from "../CreatePost";
import { PostList } from "../PostList";
import "./Feed.css";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { connected, subscribe } = useSocketContext();
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  const fetchPosts = async () => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getPosts();

      if (response.error) {
        setError(response.message || "Failed to load posts");
        setPosts([]);
        return;
      }

      // Handle nested response structure
      const responseData = response.data;

      // Try to extract posts from various possible locations
      let postsData;

      if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        // Deeply nested: { data: { data: [...] } }
        postsData = responseData.data.data;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        // Nested: { data: [...] }
        postsData = responseData.data;
      } else if (Array.isArray(responseData)) {
        // Direct: [...]
        postsData = responseData;
      }

      if (postsData) {
        console.log(`Found ${postsData.length} posts`);
        setPosts(postsData);
      } else {
        setPosts([]);
        console.error("Unexpected response structure:", response);
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
    if (!connected) return;

    // Handle new posts
    const unsubscribeNewPost = subscribe("new post", (newPost) => {
      console.log("New post received:", newPost);
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    });

    // Handle post likes
    const unsubscribePostLiked = subscribe("post liked", (updatedPost) => {
      console.log("Post liked:", updatedPost);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === updatedPost.id ? updatedPost : post
        )
      );
    });

    // Handle post retweets
    const unsubscribePostRetweeted = subscribe(
      "post retweeted",
      (updatedPost) => {
        console.log("Post retweeted:", updatedPost);
        setPosts((prevPosts) => {
          // Remove the post if it already exists
          const filteredPosts = prevPosts.filter(
            (post) => post.id !== updatedPost.id
          );
          // Add the updated post at the top
          return [updatedPost, ...filteredPosts];
        });
      }
    );

    // Handle post deletions
    const unsubscribePostDeleted = subscribe(
      "post deleted",
      (deletedPostId) => {
        console.log("Post deleted:", deletedPostId);
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== deletedPostId)
        );
      }
    );

    // Clean up subscriptions
    return () => {
      unsubscribeNewPost();
      unsubscribePostLiked();
      unsubscribePostRetweeted();
      unsubscribePostDeleted();
    };
  }, [connected, subscribe]);

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

export default Feed;
