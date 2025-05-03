import React, { useState } from "react";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { createPost } from "../../api/postApi";
import "./CreatePost.css";

export const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { connected, emit } = useSocketContext();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createPost({ content });
      
      if (response.error) {
        setError(response.message || "Error creating post");
        return;
      }
      
      const newPost = response.data;
      setContent("");
      setError(null);

      // Emit socket event if connected
      if (connected && emit) {
        emit("new post", newPost);
      }

      onPostCreated(); // 🔄 Trigger refresh
    } catch (err) {
      setError("Error creating post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post-container">
      <h1 className="create-post-title">Create a New Post</h1>
      {error && <p className="error">{error}</p>}
      <form className="create-post-form" onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
};
