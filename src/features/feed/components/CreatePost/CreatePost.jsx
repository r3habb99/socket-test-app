import React, { useState, useRef } from "react";
import { useSocketContext } from "../../../../features/socket/components/SocketProviderCompat";
// import { useAuthContext } from "../../../../core/providers/AuthProvider";
import { createPost } from "../../api/postApi";
import { toast } from "react-toastify";
import { FaImage, FaTimes, FaGlobeAmericas, FaLock } from "react-icons/fa";
import { Input, Button, Alert } from "antd";
// import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import styles from "./CreatePost.module.css";

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

  // Character limit for tweets
  const MAX_CHARS = 500;

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

    if (content.length > MAX_CHARS) {
      setError(`Post exceeds maximum character limit of ${MAX_CHARS}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Create FormData for the request
      const formData = new FormData();

      // Only append content if it's not empty
      if (content.trim()) {
        formData.append("content", content.trim());
      }

      if (media) {
        formData.append("media", media);
      }

      formData.append("visibility", visibility);

      // Add replyTo parameter if this is a reply
      if (replyTo) {
        formData.append("replyTo", replyTo);
      }


      const response = await createPost(formData);

      if (response.error) {
        console.error("Error creating post/reply:", response.message);
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
      const successMessage = isReply ? "Reply posted successfully!" : "Post created successfully!";
      toast.success(successMessage);

      // Emit socket event if connected
      if (connected && emit) {
        emit("new post", newPost);
      }

      // Call the onPostCreated callback with the new post data
      if (typeof onPostCreated === 'function') {
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
    <div className={`${styles['cp-container']} ${isReply ? styles['reply-mode'] : ''}`}>
      {/* <div className={styles['cp-header']}>
        <h1 className={styles['cp-title']}>{isReply ? 'Reply' : 'Home'}</h1>
      </div> */}

      {error && <Alert message={error} type="error" className={styles['cp-error']} />}

      <div className={styles['cp-form-container']}>
        {/* <div className={styles['cp-avatar']}>
          <Avatar
            src={user?.profilePic || DEFAULT_PROFILE_PIC}
            alt="User Avatar"
            size={48}
          />
        </div> */}

        <form className={styles['cp-form']} onSubmit={handleSubmit}>
          <Input.TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isReply ? "Tweet your reply" : "What's happening?"}
            disabled={isSubmitting}
            rows={isReply ? 3 : 4}
            className={styles['cp-textarea']}
            autoSize={{ minRows: isReply ? 3 : 4, maxRows: 12 }}
          />

          {/* Media preview */}
          {mediaPreview && (
            <div className={styles['cp-media-container']}>
              <img src={mediaPreview} alt="Preview" className={styles['cp-media-preview']} />
              <Button
                type="text"
                className={styles['cp-remove-media']}
                onClick={handleRemoveMedia}
                aria-label="Remove media"
                icon={<FaTimes />}
              />
            </div>
          )}

          <div className={styles['cp-actions']}>
            <div className={styles['cp-actions-left']}>
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
                className={styles['cp-media-btn']}
                onClick={() => fileInputRef.current.click()}
                disabled={isSubmitting}
                aria-label="Add image"
                title="Add image"
                icon={<FaImage />}
              />

              {/* Visibility selector - hide for replies */}
              {!isReply && (
                <div className={styles['cp-visibility-wrapper']}>
                  <select
                    className={styles['cp-visibility']}
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    disabled={isSubmitting}
                    aria-label="Post visibility"
                  >
                    <option value="public">Everyone</option>
                    <option value="private">Only followers</option>
                  </select>
                  {visibility === 'public' ? (
                    <FaGlobeAmericas className={styles['cp-visibility-icon']} />
                  ) : (
                    <FaLock className={styles['cp-visibility-icon']} />
                  )}
                </div>
              )}
            </div>

            <div className={styles['cp-actions-right']}>
              {/* Character count */}
              {content.length > 0 && (
                <div
                  className={`${styles['cp-char-count']} ${
                    content.length > MAX_CHARS * 0.8
                      ? content.length > MAX_CHARS
                        ? styles['cp-char-count-exceeded']
                        : styles['cp-char-count-warning']
                      : ''
                  }`}
                >
                  {content.length > MAX_CHARS && (
                    <span className={styles['cp-char-count-over']}>
                      {content.length - MAX_CHARS}
                    </span>
                  )}
                  {content.length <= MAX_CHARS && (
                    <span>{MAX_CHARS - content.length}</span>
                  )}
                </div>
              )}

              {/* Post/Reply button */}
              <Button
                htmlType="submit"
                type="primary"
                className={`${styles['cp-post-btn']} ${isReply ? styles['reply-btn'] : ''}`}
                disabled={isSubmitting || (!content.trim() && !media) || content.length > MAX_CHARS}
                loading={isSubmitting}
              >
                {isReply ? "Reply" : "Tweet"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
