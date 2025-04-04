import React, { useState } from "react";
import { uploadCoverPhoto } from "../apis/profile";
import "../css/profile.css";
import { FaCamera } from "react-icons/fa";

const CoverPhotoUploader = ({ setUser }) => {
  const [image, setImage] = useState(null);

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (image) {
      try {
        const data = await uploadCoverPhoto(image);
        setUser((prevUser) => ({
          ...prevUser,
          coverPhoto: data?.coverPhoto || prevUser.coverPhoto,
        }));
        setImage(null);
      } catch (error) {
        console.error("Error uploading cover photo:", error);
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
      <button className="upload-btn" onClick={() => document.getElementById("coverFileInput").click()}>
        <FaCamera />
      </button>

      {image && <button onClick={handleUpload}>Upload</button>}
    </div>
  );
};

export default CoverPhotoUploader;
