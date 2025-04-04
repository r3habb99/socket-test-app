// components/Post/PostActions.jsx
import React from 'react';
import { api } from '../../api'; // Assuming you've already set up axios API functions

const PostActions = ({ post }) => {
  const handleLike = async () => {
    try {
      await api.put(`/post/${post.id}/like`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      // Optionally, you could update state or rerender here to reflect the like change
    } catch (error) {
      console.error('Error liking post', error);
    }
  };

  const handleRetweet = async () => {
    try {
      await api.post(`/post/${post.id}/retweet`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      // Optionally, you could update state or rerender here to reflect the retweet
    } catch (error) {
      console.error('Error retweeting post', error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/post/${post.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      // Optionally, trigger state update to remove post from view
    } catch (error) {
      console.error('Error deleting post', error);
    }
  };

  return (
    <div className="post-actions">
      <button onClick={handleLike}>Like</button>
      <button onClick={handleRetweet}>Retweet</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

export default PostActions;
