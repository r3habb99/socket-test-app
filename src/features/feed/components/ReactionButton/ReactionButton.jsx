import { useState, useRef, useEffect } from "react";
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

// Storage key for user reactions
const REACTIONS_STORAGE_KEY = 'user_post_reactions';

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
  const hoverTimerRef = useRef(null);
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

  // Get user's reaction from localStorage
  const getUserReaction = (postId) => {
    try {
      const reactions = JSON.parse(localStorage.getItem(REACTIONS_STORAGE_KEY) || '{}');
      return reactions[postId] || null;
    } catch (error) {
      return null;
    }
  };

  // Save user's reaction to localStorage
  const saveUserReaction = (postId, reactionType) => {
    try {
      const reactions = JSON.parse(localStorage.getItem(REACTIONS_STORAGE_KEY) || '{}');
      if (reactionType) {
        reactions[postId] = reactionType;
      } else {
        delete reactions[postId];
      }
      localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(reactions));
    } catch (error) {
      console.error('Error saving reaction:', error);
    }
  };

  // Initialize selected reaction based on like status and stored reaction
  useEffect(() => {
    const liked = isPostLiked(post);
    if (liked) {
      // Check if user has a stored reaction preference
      const storedReactionType = getUserReaction(postId);
      if (storedReactionType) {
        const reaction = REACTIONS.find(r => r.type === storedReactionType);
        setSelectedReaction(reaction || REACTIONS[0]);
      } else {
        setSelectedReaction(REACTIONS[0]); // Default to "like"
      }
    } else {
      setSelectedReaction(null);
      saveUserReaction(postId, null); // Clear stored reaction
    }
  }, [post, postId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

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

    const currentlyLiked = isPostLiked(post);
    const isSameReaction = selectedReaction && reaction && selectedReaction.type === reaction.type;

    try {
      // If clicking the same reaction, unlike the post
      if (currentlyLiked && isSameReaction) {
        const response = await likePost(postId);

        if (response.error) {
          toast.error("Error removing reaction. Please try again.");
          return;
        }

        const updatedPost = response.data;

        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            getPostId(p) === postId ? { ...p, ...updatedPost } : p
          )
        );

        setSelectedReaction(null);
        saveUserReaction(postId, null);

        // Emit socket event if connected
        if (connected && emit) {
          emit("post liked", updatedPost);
        }
      }
      // If not liked, like the post with the selected reaction
      else if (!currentlyLiked && reaction) {
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

        setSelectedReaction(reaction);
        saveUserReaction(postId, reaction.type);

        // Emit socket event if connected
        if (connected && emit) {
          emit("post liked", updatedPost);
        }
      }
      // If already liked but selecting a different reaction, just change the reaction type
      else if (currentlyLiked && reaction && !isSameReaction) {
        setSelectedReaction(reaction);
        saveUserReaction(postId, reaction.type);
        // No API call needed, just visual change
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
      // If already reacted, remove reaction (toggle off)
      handleReaction(selectedReaction);
    } else {
      // Quick react with "like" (default reaction)
      handleReaction(REACTIONS[0]);
    }
  };

  /**
   * Handle long press to show picker
   */
  const handleLongPress = () => {
    setShowPicker(true);
  };

  /**
   * Handle mouse enter - show picker after delay
   */
  const handleMouseEnter = () => {
    // Only on desktop
    if (window.innerWidth > 768) {
      console.log('Mouse entered reaction button, showing picker in 500ms');
      hoverTimerRef.current = setTimeout(() => {
        console.log('Showing reaction picker');
        setShowPicker(true);
      }, 500);
    }
  };

  /**
   * Handle mouse leave - cancel timer and hide picker
   */
  const handleMouseLeave = () => {
    // Clear hover timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  /**
   * Handle picker mouse leave - hide picker
   */
  const handlePickerMouseLeave = () => {
    setShowPicker(false);
  };

  const liked = isPostLiked(post);

  return (
    <div
      className="reaction-button-container post-action-group"
      ref={pickerRef}
      onMouseLeave={handleMouseLeave}
    >
      <Tooltip title={selectedReaction ? `Remove ${selectedReaction.label}` : "React"}>
        <Button
          type="text"
          onClick={handleQuickReaction}
          onMouseEnter={handleMouseEnter}
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
            onMouseEnter={() => {
              // Keep picker open when hovering over it
              if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
                hoverTimerRef.current = null;
              }
            }}
            onMouseLeave={handlePickerMouseLeave}
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

