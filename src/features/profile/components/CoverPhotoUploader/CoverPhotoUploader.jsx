import React, { useState, useEffect, useCallback } from "react";
import { FaCamera } from "react-icons/fa";
import { uploadCoverPhoto, fetchUserProfileById } from "../../api/profileApi";
import { toast } from "react-toastify";
import "./CoverPhotoUploader.css";

export const CoverPhotoUploader = ({ setUser, refreshProfile }) => {
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
      console.log("Cover photo selected:", selectedImage.name);

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
        console.log("Starting cover photo upload...");

        const response = await uploadCoverPhoto(imageFile);

        if (response.error) {
          toast.error(`Failed to upload cover photo: ${response.message}`);
          console.error("Error uploading cover photo:", response.message);
          return;
        }

        // Extract cover photo URL from the response, handling different response structures
        let coverPhotoUrl = null;

        // Case 1: Direct response.data.coverPhoto
        if (response.data?.coverPhoto) {
          coverPhotoUrl = response.data.coverPhoto;
          console.log("Found cover photo in response.data.coverPhoto:", coverPhotoUrl);
        }
        // Case 2: Nested in response.data.user.coverPhoto
        else if (response.data?.user?.coverPhoto) {
          coverPhotoUrl = response.data.user.coverPhoto;
          console.log("Found cover photo in response.data.user.coverPhoto:", coverPhotoUrl);
        }
        // Case 3: Nested in response.data.data.coverPhoto
        else if (response.data?.data?.coverPhoto) {
          coverPhotoUrl = response.data.data.coverPhoto;
          console.log("Found cover photo in response.data.data.coverPhoto:", coverPhotoUrl);
        }
        // Case 4: Nested in response.data.data.user.coverPhoto
        else if (response.data?.data?.user?.coverPhoto) {
          coverPhotoUrl = response.data.data.user.coverPhoto;
          console.log("Found cover photo in response.data.data.user.coverPhoto:", coverPhotoUrl);
        }

        if (coverPhotoUrl) {
          // Add a timestamp to the URL to prevent caching
          const timestamp = new Date().getTime();
          const updatedUrl = coverPhotoUrl.includes('?')
            ? `${coverPhotoUrl}&t=${timestamp}`
            : `${coverPhotoUrl}?t=${timestamp}`;

          console.log("Updating user state with new cover photo:", updatedUrl);

          // Update user state with new cover photo
          setUser((prevUser) => ({
            ...prevUser,
            coverPhoto: coverPhotoUrl, // Store original URL
            // Add timestamp for display to prevent caching
            coverPhotoWithTimestamp: updatedUrl,
          }));
        } else {
          console.warn("No cover photo URL found in response:", response);
          toast.warning("Cover photo was uploaded but the URL was not returned. The page will refresh to show your new cover photo.");
        }

        toast.success("Cover photo updated successfully!");
        setImage(null);

        // If refreshProfile function is provided, use it
        if (refreshProfile) {
          console.log("Using provided refreshProfile function");
          // Wait for toast to disappear (3 seconds) then refresh
          setTimeout(() => {
            refreshProfile();
          }, 3000);
        } else {
          console.log("Using fallback refresh method");
          // Fallback to the old refresh method
          setRefreshTrigger(true);
        }

        // Still trigger a refresh even if we couldn't find the URL
        if (!coverPhotoUrl) {
          if (refreshProfile) {
            setTimeout(() => {
              refreshProfile();
            }, 3000);
          } else {
            setRefreshTrigger(true);
          }
        }
      } catch (error) {
        toast.error("Failed to upload cover photo. Please try again.");
        console.error("Error uploading cover photo:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="cover-photo-uploader">
      {/* Hidden File Input */}
      <input
        type="file"
        id="coverFileInput"
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Camera Icon Button */}
      <button
        className="upload-btn"
        onClick={() => document.getElementById("coverFileInput").click()}
        disabled={isUploading}
        title="Change cover photo"
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
