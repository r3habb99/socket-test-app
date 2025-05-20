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

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);
      // Automatically upload the image after selection
      await handleUpload(selectedImage);
    }
  };

  const handleUpload = async (imageToUpload) => {
    // Use the provided image or fall back to the state image
    const imageFile = imageToUpload || image;

    if (imageFile) {
      try {
        setIsUploading(true);
        const response = await uploadProfilePic(imageFile);
       if (response.error) {
          toast.error(`Failed to upload profile picture: ${response.message}`);
          console.error("Error uploading profile pic:", response.message);
          return;
        }

        // Extract profile picture URL from the response, handling different response structures
        let profilePicUrl = null;

        // Case 1: Direct response.data.profilePic
        if (response.data?.profilePic) {
          profilePicUrl = response.data.profilePic;
        }
        // Case 2: Nested in response.data.user.profilePic
        else if (response.data?.user?.profilePic) {
          profilePicUrl = response.data.user.profilePic;
       }
        // Case 3: Nested in response.data.data.profilePic
        else if (response.data?.data?.profilePic) {
          profilePicUrl = response.data.data.profilePic;
        }
        // Case 4: Nested in response.data.data.user.profilePic
        else if (response.data?.data?.user?.profilePic) {
          profilePicUrl = response.data.data.user.profilePic;
        }

        if (profilePicUrl) {
          // Add a timestamp to the URL to prevent caching
          const timestamp = new Date().getTime();
          const updatedUrl = profilePicUrl.includes('?')
            ? `${profilePicUrl}&t=${timestamp}`
            : `${profilePicUrl}?t=${timestamp}`;

          // Update user state with new profile picture
          setUser((prevUser) => ({
            ...prevUser,
            profilePic: profilePicUrl, // Store original URL
            // Add timestamp for display to prevent caching
            profilePicWithTimestamp: updatedUrl,
          }));

          toast.success("Profile picture updated successfully!");
          setImage(null);

          // If refreshProfile function is provided, use it
          if (refreshProfile) {
            // Wait for toast to disappear (2 seconds) then refresh
            setTimeout(() => {
              refreshProfile();
            }, 2000);
          } else {
            // Fallback to the old refresh method
            setRefreshTrigger(true);
          }
        } else {
          console.warn("No profile picture URL found in response:", response);
          toast.warning("Profile picture was uploaded but the URL was not returned. The page will refresh to show your new picture.");

          // Still trigger a refresh even if we couldn't find the URL
          if (refreshProfile) {
            setTimeout(() => {
              refreshProfile();
            }, 2000);
          } else {
            setRefreshTrigger(true);
          }
        }
      } catch (error) {
        toast.error("Failed to upload profile picture. Please try again.");
        console.error("Error uploading profile pic:", error);
      } finally {
        setIsUploading(false);
      }
    } else {
      toast.warning("Please select an image first");
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

      {/* Camera Icon Button */}
      <button
        className="upload-btn"
        onClick={() => document.getElementById("fileInput").click()}
        disabled={isUploading}
        title="Change profile picture"
      >
        {isUploading ? (
          <div className="spinner"></div>
        ) : (
          <FaCamera />
        )}
      </button>
    </div>
  );
};
