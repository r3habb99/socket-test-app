import React, { useState } from "react";
import { FaCamera } from "react-icons/fa";
import { uploadCoverPhoto } from "../../api/profileApi";
import { toast } from "react-toastify";
import "./CoverPhotoUploader.css";

export const CoverPhotoUploader = ({ setUser }) => {
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (image) {
      try {
        setIsUploading(true);

        const response = await uploadCoverPhoto(image);

        if (response.error) {
          toast.error(`Failed to upload cover photo: ${response.message}`);
          console.error("Error uploading cover photo:", response.message);
          return;
        }

        // Get the cover photo URL from the response
        const coverPhotoUrl = response.data?.coverPhoto ||
                             (response.data?.user?.coverPhoto) ||
                             null;

        if (coverPhotoUrl) {
          // Add a timestamp to the URL to prevent caching
          const timestamp = new Date().getTime();
          const updatedUrl = coverPhotoUrl.includes('?')
            ? `${coverPhotoUrl}&t=${timestamp}`
            : `${coverPhotoUrl}?t=${timestamp}`;

          // Update user state with new cover photo
          setUser((prevUser) => ({
            ...prevUser,
            coverPhoto: updatedUrl,
            // Store the original URL without timestamp as well
            originalCoverPhoto: coverPhotoUrl,
          }));
        } else {
          console.warn("No cover photo URL found in response:", response.data);
        }

        toast.success("Cover photo updated successfully!");
        setImage(null);
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

      {/* Upload Button */}
      <button
        className="upload-btn"
        onClick={() => document.getElementById("coverFileInput").click()}
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
