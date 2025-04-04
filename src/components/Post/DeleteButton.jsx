import React from "react";
import { deletePost } from "../../apis";

export const DeleteButton = ({ postId, onDelete }) => {
  const handleDelete = async () => {
    try {
      await deletePost(postId);
      onDelete(); // Callback to update state in parent component (i.e., remove post from list)
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
};
