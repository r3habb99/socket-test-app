import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./css/profile.css";

// import {FollowButton} from "./FollowButton";
// import ProfilePicUploader from "./ProfilePicUploader";
// import CoverPhotoUploader from "./CoverPhotoUploader";
import { FaEdit, FaRegCommentDots } from "react-icons/fa";
import { fetchUserProfileById, followUser, createChat } from "../../apis";
import { DEFAULT_COVER_PHOTO, DEFAULT_PROFILE_PIC } from "../../constants";
import { CoverPhotoUploader, ProfilePicUploader, FollowButton } from "./index";

export const Profile = () => {
  const { userId } = useParams(); // ID from route, if available
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const loggedInUserId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await fetchUserProfileById(userId);
        console.log(data, "profile data");
        if (data && data.id) {
          setUser(data);
          setIsFollowing(data.followers?.includes(loggedInUserId));
        } else {
          setError("User profile data not found.");
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("An error occurred while fetching the profile.");
      }
    };
    fetchProfile();
  }, [userId, loggedInUserId]);

  const toggleFollow = async () => {
    try {
      await followUser(user.id);
      setIsFollowing(!isFollowing);
    } catch (err) {
      setError("An error occurred while following/unfollowing.");
    }
  };

  const handleEditClick = () => {
    navigate("/user/edit-profile");
  };

  if (error) return <div className="error-message">{error}</div>;
  if (!user) return <div>Loading...</div>;

  const isOwnProfile = loggedInUserId === user.id;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img
          src={DEFAULT_COVER_PHOTO} // currently static images show
          // src={user.coverPhoto || DEFAULT_COVER_PHOTO}
          alt="Cover"
          className="cover-photo"
        />
        {isOwnProfile && <CoverPhotoUploader setUser={setUser} />}
      </div>

      <div className="profile-content">
        <div className="profile-left">
          <img
            src={DEFAULT_PROFILE_PIC} // currently static images show
            // src={user.profilePic || DEFAULT_PROFILE_PIC} // Use this directly as fallback
            alt="Profile"
            className="profile-pic"
          />
          {isOwnProfile && <ProfilePicUploader setUser={setUser} />}
        </div>

        <div className="profile-right">
          <div className="profile-info">
            <h2 className="profile-name">
              {user.firstName} {user.lastName}
            </h2>
            <div className="actions">
              {isOwnProfile ? (
                <button className="edit-button">
                  <FaEdit onClick={handleEditClick} />
                </button>
              ) : (
                <>
                  <FollowButton
                    isFollowing={isFollowing}
                    toggleFollow={toggleFollow}
                  />
                  <button
                    className="message-button"
                    onClick={async () => {
                      console.log("Message button clicked"); // Add this to verify rendering
                      try {
                        console.log("Creating chat with user ID:", user.id);
                        const chatData = await createChat(user.id);
                        console.log("Chat created successfully:", chatData);

                        // Check if we have a valid chat object
                        // The API returns 'id' instead of '_id'
                        if (!chatData) {
                          console.error("No chat data returned");
                          alert("Failed to create chat. Please try again.");
                          return;
                        }

                        // Create a normalized chat object with _id property
                        const normalizedChat = {
                          ...chatData,
                          _id: chatData._id || chatData.id, // Use _id if available, otherwise use id
                        };

                        console.log("Normalized chat object:", normalizedChat);

                        // Navigate to the dashboard/messages route with the normalized chat data
                        navigate("/dashboard/messages", {
                          state: {
                            initialChat: normalizedChat,
                            prefillUserId: user.id,
                          },
                        });
                      } catch (error) {
                        console.error("Failed to start chat:", error);
                        alert("Failed to start chat. Please try again.");
                      }
                    }}
                    title="Message"
                  >
                    <FaRegCommentDots size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="username">@{user.username}</p>
          {/* <p className="email">{user.email}</p> */}
          <div className="bio">
            <p>Bio: {user.bio || "Coming soon!"}</p>
          </div>

          <div className="stats">
            <div>
              <Link to={`/user/${user.id}/followers`} className="link">
                Followers{" "}
                <strong className="count">{user.followers?.length || 0}</strong>
              </Link>
            </div>
            <div>
              <Link to={`/user/${user.id}/following`} className="link">
                Following{" "}
                <strong className="count">{user.following?.length || 0}</strong>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
