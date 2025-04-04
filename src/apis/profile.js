import axios from "axios";
import { getAuthHeaders, handleApiError } from "./axios";

// Upload Profile Picture
export const uploadProfilePic = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const response = await axios.post("user/upload/profile-picture", formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data; // Assuming response.data contains the uploaded image data
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    handleApiError(error);
  }
};

// Upload Cover Photo
export const uploadCoverPhoto = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const response = await axios.post("user/upload/cover-photo", formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data; // Assuming response.data contains the uploaded cover photo data
  } catch (error) {
    console.error("Error uploading cover photo:", error);
    handleApiError(error);
  }
};

// Follow/Unfollow a User
export const followUser = async (userId) => {
  try {
    const response = await axios.put(`/user/${userId}/follow`, null, {
      headers: getAuthHeaders(),
    });
    return response.data; // Response contains the updated data of the followed user
  } catch (error) {
    console.error("Error following/unfollowing user:", error);
    handleApiError(error);
  }
};

// Get Following of a User
export const getUserFollowing = async (userId) => {
  try {
    const response = await axios.get(`/user/${userId}/following`, {
      headers: getAuthHeaders(),
    });
    console.log(response, "response following");
    return response.data.data; // Assuming response.data contains the following array
  } catch (error) {
    console.error("Error fetching following list:", error);
    handleApiError(error);
  }
};

// Get Followers of a User
export const getUserFollowers = async (userId) => {
  try {
    const response = await axios.get(`/user/${userId}/followers`, {
      headers: getAuthHeaders(),
    });
    console.log(response, "response");
    return response.data.data; // Assuming response.data contains the followers array
  } catch (error) {
    console.error("Error fetching followers list:", error);
    handleApiError(error);
  }
};
