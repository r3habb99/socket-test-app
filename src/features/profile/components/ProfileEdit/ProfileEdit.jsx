import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
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
    bio:""
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

        // Case 1: Direct response with statusCode, message, data structure
        if (responseData?.statusCode && responseData?.data) {
          userData = responseData.data;
          // Check if user is nested inside data
          if (userData?.user) {
            userData = userData.user;
          }
        }
        // Case 2: Nested: { data: { user: {...} } }
        else if (responseData?.data?.user) {
          userData = responseData.data.user;
        }
        // Case 3: Nested: { data: {...} }
        else if (responseData?.data) {
          userData = responseData.data;
        }
        // Case 4: Nested: { user: {...} }
        else if (responseData?.user) {
          userData = responseData.user;
        }
        // Case 5: Direct: {...}
        else {
          userData = responseData;
        }

   

        if (userData) {
          // Ensure we have all the required fields
          setFormData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            username: userData.username || "",
            email: userData.email || "",
            bio: userData.bio || ""
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

      // Reload the profile data to ensure form shows updated values
      try {
        const profileResponse = await fetchUserProfile();
        if (!profileResponse.error && profileResponse.data) {
          // Extract user data using the same logic as in loadProfile
          let userData = null;
          const responseData = profileResponse.data;

          // Case 1: Direct response with statusCode, message, data structure
          if (responseData?.statusCode && responseData?.data) {
            userData = responseData.data;
            // Check if user is nested inside data
            if (userData?.user) {
              userData = userData.user;
            }
          }
          // Case 2: Nested: { data: { user: {...} } }
          else if (responseData?.data?.user) {
            userData = responseData.data.user;
          }
          // Case 3: Nested: { data: {...} }
          else if (responseData?.data) {
            userData = responseData.data;
          }
          // Case 4: Nested: { user: {...} }
          else if (responseData?.user) {
            userData = responseData.user;
          }
          // Case 5: Direct: {...}
          else {
            userData = responseData;
          }

       
          if (userData) {
            setFormData({
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              username: userData.username || "",
              email: userData.email || "",
              bio: userData.bio || ""
            });

           }
        }
      } catch (refreshErr) {
        console.error("Error refreshing profile data:", refreshErr);
        // Don't show error to user as the update was successful
      }

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

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
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

      // Clear password fields on success
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccess("Password reset successfully");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("Failed to reset password. Please check your input.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && Object.values(formData).every((field) => field === "")) {
    return <div className="loading-container">Loading profile...</div>;
  }

  return (
    <div className="edit-profile-container">
      {/* Header Bar */}
      <div className="profile-header-bar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div className="profile-header-info">
          <h2 className="profile-header-title">
            {mode === "edit" ? "Edit Profile" : "Reset Password"}
          </h2>
        </div>
      </div>

      {/* Tab Navigation */}
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

      {/* Notifications */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Form Content */}
      <div className="form-content">
        {mode === "edit" ? (
          <div className="edit-form">
            <div className="form-group">
              <Input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleProfileChange}
                placeholder="First Name"
              />
            </div>
            <div className="form-group">
              <Input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleProfileChange}
                placeholder="Last Name"
              />
            </div>
            <div className="form-group">
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleProfileChange}
                placeholder="Username"
              />
            </div>
            <div className="form-group">
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleProfileChange}
                placeholder="Email"
                disabled={true} // Email should not be editable
              />
            </div>
            <div className="form-group">
              <Input
                type="text"
                name="bio"
                value={formData.bio}
                onChange={handleProfileChange}
                placeholder="Bio"
                maxLength={160} // Match the backend validation limit
              />
              <div className="bio-character-count">
                {formData.bio ? formData.bio.length : 0}/160
              </div>
            </div>
            <div className="form-actions">
              <button
                className="primary-button"
                onClick={handleProfileUpdate}
                disabled={loading}
              >
                {loading ? "Updating..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="password-form">
            <div className="form-group">
              <Input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Current Password"
              />
            </div>
            <div className="form-group">
              <Input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="New Password"
              />
            </div>
            <div className="form-group">
              <Input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm Password"
              />
            </div>
            <div className="form-actions">
              <button
                className="primary-button"
                onClick={handlePasswordSubmit}
                disabled={loading}
              >
                {loading ? "Updating..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileEdit;
