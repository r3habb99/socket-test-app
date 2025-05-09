import React, { useState, useEffect, useCallback } from "react";
import { FaCamera } from "react-icons/fa";
import { uploadProfilePic, fetchUserProfileById } from "../../api/profileApi";
import { toast } from "react-toastify";
import "./ProfilePicUploader.css";

export const ProfilePicUploader = ({ setUser, refreshProfile }) => {
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  // Function to refresh user data - wrapped in useCallback to maintain reference stability
  const refreshUserData = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const response = await fetchUserProfileById(userId);

      if (response.error) {
        console.error("Error refreshing user data:", response.message);
        return;
      }

      if (response.data) {
        // Normalize the user object to ensure it has both id and _id properties
        const userData = response.data;
        const normalizedUser = {
          ...userData,
          id: userData.id || userData._id, // Ensure id is available
          _id: userData._id || userData.id, // Ensure _id is available
        };

        setUser(normalizedUser);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  }, [setUser]); // Add setUser as a dependency

  // Effect to refresh user data after upload
  useEffect(() => {
    if (refreshTrigger) {
      // Wait for toast to disappear (3 seconds) then refresh
      const timer = setTimeout(() => {
        refreshUserData();
        setRefreshTrigger(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [refreshTrigger, refreshUserData]); // Add refreshUserData as a dependency

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

        // If refreshProfile function is provided, use it
        if (refreshProfile) {
          // Wait for toast to disappear (3 seconds) then refresh
          setTimeout(() => {
            refreshProfile();
          }, 3000);
        } else {
          // Fallback to the old refresh method
          setRefreshTrigger(true);
        }
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
