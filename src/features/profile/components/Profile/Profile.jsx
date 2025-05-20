import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaRegCommentDots, FaArrowLeft, FaEllipsisH, FaSearch } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../../../../core/store/hooks";
import {
  fetchUserProfile,
  followUserProfile,
  unfollowUserProfile,
  selectCurrentProfile
} from "../../store/profileSlice";
import { selectLoading, selectError, openImagePreviewModal } from "../../../../features/ui/store/uiSlice";
import { createChat, getAllChats } from "../../../messaging/api/messagingApi";
import { findExistingChat } from "../../../messaging/components/ChatList/ChatListHelpers";
import { fetchUserStats } from "../../api/profileApi";
import {
  DEFAULT_COVER_PHOTO,
  DEFAULT_PROFILE_PIC,
} from "../../../../constants";
import { getImageUrl } from "../../../../shared/utils/imageUtils";
import { ImageProxy } from "../../../../shared/components";
import { CoverPhotoUploader } from "../CoverPhotoUploader";
import { ProfilePicUploader } from "../ProfilePicUploader";
import { FollowButton } from "../FollowButton";
import { ProfileTabs } from "../ProfileTabs";
import { UserPostList } from "../UserPostList";
import "./Profile.css";

export const Profile = () => {
  const { userId: urlUserId } = useParams(); // ID from route, if available
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('posts');
  const [userStats, setUserStats] = useState(null);

  // Redux state
  const user = useAppSelector(selectCurrentProfile);
  const isLoading = useAppSelector(state => selectLoading(state, 'profile'));
  const reduxError = useAppSelector(state => selectError(state, 'profile'));

  // Redux UI state for image preview is managed in the UI slice

  const loggedInUserId = localStorage.getItem("userId");

  // If no userId is provided in the URL, use the logged-in user's ID
  const userId = urlUserId || loggedInUserId;

  // Function to fetch user stats
  const fetchUserStatsData = useCallback(async (userId) => {
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

  
      // Handle different response structures for stats
      let statsData = null;

      // Case 1: Direct response with statusCode, message, data structure
      if (response.data && response.data.statusCode && response.data.data) {
        statsData = response.data;
       }
      // Case 2: Nested response.data.data structure
      else if (response.data && response.data.data) {
        statsData = response.data;
      }
      // Case 3: Direct response.data structure
      else if (response.data) {
        statsData = response.data;
      }

      if (statsData) {
        setUserStats(statsData);
      } else {
        console.warn("No stats data found in response");
      }
    } catch (err) {
      console.error("Error fetching user stats:", err);
    }
  }, [activeTab]);



  // Initial data fetch
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserProfile(userId));
    }
  }, [dispatch, userId]);

  // Add a refresh mechanism when the component gains focus
  useEffect(() => {
    // Function to refresh data when the component becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userId) {
        dispatch(fetchUserProfile(userId));
      }
    };

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dispatch, userId]);

  // Refresh stats when active tab changes
  useEffect(() => {
    if (user) {
      fetchUserStatsData(user.id || user._id);
    }
  }, [activeTab, user, fetchUserStatsData]);

  const toggleFollow = async () => {
    try {
      // Get the user ID (either id or _id)
      const userId = user.id || user._id;

      if (!userId) {
        console.error("User ID is missing");
        return;
      }

      // Dispatch the appropriate action based on current following status
      if (user.isFollowing) {
        await dispatch(unfollowUserProfile(userId));
      } else {
        await dispatch(followUserProfile(userId));
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  const handleEditClick = () => {
    navigate("/user/edit-profile");
  };

  // Image preview handlers
  const handlePreviewOpen = (imageUrl, type) => {
    dispatch(openImagePreviewModal({
      imageUrl,
      title: type === 'profile' ? 'Profile Picture' : 'Cover Photo'
    }));
  };

  if (reduxError) return <div className="error-message">{reduxError}</div>;
  if (isLoading || !user) return <div>Loading...</div>;

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
        <div
          className="cover-photo-container"
          onClick={() => {
            const coverPhotoUrl = user.coverPhoto
              ? `${getImageUrl(user.coverPhoto, DEFAULT_COVER_PHOTO)}?t=${Date.now()}`
              : DEFAULT_COVER_PHOTO;
            handlePreviewOpen(coverPhotoUrl, 'cover');
          }}
        >
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
          <div className="photo-overlay">
            <FaSearch className="view-icon" />
          </div>
        </div>
        {isOwnProfile && <CoverPhotoUploader refreshProfile={() => dispatch(fetchUserProfile(userId))} />}
      </div>

      <div className="profile-content">
        <div className="profile-left">
          <div
            className="profile-pic-container"
            onClick={() => {
              const profilePicUrl = user.profilePic
                ? `${getImageUrl(user.profilePic, DEFAULT_PROFILE_PIC)}?t=${Date.now()}`
                : DEFAULT_PROFILE_PIC;
              handlePreviewOpen(profilePicUrl, 'profile');
            }}
          >
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
            <div className="photo-overlay">
              <FaSearch className="view-icon" />
            </div>
            {isOwnProfile && <ProfilePicUploader refreshProfile={() => dispatch(fetchUserProfile(userId))} />}
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
                            // Use the findExistingChat helper function to check if a chat already exists
                            const existingChat = findExistingChat(existingChats, userId);

                            if (existingChat) {

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


                          const response = await createChat({ userId });

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
                      isFollowing={user.isFollowing}
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
                onClick={() => navigate(`/user/${user.id || user._id}/followers`)}
              >
                <strong className="count">{user.followers?.length || 0}</strong> Followers
              </button>
            </div>
            <div>
              <button
                className="link-button"
                onClick={() => navigate(`/user/${user.id || user._id}/following`)}
              >
                <strong className="count">{user.following?.length || 0}</strong> Following
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
