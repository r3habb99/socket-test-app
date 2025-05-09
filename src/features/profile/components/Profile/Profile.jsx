import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaEdit, FaRegCommentDots, FaArrowLeft } from "react-icons/fa";
import { fetchUserProfileById, followUser } from "../../api/profileApi";
import { createChat } from "../../../messaging/api/messagingApi";
import {
  DEFAULT_COVER_PHOTO,
  DEFAULT_PROFILE_PIC,
} from "../../../../constants";
import { getImageUrl } from "../../../../shared/utils/imageUtils";
import { ImageProxy } from "../../../../shared/components";
import { CoverPhotoUploader } from "../CoverPhotoUploader";
import { ProfilePicUploader } from "../ProfilePicUploader";
import { FollowButton } from "../FollowButton";
import "./Profile.css";

export const Profile = () => {
  const { userId: urlUserId } = useParams(); // ID from route, if available
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const loggedInUserId = localStorage.getItem("userId");

  // If no userId is provided in the URL, use the logged-in user's ID
  const userId = urlUserId || loggedInUserId;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError("User ID not found. Please log in again.");
        return;
      }

      try {
        const response = await fetchUserProfileById(userId);

        if (response.error) {
          setError(response.message || "Failed to fetch user profile");
          return;
        }

        // The API response has a nested structure with the actual user data in the 'data' property
        const userData = response.data;

        // Check if we have valid user data
        if (userData && userData.data) {
          const userDataObj = userData.data;

          // Check if we have either id or _id
          if (userDataObj.id || userDataObj._id) {
            // Normalize the user object to ensure it has both id and _id properties
            const normalizedUser = {
              ...userDataObj,
              id: userDataObj.id || userDataObj._id, // Ensure id is available
              _id: userDataObj._id || userDataObj.id, // Ensure _id is available
            };

            setUser(normalizedUser);
            // Check if the logged-in user is in the followers array
            const followersArray = normalizedUser.followers || [];
            setIsFollowing(followersArray.includes(loggedInUserId));
          } else {
            console.error("User data missing id/_id:", userDataObj);
            setError("User profile data missing ID.");
          }
        } else {
          console.error("User data missing or invalid:", userData);
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
      // Get the user ID (either id or _id)
      const userId = user.id || user._id;

      const response = await followUser(userId);

      if (response.error) {
        setError(response.message || "Failed to follow/unfollow user");
        return;
      }

      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Error toggling follow:", err);
      setError("An error occurred while following/unfollowing.");
    }
  };

  const handleEditClick = () => {
    navigate("/user/edit-profile");
  };

  if (error) return <div className="error-message">{error}</div>;
  if (!user) return <div>Loading...</div>;

  // Check if this is the logged-in user's profile by comparing IDs
  // Convert both to strings to handle potential type mismatches
  const isOwnProfile = String(loggedInUserId) === String(user.id || user._id);

  return (
    <div className="profile-container">
      <div className="profile-header-bar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div className="profile-header-info">
          <h2 className="profile-header-name">
            {user.firstName} {user.lastName}
          </h2>
          <p className="profile-header-stats">
            {user.posts?.length || 0} posts
          </p>
        </div>
      </div>

      <div className="profile-header">
        <ImageProxy
          src={user.coverPhoto ? getImageUrl(user.coverPhoto, DEFAULT_COVER_PHOTO) : DEFAULT_COVER_PHOTO}
          alt="Cover"
          className="cover-photo"
          defaultSrc={DEFAULT_COVER_PHOTO}
          noCache={true}
          onError={(e) => {
            console.warn(`Failed to load cover photo: ${e.target.src}`);
          }}
        />
        {isOwnProfile && <CoverPhotoUploader setUser={setUser} />}
      </div>

      <div className="profile-content">
        <div className="profile-left">
          <ImageProxy
            src={user.profilePic ? getImageUrl(user.profilePic, DEFAULT_PROFILE_PIC) : DEFAULT_PROFILE_PIC}
            alt="Profile"
            className="profile-pic"
            defaultSrc={DEFAULT_PROFILE_PIC}
            noCache={true}
            onError={(e) => {
              console.warn(`Failed to load profile image: ${e.target.src}`);
            }}
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
                      try {
                        // Get the user ID (either id or _id)
                        const userId = user.id || user._id;

                        const response = await createChat({ userId });

                        if (response.error) {
                          console.error(
                            "Failed to create chat:",
                            response.message
                          );
                          alert("Failed to create chat. Please try again.");
                          return;
                        }

                        const chatData = response.data;

                        // Create a normalized chat object with _id property
                        const normalizedChat = {
                          ...chatData,
                          _id: chatData._id || chatData.id, // Use _id if available, otherwise use id
                        };

                        // Navigate to the dashboard/messages route with the normalized chat data
                        navigate("/dashboard/messages", {
                          state: {
                            initialChat: normalizedChat,
                            prefillUserId: userId,
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
          <div className="bio">
            <p>{user.bio || "Coming soon!"}</p>
          </div>

          <div className="stats">
            <div>
              <Link
                to={`/profile/${user.id || user._id}/followers`}
                className="link"
              >
                Followers{" "}
                <strong className="count">{user.followers?.length || 0}</strong>
              </Link>
            </div>
            <div>
              <Link
                to={`/profile/${user.id || user._id}/following`}
                className="link"
              >
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
