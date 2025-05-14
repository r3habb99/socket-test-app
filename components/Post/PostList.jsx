import React, { useState } from "react";
import { deletePost, likePost, retweetPost } from "../../apis";
import { getSocket } from "../../apis/socket";
import { useSocket } from "../Messages/SocketProvider";
import "./css/postList.css";
import { DEFAULT_PROFILE_PIC } from "../../constants";

export const PostList = ({ posts, setPosts }) => {
  const [actionInProgress, setActionInProgress] = useState({});
  const { isConnected } = useSocket();

  const handleLike = async (postId) => {
    if (actionInProgress[postId]) return;

    setActionInProgress((prev) => ({ ...prev, [postId]: "like" }));
    try {
      const response = await likePost(postId);
      const updatedPost = response.data;

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, ...updatedPost } : post
        )
      );

      // Emit socket event if connected
      if (isConnected) {
        const socket = getSocket();
        if (socket) {
          socket.emit("post liked", updatedPost);
        }
      }
    } catch (error) {
      console.error("Error liking/unliking post:", error);
    } finally {
      setActionInProgress((prev) => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
    }
  };

  const handleRetweet = async (postId) => {
    if (actionInProgress[postId]) return;

    setActionInProgress((prev) => ({ ...prev, [postId]: "retweet" }));
    try {
      const response = await retweetPost(postId);
      const newRetweet = response.data;

      // Add new retweet at the top and remove duplicate if any
      setPosts((prevPosts) => {
        const filteredPosts = prevPosts.filter(
          (post) => post.id !== newRetweet.id
        );
        return [newRetweet, ...filteredPosts];
      });

      // Emit socket event if connected
      if (isConnected) {
        const socket = getSocket();
        if (socket) {
          socket.emit("post retweeted", newRetweet);
        }
      }
    } catch (error) {
      console.error("Error retweeting post:", error);
    } finally {
      setActionInProgress((prev) => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
    }
  };

  const handleDelete = async (postId) => {
    if (actionInProgress[postId]) return;

    setActionInProgress((prev) => ({ ...prev, [postId]: "delete" }));
    try {
      await deletePost(postId);
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

      // Emit socket event if connected
      if (isConnected) {
        const socket = getSocket();
        if (socket) {
          socket.emit("post deleted", postId);
        }
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setActionInProgress((prev) => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
    }
  };

  const renderPostContent = (post) => {
    const original = post.retweetedFrom;

    // Use postedBy object directly from post
    const postedByUser = post.postedBy || {};

    return (
      <>
        {original && <div className="retweet-label">🔁 You retweeted</div>}

        <div className="post-header">
          <img
            src={DEFAULT_PROFILE_PIC}
            alt={postedByUser.username || "User"}
            className="avatar"
          />
          <span className="username">
            @
            {original?.postedBy?.username || postedByUser.username || "Unknown"}
          </span>
        </div>

        <p className="post-content">{original?.content || post.content}</p>
      </>
    );
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
              {renderPostContent(post)}

              <div className="post-actions">
                <button
                  onClick={() => handleLike(post.id)}
                  className={post.liked ? "liked" : "not-liked"}
                  disabled={actionInProgress[post.id]}
                >
                  {actionInProgress[post.id] === "like"
                    ? "Processing..."
                    : post.liked
                    ? "❤️ Liked"
                    : "🤍 Like"}
                </button>
                <button
                  onClick={() => handleRetweet(post.id)}
                  disabled={actionInProgress[post.id]}
                >
                  {actionInProgress[post.id] === "retweet"
                    ? "Processing..."
                    : "🔁 Retweet"}
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={actionInProgress[post.id]}
                >
                  {actionInProgress[post.id] === "delete"
                    ? "Deleting..."
                    : "🗑️ Delete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
