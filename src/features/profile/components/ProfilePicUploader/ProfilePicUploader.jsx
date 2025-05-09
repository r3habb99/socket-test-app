import React, { useState } from "react";
import { FaCamera } from "react-icons/fa";
import { uploadProfilePic } from "../../api/profileApi";
import { toast } from "react-toastify";
import "./ProfilePicUploader.css";

export const ProfilePicUploader = ({ setUser }) => {
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (image) {
      try {
        setIsUploading(true);

        const response = await uploadProfilePic(image);

        if (response.error) {
          toast.error(`Failed to upload profile picture: ${response.message}`);
          console.error("Error uploading profile pic:", response.message);
          return;
        }

        // Get the profile picture URL from the response
        const profilePicUrl = response.data?.profilePic ||
                             (response.data?.user?.profilePic) ||
                             null;

        if (profilePicUrl) {
          // Add a timestamp to the URL to prevent caching
          const timestamp = new Date().getTime();
          const updatedUrl = profilePicUrl.includes('?')
            ? `${profilePicUrl}&t=${timestamp}`
            : `${profilePicUrl}?t=${timestamp}`;

          // Update user state with new profile picture
          setUser((prevUser) => ({
            ...prevUser,
            profilePic: updatedUrl,
            // Store the original URL without timestamp as well
            originalProfilePic: profilePicUrl,
          }));
        } else {
          console.warn("No profile picture URL found in response:", response.data);
        }

        toast.success("Profile picture updated successfully!");
        setImage(null);
      } catch (error) {
        toast.error("Failed to upload profile picture. Please try again.");
        console.error("Error uploading profile pic:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="profile-pic-uploader">
      {/* Hidden File Input */}
      <input
        type="file"
        id="fileInput"
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Upload Button */}
      <button
        className="upload-btn"
        onClick={() => document.getElementById("fileInput").click()}
        disabled={isUploading}
      >
        <FaCamera />
      </button>

      {image && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="upload-confirm-btn"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      )}
    </div>
  );
};
