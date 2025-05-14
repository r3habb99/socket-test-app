import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../Common";
import { fetchUserProfile, updateUserProfile, resetPassword } from "../../apis";
import "./css/password.css";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("edit"); // "edit" or "password"

  // Edit Profile state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
  });

  // Reset Password state
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const user = await fetchUserProfile();
      if (user) {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          username: user.username || "",
          email: user.email || "",
        });
      }
    };
    loadProfile();
  }, []);

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleProfileUpdate = async () => {
    const result = await updateUserProfile(formData);
    navigate("/profile");
    console.log("Profile updated:", result);
  };

  const handlePasswordSubmit = async () => {
    setError("");
    setSuccess("");
    try {
      const response = await resetPassword(passwordData);
      if (response) {
        setSuccess("Password reset successfully.");
        setTimeout(() => navigate("/profile"), 1500);
      }
    } catch (err) {
      setError("Failed to reset password. Please check your input.");
    }
  };

  return (
    <div className="edit-profile-container">
      <div className="tabs">
        <button
          className={mode === "edit" ? "active" : ""}
          onClick={() => setMode("edit")}
        >
          Edit Profile
        </button>
        <button
          className={mode === "password" ? "active" : ""}
          onClick={() => setMode("password")}
        >
          Reset Password
        </button>
      </div>

      {mode === "edit" ? (
        <>
          <h2>Edit Profile</h2>
          <Input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleProfileChange}
            placeholder="First Name"
          />
          <Input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleProfileChange}
            placeholder="Last Name"
          />
          <Input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleProfileChange}
            placeholder="Username"
          />
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleProfileChange}
            placeholder="Email"
          />
          <button onClick={handleProfileUpdate}>Update Profile</button>
        </>
      ) : (
        <div className="reset-password-container">
          <h2>Reset Password</h2>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <Input
            type="password"
            name="oldPassword"
            value={passwordData.oldPassword}
            onChange={handlePasswordChange}
            placeholder="Old Password"
          />
          <Input
            type="password"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            placeholder="New Password"
          />
          <Input
            type="password"
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            placeholder="Confirm Password"
          />

          <button onClick={handlePasswordSubmit}>Reset Password</button>
        </div>
      )}
    </div>
  );
};

export default ProfileEdit;
