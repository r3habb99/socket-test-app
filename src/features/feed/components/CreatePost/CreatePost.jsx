import React, { useState, useRef } from "react";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { createPost } from "../../api/postApi";
import { toast } from "react-toastify";
import { FaImage, FaTimes } from "react-icons/fa";
import { Input, Button, Alert } from "antd";
import "./CreatePost.css";

/**
 * CreatePost component for creating new posts or replies
 * @param {Object} props - Component props
 * @param {Function} props.onPostCreated - Callback function when a post is created
 * @param {string} [props.replyTo] - ID of the post this is replying to
 * @param {boolean} [props.isReply=false] - Whether this is a reply form
 * @returns {JSX.Element} CreatePost component
 */
export const CreatePost = ({ onPostCreated, replyTo, isReply = false }) => {
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

      // Add replyTo parameter if this is a reply
      if (replyTo) {
        formData.append("replyTo", replyTo);
      }

      console.log("Submitting post/reply with data:", {
        content: content.trim(),
        hasMedia: !!media,
        replyTo: replyTo || null,
        isReply
      });

      const response = await createPost(formData);
      console.log("Create post/reply API response:", response);

      if (response.error) {
        console.error("Error creating post/reply:", response.message);
        setError(response.message || "Error creating post");
        return;
      }

      const newPost = response.data;
      console.log("New post/reply created:", newPost);

      // Reset form
      setContent("");
      setMedia(null);
      setMediaPreview(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Show success message
      const successMessage = isReply ? "Reply posted successfully!" : "Post created successfully!";
      toast.success(successMessage);

      // Emit socket event if connected
      if (connected && emit) {
        emit("new post", newPost);
      }

      // Call the onPostCreated callback with the new post data
      if (typeof onPostCreated === 'function') {
        console.log("Calling onPostCreated callback with new post data");
        onPostCreated(newPost);
      } else {
        console.warn("onPostCreated is not a function:", onPostCreated);
      }
    } catch (err) {
      const errorMessage = isReply ? "Error posting reply. Please try again." : "Error creating post. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`create-post-container ${isReply ? 'reply-mode' : ''}`}>
      <h1 className="create-post-title">{isReply ? 'Reply' : 'Home'}</h1>
      {error && <Alert message={error} type="error" className="error" />}
      <form className="create-post-form" onSubmit={handleSubmit}>
        <Input.TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isReply ? "Tweet your reply" : "What's happening?"}
          disabled={isSubmitting}
          rows={isReply ? 3 : 4}
          className="create-post-form textarea"
        />

        {/* Media preview */}
        {mediaPreview && (
          <div className="media-preview-container">
            <img src={mediaPreview} alt="Preview" className="media-preview" />
            <Button
              type="button"
              className="remove-media-btn"
              onClick={handleRemoveMedia}
              aria-label="Remove media"
              icon={<FaTimes />}
            />
          </div>
        )}

        <div className="post-actions">
          <div className="post-actions-left">
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
            <Button
              type="text"
              className="media-upload-btn"
              onClick={() => fileInputRef.current.click()}
              disabled={isSubmitting}
              aria-label="Add image"
              title="Add image"
              icon={<FaImage />}
            />

            {/* Visibility selector - hide for replies */}
            {!isReply && (
              <select
                className="visibility-selector"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                disabled={isSubmitting}
                aria-label="Post visibility"
              >
                <option value="public">Everyone</option>
                <option value="private">Only followers</option>
              </select>
            )}
          </div>

          {/* Post/Reply button */}
          <Button
            type="submit"
            className={`post-btn ${isReply ? 'reply-btn' : ''}`}
            disabled={isSubmitting || (!content.trim() && !media)}
          >
            {isSubmitting
              ? (isReply ? "Replying..." : "Posting...")
              : (isReply ? "Reply" : "Tweet")}
          </Button>
        </div>
      </form>
    </div>
  );
};
