import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../../../shared/components/Input";
import { updateUserProfile } from "../../api/profileApi";
import { resetPassword } from "../../../auth/api/passwordApi";
import { fetchUserProfile } from "../../../auth/api";
import "./ProfileEdit.css";

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
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await fetchUserProfile();

        if (response.error) {
          setError(response.message || "Failed to load profile");
          return;
        }

        // Handle the nested API response structure
        const responseData = response.data;

        // Try to extract user data from various possible locations
        let userData = null;

        if (responseData?.data) {
          // Nested: { data: {...} }
          userData = responseData.data;
        } else {
          // Direct: {...}
          userData = responseData;
        }

        if (userData) {
          setFormData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            username: userData.username || "",
            email: userData.email || "",
          });
        } else {
          console.error("Invalid user data format:", responseData);
          setError("Failed to parse user data");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
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
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await updateUserProfile(formData);

      if (response.error) {
        setError(response.message || "Failed to update profile");
        return;
      }

      setSuccess("Profile updated successfully");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.error) {
        setError(response.message || "Failed to reset password");
        return;
      }

      setSuccess("Password reset successfully");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("Failed to reset password. Please check your input.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.firstName) {
    return <div className="loading">Loading profile...</div>;
  }

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

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

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
            disabled={true} // Email should not be editable
          />
          <button onClick={handleProfileUpdate} disabled={loading}>
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </>
      ) : (
        <div className="reset-password-container">
          <h2>Reset Password</h2>
          <Input
            type="password"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            placeholder="Current Password"
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

          <button onClick={handlePasswordSubmit} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileEdit;
