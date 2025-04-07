import React, { useEffect, useState } from "react";
import { deletePost, likePost, retweetPost, getUserById } from "../../apis"; // Assuming you have a function to fetch user by ID
import "./css/postList.css";
import { DEFAULT_PROFILE_PIC } from "../../constants";

export const PostList = ({ posts, setPosts }) => {
  const [users, setUsers] = useState({}); // To store user data by ID

  // Fetch user data when the component mounts (or when posts change)
  useEffect(() => {
    const fetchUsers = async () => {
      const userIds = posts.map((post) => post.postedBy.id);
      const uniqueUserIds = [...new Set(userIds)];

      console.log("Unique user IDs:", uniqueUserIds); // Log the user IDs

      const userPromises = uniqueUserIds.map((userId) => getUserById(userId));
      const userResponses = await Promise.all(userPromises);

      const userMap = userResponses.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      setUsers(userMap);
    };

    fetchUsers();
  }, [posts]);

  const handleLike = async (postId) => {
    try {
      const response = await likePost(postId);
      const updatedPost = response.data;
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, ...updatedPost } : post
        )
      );
    } catch (error) {
      console.error("Error liking/unliking post:", error);
    }
  };

  const handleRetweet = async (postId) => {
    try {
      const response = await retweetPost(postId);
      const newRetweet = response.data;

      setPosts((prevPosts) => [newRetweet, ...prevPosts]);
    } catch (error) {
      console.error("Error retweeting post:", error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const renderPostContent = (post) => {
    const original = post.retweetedFrom;

    // Get the user data for the postedBy field
    const postedByUser = users[post.postedBy.id] || {}; // Accessing the ID correctly if postedBy is an object

    return (
      <>
        {original && <div className="retweet-label">🔁 You retweeted</div>}

        <div className="post-header">
          <img
            src={postedByUser.profilePic || DEFAULT_PROFILE_PIC} // Use profilePic if available
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
                  className={post.liked ? "liked" : "unliked"}
                >
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
