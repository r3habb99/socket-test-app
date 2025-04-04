import React, { useState, useEffect } from "react";
import { deletePost, getPosts, likePost, retweetPost } from "../../apis";
import "./css/postList.css"; // Assuming you have some CSS for styling
import { DEFAULT_PROFILE_PIC } from "../../constants";

export const PostList = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts();
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          setPosts([]); // fallback to avoid crash
          console.error("Unexpected response:", data);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, []);

  const handleLike = async (postId) => {
    try {
      await likePost(postId);
      // Optimistically update the like count here if needed
      setPosts(
        posts.map((post) =>
          post.id === postId ? { ...post, liked: true } : post
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleRetweet = async (postId) => {
    try {
      await retweetPost(postId);
      // Add retweeted post to the list or update retweet count
    } catch (error) {
      console.error("Error retweeting post:", error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      setPosts(posts.filter((post) => post.id !== postId)); // Remove deleted post from state
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  return (
    <div className="post-list-container">
      <h1 className="post-list-title">Posts</h1>
      <div>
        {posts.length === 0 ? (
          <p>No posts to show.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <img
                  src={DEFAULT_PROFILE_PIC}
                  //   src={post.postedBy?.profilePic || "/default-avatar.png"}
                  alt={post.postedBy?.username || "User"}
                  className="avatar"
                />
                <span className="username">
                  @{post.postedBy?.username || "Unknown"}
                </span>
              </div>

              <p>{post.content}</p>

              <div className="post-actions">
                <button onClick={() => handleLike(post.id)}>
                  {post.liked ? "❤️ Liked" : "🤍 Like"}
                </button>
                <button onClick={() => handleRetweet(post.id)}>
                  🔁 Retweet
                </button>
                <button onClick={() => handleDelete(post.id)}>🗑️ Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
