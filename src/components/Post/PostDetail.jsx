import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Assuming you are using React Router for routing
import { getPostById } from "../../apis";

export const PostDetail = () => {
  const [post, setPost] = useState(null);
  const { id } = useParams(); // Post ID from URL

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostById(id);
        setPost(postData);
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };

    fetchPost();
  }, [id]);

  if (!post) return <p>Loading...</p>;

  return (
    <div>
      <h1>Post Details</h1>
      <p>{post.content}</p>
      <p>Likes: {post.likesCount}</p>
      <p>Retweets: {post.retweetsCount}</p>
      {/* Include LikeButton, RetweetButton, DeleteButton as necessary */}
    </div>
  );
};
