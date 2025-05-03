import React, { useState } from "react";
import { FaCamera } from "react-icons/fa";
import { uploadProfilePic } from "../../api/profileApi";
import "./ProfilePicUploader.css";

export const ProfilePicUploader = ({ setUser }) => {
  const [image, setImage] = useState(null);

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (image) {
      try {
        const formData = new FormData();
        formData.append('profilePic', image);
        
        const response = await uploadProfilePic(formData);
        
        if (response.error) {
          console.error("Error uploading profile pic:", response.message);
          return;
        }
        
        setUser((prevUser) => ({
          ...prevUser,
          profilePic: response.data?.profilePic || prevUser.profilePic,
        }));
        
        setImage(null);
      } catch (error) {
        console.error("Error uploading profile pic:", error);
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
      >
        <FaCamera />
      </button>

      {image && <button onClick={handleUpload}>Upload</button>}
    </div>
  );
};
