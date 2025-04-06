// components/Post/PostList.jsx
import React from "react";
import { deletePost, likePost, retweetPost } from "../../apis";
import "./css/postList.css";
import { DEFAULT_PROFILE_PIC } from "../../constants";

export const PostList = ({ posts, setPosts }) => {
  const handleLike = async (postId) => {
    try {
      await likePost(postId);
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
      // You can handle retweet UI update here if needed
    } catch (error) {
      console.error("Error retweeting post:", error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  return (
    <div className="post-list-container">
      <h1 className="post-list-title">Posts</h1>
      <div>
        {posts.length === 0 ? (
          <p className="no-post">No posts to show.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <img
                  src={DEFAULT_PROFILE_PIC}
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
