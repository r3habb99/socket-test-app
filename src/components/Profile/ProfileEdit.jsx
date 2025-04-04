import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../Common";
import { fetchUserProfile, updateUserProfile } from "../../apis";

const ProfileEdit = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
  });
  const navigate = useNavigate(); // Use navigate to redirect after login
  useEffect(() => {
    const loadProfile = async () => {
      const user = await fetchUserProfile();
      if (user) {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          username: user.username || "",
        });
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    const result = await updateUserProfile(formData);
    navigate("/profile");
    console.log("Profile updated:", result);
    // optionally show toast/notification
  };

  return (
    <div>
      <h2>Edit Profile</h2>
      <Input
        type="text"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        placeholder="First Name"
      />
      <Input
        type="text"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        placeholder="Last Name"
      />
      <Input
        type="text"
        name="username"
        value={formData.username}
        onChange={handleChange}
        placeholder="Username"
      />
      <button onClick={handleUpdate}>Update Profile</button>
    </div>
  );
};

export default ProfileEdit;
