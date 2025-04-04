import React, { useState } from "react";
import { createPost } from "../../apis";
import "./css/createPost.css"; // Import your CSS file for styling

export const CreatePost = () => {
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    const postData = { content };

    try {
      await createPost(postData);
      setContent(""); // Clear the form after successful creation
      alert("Post created successfully!");
    } catch (err) {
      setError("Error creating post. Please try again.");
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
        />
        <button type="submit">Post</button>
      </form>
    </div>
  );
};
