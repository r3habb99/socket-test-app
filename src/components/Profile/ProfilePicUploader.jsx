import React, { useState } from "react";
import "./css/profile.css";
import { FaCamera } from "react-icons/fa";
import { uploadProfilePic } from "../../apis";

export const ProfilePicUploader = ({ setUser }) => {
  const [image, setImage] = useState(null);

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (image) {
      try {
        const data = await uploadProfilePic(image);
        setUser((prevUser) => ({
          ...prevUser,
          profilePic: data?.profilePic || prevUser.profilePic,
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
