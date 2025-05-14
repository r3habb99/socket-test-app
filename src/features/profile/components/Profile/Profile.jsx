import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaRegCommentDots, FaArrowLeft, FaEllipsisH } from "react-icons/fa";
import { fetchUserProfileById, followUser, fetchUserStats } from "../../api/profileApi";
import { createChat, getAllChats } from "../../../messaging/api/messagingApi";
import { findExistingChat } from "../../../messaging/components/ChatList/ChatListHelpers";
import {
  DEFAULT_COVER_PHOTO,
  DEFAULT_PROFILE_PIC,
} from "../../../../constants";
import { getImageUrl } from "../../../../shared/utils/imageUtils";
import { ImageProxy } from "../../../../shared/components";
import { useAutoRefresh } from "../../../../shared/hooks";
import { CoverPhotoUploader } from "../CoverPhotoUploader";
import { ProfilePicUploader } from "../ProfilePicUploader";
import { FollowButton } from "../FollowButton";
import { ProfileTabs } from "../ProfileTabs";
import { UserPostList } from "../UserPostList";
import "./Profile.css";

export const Profile = () => {
  const { userId: urlUserId } = useParams(); // ID from route, if available
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [userStats, setUserStats] = useState(null);

  const loggedInUserId = localStorage.getItem("userId");

  // If no userId is provided in the URL, use the logged-in user's ID
  const userId = urlUserId || loggedInUserId;

  // Define the fetchProfile function as a callback so it can be used with useAutoRefresh
  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setError("User ID not found. Please log in again.");
      return;
    }

    try {
      // Fetch user profile data
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

          // Fetch user stats with posts
          fetchUserStatsData(normalizedUser.id || normalizedUser._id);
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
  }, [userId, loggedInUserId]);

  // Function to fetch user stats
  const fetchUserStatsData = async (userId) => {
    try {
      // Use the content type based on the active tab
      const contentType = activeTab === 'posts' ? 'posts' :
                          activeTab === 'replies' ? 'replies' :
                          activeTab === 'media' ? 'media' :
                          activeTab === 'likes' ? 'likes' : 'posts';

      const options = {
        contentType,
        limit: 10,
        includeComments: true
      };

      const response = await fetchUserStats(userId, options);

      if (response.error) {
        console.error("Failed to fetch user stats:", response.message);
        return;
      }

      // Extract stats from the nested response structure
      const statsData = response.data?.data;

      if (statsData) {
        setUserStats(statsData);
      } else {
        console.warn("No stats data found in response");
      }
    } catch (err) {
      console.error("Error fetching user stats:", err);
    }
  };

  // Use our custom hook for auto-refreshing
  const { triggerRefresh } = useAutoRefresh(
    fetchProfile,
    3000, // 3 seconds delay after toast
    [userId, loggedInUserId] // Dependencies for the refresh function
  );

  // Initial data fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Refresh stats when active tab changes
  useEffect(() => {
    if (user) {
      fetchUserStatsData(user.id || user._id);
    }
  }, [activeTab, user]);

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
            {userStats?.stats?.postCount || 0} posts
          </p>
        </div>
      </div>

      <div className="profile-header">
        <ImageProxy
          src={user.coverPhoto ? `${getImageUrl(user.coverPhoto, DEFAULT_COVER_PHOTO)}?t=${Date.now()}` : DEFAULT_COVER_PHOTO}
          alt="Cover"
          className="cover-photo"
          defaultSrc={DEFAULT_COVER_PHOTO}
          noCache={true}
          onError={(e) => {
            console.warn(`Failed to load cover photo: ${e.target.src}`);
          }}
        />
        {isOwnProfile && <CoverPhotoUploader setUser={setUser} refreshProfile={triggerRefresh} />}
      </div>

      <div className="profile-content">
        <div className="profile-left">
          <div className="profile-pic-container">
            <ImageProxy
              src={user.profilePic ? `${getImageUrl(user.profilePic, DEFAULT_PROFILE_PIC)}?t=${Date.now()}` : DEFAULT_PROFILE_PIC}
              alt="Profile"
              className="profile-pic"
              defaultSrc={DEFAULT_PROFILE_PIC}
              noCache={true}
              onError={(e) => {
                console.warn(`Failed to load profile image: ${e.target.src}`);
              }}
            />
            {isOwnProfile && <ProfilePicUploader setUser={setUser} refreshProfile={triggerRefresh} />}
          </div>
        </div>

        <div className="profile-right">
          <div className="profile-info">
            <h2 className="profile-name">
              {user.firstName} {user.lastName}
            </h2>
            <div className="actions">
              {isOwnProfile ? (
                <button className="edit-profile-button" onClick={handleEditClick}>
                  Edit profile
                </button>
              ) : (
                <>
                  <div className="profile-action-buttons">
                    <button className="more-options-button" title="More options">
                      <FaEllipsisH />
                    </button>
                    <button
                      className="message-button"
                      onClick={async () => {
                        try {
                          // Get the user ID (either id or _id)
                          const userId = user.id || user._id;

                          // First check if a chat already exists with this user
                          const chatsResponse = await getAllChats();
                          console.log("Chats response:", chatsResponse);

                          if (chatsResponse.error) {
                            console.error("Failed to fetch chats:", chatsResponse.message);
                            // Continue with creating a new chat as fallback
                          } else {
                            // Extract chats from the response, handling nested data structure
                            let existingChats = [];

                            if (chatsResponse.data) {
                              // Handle nested data structure: response.data.data
                              if (chatsResponse.data.data && Array.isArray(chatsResponse.data.data)) {
                                existingChats = chatsResponse.data.data;
                              }
                              // Handle direct data structure: response.data
                              else if (Array.isArray(chatsResponse.data)) {
                                existingChats = chatsResponse.data;
                              }
                            }

                            console.log("Existing chats:", existingChats);

                            // Use the findExistingChat helper function to check if a chat already exists
                            const existingChat = findExistingChat(existingChats, userId);

                            if (existingChat) {
                              console.log("Chat already exists, navigating to existing chat:", existingChat);

                              // Ensure the chat object has the expected structure
                              const normalizedChat = {
                                ...existingChat,
                                _id: existingChat._id || existingChat.id,
                                id: existingChat.id || existingChat._id,
                                users: existingChat.users || []
                              };

                              // If chat exists, navigate to it with a flag indicating it's an existing chat
                              navigate("/dashboard/messages", {
                                state: {
                                  initialChat: normalizedChat,
                                  prefillUserId: userId,
                                  isExistingChat: true  // Add this flag to indicate it's an existing chat
                                },
                              });
                              return;
                            }
                          }

                          // If no existing chat was found, create a new one
                          console.log("Creating new chat with user ID:", userId);
                          const response = await createChat({ userId });
                          console.log("Create chat response:", response);

                          if (response.error) {
                            console.error(
                              "Failed to create chat:",
                              response.message
                            );
                            alert("Failed to create chat. Please try again.");
                            return;
                          }

                          // Extract chat data from the response, handling nested data structure
                          let chatData;
                          if (response.data) {
                            // Handle nested data structure: response.data.data
                            if (response.data.data) {
                              chatData = response.data.data;
                            }
                            // Handle direct data structure: response.data
                            else {
                              chatData = response.data;
                            }
                          }

                          if (!chatData) {
                            console.error("Invalid chat data in response:", response);
                            alert("Failed to create chat: Invalid response data");
                            return;
                          }

                          console.log("Extracted chat data:", chatData);

                          // Create a normalized chat object with _id property
                          const normalizedChat = {
                            ...chatData,
                            _id: chatData._id || chatData.id, // Use _id if available, otherwise use id
                            id: chatData.id || chatData._id,  // Ensure id is available
                            users: chatData.users || []       // Ensure users array exists
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
                      <FaRegCommentDots size={16} />
                    </button>
                    <FollowButton
                      isFollowing={isFollowing}
                      toggleFollow={toggleFollow}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="username">@{user.username}</p>
          <div className="bio">
            <p>{user.bio || "No bio yet."}</p>
          </div>

          <div className="profile-location-date">
            {user.location && (
              <div className="profile-location">
                <span>{user.location}</span>
              </div>
            )}
            <div className="profile-joined-date">
              <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="stats">
            <div>
              <button
                className="link-button"
                onClick={() => navigate(`/user/${user.id || user._id}/following`)}
              >
                <strong className="count">{user.following?.length || 0}</strong> Following
              </button>
            </div>
            <div>
              <button
                className="link-button"
                onClick={() => navigate(`/user/${user.id || user._id}/followers`)}
              >
                <strong className="count">{user.followers?.length || 0}</strong> Followers
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-tabs-section">
        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} userId={userId} />
        <UserPostList userId={userId} activeTab={activeTab} />
      </div>
    </div>
  );
};
