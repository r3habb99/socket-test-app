import React, { useState, useRef, useEffect } from "react";
import { Button, Tooltip } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { likePost } from "../../api/postApi";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import "./ReactionButton.css";

// Reaction types with emojis
const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like", color: "#1d9bf0" },
  { type: "love", emoji: "❤️", label: "Love", color: "#f91880" },
  { type: "laugh", emoji: "😂", label: "Haha", color: "#f7b928" },
  { type: "wow", emoji: "😮", label: "Wow", color: "#f7b928" },
  { type: "sad", emoji: "😢", label: "Sad", color: "#5890ff" },
  { type: "angry", emoji: "😠", label: "Angry", color: "#f05e16" },
];

/**
 * ReactionButton component for multi-reaction system
 * @param {Object} props - Component props
 * @param {Object} props.post - The post object
 * @param {Function} props.setPosts - Function to update posts state
 * @param {Function} props.onPostsUpdated - Callback function to refresh posts
 * @param {Function} props.getPostId - Function to get post ID
 * @returns {JSX.Element} ReactionButton component
 */
export const ReactionButton = ({ 
  post, 
  setPosts, 
  onPostsUpdated,
  getPostId 
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const pickerRef = useRef(null);
  const { connected, emit } = useSocketContext();
  const postId = getPostId(post);

  // Check if post is liked by current user
  const isPostLiked = (post) => {
    if (post.liked !== undefined) {
      return post.liked;
    }
    const userId = localStorage.getItem('userId');
    return post.likes && Array.isArray(post.likes) && post.likes.includes(userId);
  };

  // Get current user's reaction (for now, we'll use the like status)
  useEffect(() => {
    if (isPostLiked(post)) {
      setSelectedReaction(REACTIONS[0]); // Default to "like"
    } else {
      setSelectedReaction(null);
    }
  }, [post]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  /**
   * Handle reaction selection
   */
  const handleReaction = async (reaction) => {
    if (actionInProgress) return;

    setActionInProgress(true);
    setShowPicker(false);

    try {
      const response = await likePost(postId);

      if (response.error) {
        toast.error("Error reacting to post. Please try again.");
        return;
      }

      const updatedPost = response.data;

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          getPostId(p) === postId ? { ...p, ...updatedPost } : p
        )
      );

      // Update selected reaction
      if (isPostLiked(updatedPost)) {
        setSelectedReaction(reaction);
      } else {
        setSelectedReaction(null);
      }

      // Emit socket event if connected
      if (connected && emit) {
        emit("post liked", updatedPost);
      }
    } catch (error) {
      toast.error("Error reacting to post. Please try again.");
    } finally {
      setActionInProgress(false);
      if (onPostsUpdated) onPostsUpdated();
    }
  };

  /**
   * Handle quick reaction (click on button)
   */
  const handleQuickReaction = () => {
    if (selectedReaction) {
      // If already reacted, remove reaction
      handleReaction(null);
    } else {
      // Quick react with "like"
      handleReaction(REACTIONS[0]);
    }
  };

  /**
   * Handle long press to show picker
   */
  const handleLongPress = () => {
    setShowPicker(true);
  };

  const liked = isPostLiked(post);

  return (
    <div className="reaction-button-container post-action-group" ref={pickerRef}>
      <Tooltip title={selectedReaction ? `Remove ${selectedReaction.label}` : "React"}>
        <Button
          type="text"
          onClick={handleQuickReaction}
          onMouseEnter={() => {
            // Show picker on hover (desktop)
            if (window.innerWidth > 768) {
              const timer = setTimeout(() => setShowPicker(true), 500);
              return () => clearTimeout(timer);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            handleLongPress();
          }}
          className={`post-action-button reaction-button ${liked ? 'reacted' : ''}`}
          disabled={actionInProgress}
          aria-label="React"
        >
          <motion.span
            key={selectedReaction?.type || 'default'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="reaction-emoji"
          >
            {selectedReaction ? selectedReaction.emoji : "👍"}
          </motion.span>
        </Button>
      </Tooltip>
      
      <span className="post-action-count">{post.likes?.length || 0}</span>

      {/* Reaction Picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            className="reaction-picker"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {REACTIONS.map((reaction, index) => (
              <motion.button
                key={reaction.type}
                className="reaction-option"
                onClick={() => handleReaction(reaction)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                whileHover={{ 
                  scale: 1.3,
                  y: -8,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.9 }}
                title={reaction.label}
              >
                <span className="reaction-emoji-large">{reaction.emoji}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReactionButton;

