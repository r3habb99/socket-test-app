import React, { useState, useRef } from "react";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { createPost } from "../../api/postApi";
import { toast } from "react-toastify";
import { FaImage, FaTimes } from "react-icons/fa";
import "./CreatePost.css";

export const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [visibility, setVisibility] = useState("public");
  const fileInputRef = useRef(null);
  const { connected, emit } = useSocketContext();

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.match('image.*')) {
        setError("Please select an image file");
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size should not exceed 5MB");
        return;
      }

      setMedia(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);

      setError(null);
    }
  };

  // Remove selected media
  const handleRemoveMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !media) {
      setError("Post must have content or media");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append("content", content);

      if (media) {
        formData.append("media", media);
      }

      formData.append("visibility", visibility);

      const response = await createPost(formData);

      if (response.error) {
        setError(response.message || "Error creating post");
        return;
      }

      const newPost = response.data;

      // Reset form
      setContent("");
      setMedia(null);
      setMediaPreview(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Show success message
      toast.success("Post created successfully!");

      // Emit socket event if connected
      if (connected && emit) {
        emit("new post", newPost);
      }

      onPostCreated(); // 🔄 Trigger refresh
    } catch (err) {
      setError("Error creating post. Please try again.");
      toast.error("Failed to create post. Please try again.");
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

        {/* Media preview */}
        {mediaPreview && (
          <div className="media-preview-container">
            <img src={mediaPreview} alt="Preview" className="media-preview" />
            <button
              type="button"
              className="remove-media-btn"
              onClick={handleRemoveMedia}
            >
              <FaTimes />
            </button>
          </div>
        )}

        <div className="post-actions">
          {/* Hidden file input */}
          <input
            type="file"
            id="media-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: "none" }}
          />

          {/* Media upload button */}
          <button
            type="button"
            className="media-upload-btn"
            onClick={() => fileInputRef.current.click()}
            disabled={isSubmitting}
          >
            <FaImage />
          </button>

          {/* Post button */}
          <button
            type="submit"
            className="post-btn"
            disabled={isSubmitting || (!content.trim() && !media)}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};
