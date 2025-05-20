import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useAppDispatch } from "../../../../core/store/hooks";
import { FollowButton } from "../FollowButton";
import {
  getUserFollowing,
  getUserFollowers,
  fetchUserProfileById,
} from "../../api/profileApi";
import {
  followUserProfile,
  unfollowUserProfile
} from "../../store/profileSlice";
import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import "./FollowingList.css";

export const FollowingList = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = window.location.pathname;

  // Set initial active tab based on the URL
  const initialTab = location.includes("/following")
    ? "following"
    : "followers";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loggedInUserId] = useState(localStorage.getItem("userId"));
  const [followingStates, setFollowingStates] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);

  const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch the profile user's information
        const profileResponse = await fetchUserProfileById(userId);

        if (profileResponse.error) {
          setError(profileResponse.message || "Failed to fetch user profile");
          return;
        }

        // Handle different response structures
        let userData = null;

        // Case 1: Direct response with statusCode, message, data structure
        if (profileResponse.data && profileResponse.data.statusCode && profileResponse.data.data) {
          userData = profileResponse.data.data;
        }
        // Case 2: Nested data.data structure
        else if (profileResponse.data && profileResponse.data.data) {
          userData = profileResponse.data.data;
        }
        // Case 3: Direct data structure
        else if (profileResponse.data) {
          userData = profileResponse.data;
        }

        if (userData) {
          setProfileUser({
            ...userData,
            id: userData.id || userData._id,
            _id: userData._id || userData.id,
          });
        } else {
          console.error(
            "Invalid profile data structure:",
            profileResponse
          );
          setError("Failed to parse profile data");
          return;
        }

        // Fetch both followers and following data
        const followersResponse = await getUserFollowers(userId);
        const followingResponse = await getUserFollowing(userId);

        if (followersResponse.error) {
          setError(followersResponse.message || "Failed to fetch followers");
          return;
        }

        if (followingResponse.error) {
          setError(followingResponse.message || "Failed to fetch following");
          return;
        }

      // Initialize followers as an empty array by default
        setFollowers([]);

        // Check if the API explicitly indicates no followers found
        if (followersResponse.message &&
            (followersResponse.message.includes("No followers") ||
             followersResponse.message.includes("not found"))) {
          // Already set to empty array above
        }
        // Check if the response data contains a message about no followers
        else if (followersResponse.data &&
                followersResponse.data.message &&
                (followersResponse.data.message.includes("No followers") ||
                 followersResponse.data.message.includes("not found"))) {
          // Already set to empty array above
        }
        else {
          // Handle different response structures
          let followersArray = null;

          // Case 1: Direct response with statusCode, message, data structure
          if (followersResponse.data && followersResponse.data.statusCode && followersResponse.data.data) {
            followersArray = followersResponse.data.data;
           }
          // Case 2: Nested data.data structure
          else if (followersResponse.data && followersResponse.data.data && Array.isArray(followersResponse.data.data)) {
            followersArray = followersResponse.data.data;
          }
          // Case 3: Direct data structure
          else if (followersResponse.data && Array.isArray(followersResponse.data)) {
            followersArray = followersResponse.data;
          }

          if (followersArray && Array.isArray(followersArray) && followersArray.length > 0) {
            // Only process if we have actual data
            // Normalize each user object to ensure it has both id and _id properties
            const normalizedFollowers = followersArray.map((follower) => {
              // Skip any entries that don't have basic user data
              if (!follower || (!follower.id && !follower._id)) {
                return null;
              }

              return {
                ...follower,
                id: follower.id || follower._id, // Ensure id is available
                _id: follower._id || follower.id, // Ensure _id is available
              };
            }).filter(Boolean); // Remove any null entries

            if (normalizedFollowers.length > 0) {
              setFollowers(normalizedFollowers);
            }
          }
        }

     
        // Initialize following as an empty array by default
        setFollowing([]);

        // Check if the API explicitly indicates no following found
        if (followingResponse.message &&
            (followingResponse.message.includes("No following") ||
             followingResponse.message.includes("not found"))) {
          // Already set to empty array above
        }
        // Check if the response data contains a message about no following
        else if (followingResponse.data &&
                followingResponse.data.message &&
                (followingResponse.data.message.includes("No following") ||
                 followingResponse.data.message.includes("not found"))) {
          // Already set to empty array above
        }
        else {
          // Handle different response structures
          let followingArray = null;

          // Case 1: Direct response with statusCode, message, data structure
          if (followingResponse.data && followingResponse.data.statusCode && followingResponse.data.data) {
            followingArray = followingResponse.data.data;
           }
          // Case 2: Nested data.data structure
          else if (followingResponse.data && followingResponse.data.data && Array.isArray(followingResponse.data.data)) {
            followingArray = followingResponse.data.data;
           }
          // Case 3: Direct data structure
          else if (followingResponse.data && Array.isArray(followingResponse.data)) {
            followingArray = followingResponse.data;
          }

          if (followingArray && Array.isArray(followingArray) && followingArray.length > 0) {
            // Only process if we have actual data
            // Normalize each user object to ensure it has both id and _id properties
            const normalizedFollowing = followingArray.map((user) => {
              // Skip any entries that don't have basic user data
              if (!user || (!user.id && !user._id)) {
               return null;
              }

              return {
                ...user,
                id: user.id || user._id, // Ensure id is available
                _id: user._id || user.id, // Ensure _id is available
              };
            }).filter(Boolean); // Remove any null entries

            if (normalizedFollowing.length > 0) {
              setFollowing(normalizedFollowing);
            }
          }
        }

        // Create follow status object for all users
        const allUsers = [
          ...followers,
          ...following,
        ];

        // Only process if we have users to check
        const followStatus = {};

        // First, set all users in the "following" list to true (since the logged-in user is following them)
        // This is for the case when viewing your own following list
        if (profileUser && String(profileUser.id) === String(loggedInUserId)) {
          following.forEach(user => {
            const userIdToCheck = user.id || user._id;
            if (userIdToCheck) {
              followStatus[userIdToCheck] = true;
            }
          });
        }

        // Then process all users normally
        if (allUsers.length > 0) {
          allUsers.forEach((user) => {
            // Skip any invalid entries
            if (!user) return;

            const userIdToCheck = user.id || user._id;
            if (userIdToCheck && followStatus[userIdToCheck] === undefined) {
              // Check if the logged-in user is following this user
              // First check if the user has an isFollowing property (from API)
              if (user.isFollowing !== undefined) {
                followStatus[userIdToCheck] = user.isFollowing;
              }
              // Then check if the logged-in user is in the followers array
              else if (user.followers && Array.isArray(user.followers)) {
                // Check for both string IDs and object IDs
                followStatus[userIdToCheck] = user.followers.some(followerId =>
                  String(followerId) === String(loggedInUserId) ||
                  (typeof followerId === 'object' &&
                   (String(followerId.id) === String(loggedInUserId) ||
                    String(followerId._id) === String(loggedInUserId)))
                );
              }
              // Default to false if we can't determine
              else {
                followStatus[userIdToCheck] = false;
              }
            }
          });
        }

        // Special case: If we're in the "following" tab, all users should be marked as followed
        // This is for when viewing someone else's following list
        if (activeTab === "following") {
          following.forEach(user => {
            const userIdToCheck = user.id || user._id;
            if (userIdToCheck) {
              // If the user is in the following list, they should be marked as followed
              // unless we've already determined they're not followed
              if (followStatus[userIdToCheck] === undefined) {
                followStatus[userIdToCheck] = true;
              }
            }
          });
        }

        setFollowingStates(followStatus);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

  // Fetch data initially and when userId or loggedInUserId changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loggedInUserId]);

  // Add a refresh mechanism when the component gains focus
  useEffect(() => {
    // Function to refresh data when the component becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFollow = async (targetUserId) => {
    try {
      // Determine if this was a follow or unfollow action
      const wasFollowing = followingStates[targetUserId];
      const isNowFollowing = !wasFollowing;

      // Update the local state immediately for a responsive UI
      setFollowingStates(prev => ({
        ...prev,
        [targetUserId]: isNowFollowing
      }));

      // Dispatch the appropriate Redux action
      let response;
      if (wasFollowing) {
        response = await dispatch(unfollowUserProfile(targetUserId)).unwrap();
      } else {
        response = await dispatch(followUserProfile(targetUserId)).unwrap();
      }

      // If there was an error, revert the local state change
      if (response && response.error) {
        console.error("Error toggling follow status:", response.message);
        setFollowingStates(prev => ({
          ...prev,
          [targetUserId]: wasFollowing // Revert to previous state
        }));
        return;
      }

      // If we're removing a follow in the "following" tab, remove them from the list
      // This is especially important when viewing your own following list
      if (wasFollowing && activeTab === "following") {
        // If this is the logged-in user's profile, remove the unfollowed user from the list
        if (profileUser && String(profileUser.id) === String(loggedInUserId)) {
          setFollowing(prevFollowing =>
            prevFollowing.filter(user =>
              String(user.id) !== String(targetUserId) &&
              String(user._id) !== String(targetUserId)
            )
          );
        }
      }

      // If we're viewing our own profile and we remove a follow
      if (wasFollowing && profileUser && profileUser.id === loggedInUserId && activeTab === "following") {
        // We've already handled this case above
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      // Revert the local state change on error
      const wasFollowing = followingStates[targetUserId];
      setFollowingStates(prev => ({
        ...prev,
        [targetUserId]: wasFollowing // Revert to previous state
      }));
    }
  };

  if (loading) {
    return (
      <div className="following-modal">
        <div className="following-header">
          <button
            className="following-back-button"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
          </button>
          <div className="following-header-info">
            <h2 className="following-header-title">
              {activeTab === "followers" ? "Followers" : "Following"}
            </h2>
          </div>
        </div>
        <div className="following-tabs-container">
          <div
            className={`following-tab ${
              activeTab === "followers" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("followers");
              navigate(`/user/${userId}/followers`, { replace: true });
            }}
          >
            Followers
          </div>
          <div
            className={`following-tab ${
              activeTab === "following" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("following");
              navigate(`/user/${userId}/following`, { replace: true });
            }}
          >
            Following
          </div>
        </div>
        <div className="following-content">
          <div className="following-loading">
            Loading {activeTab === "followers" ? "followers" : "following"}...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="following-modal">
        <div className="following-header">
          <button
            className="following-back-button"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
          </button>
          <div className="following-header-info">
            <h2 className="following-header-title">
              {activeTab === "followers" ? "Followers" : "Following"}
            </h2>
          </div>
        </div>
        <div className="following-tabs-container">
          <div
            className={`following-tab ${
              activeTab === "followers" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("followers");
              navigate(`/user/${userId}/followers`, { replace: true });
            }}
          >
            Followers
          </div>
          <div
            className={`following-tab ${
              activeTab === "following" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("following");
              navigate(`/user/${userId}/following`, { replace: true });
            }}
          >
            Following
          </div>
        </div>
        <div className="following-content">
          <div className="following-error">
            {error}
            <button
              className="following-retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="following-modal">
      <div className="following-header">
        <button className="following-back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div className="following-header-info">
          <h2 className="following-header-title">
            {profileUser ? (
              <>
                {activeTab === "followers"
                  ? `People following ${profileUser.firstName}`
                  : `People ${profileUser.firstName} follows`}
              </>
            ) : activeTab === "followers" ? (
              "Followers"
            ) : (
              "Following"
            )}
          </h2>
        </div>
      </div>
      <div className="following-tabs-container">
        <div
          className={`following-tab ${
            activeTab === "followers" ? "active" : ""
          }`}
          onClick={() => {
            setActiveTab("followers");
            navigate(`/user/${userId}/followers`, { replace: true });
          }}
        >
          Followers
        </div>
        <div
          className={`following-tab ${
            activeTab === "following" ? "active" : ""
          }`}
          onClick={() => {
            setActiveTab("following");
            navigate(`/user/${userId}/following`, { replace: true });
          }}
        >
          Following
        </div>
      </div>
      <div className="following-content">
        {activeTab === "followers" ? (
          <ul className="following-user-list">
            {followers.length > 0 ? (
              followers.map((follower) => (
                <li className="following-user-item" key={follower.id}>
                  <Link
                    to={`/profile/${follower.id}`}
                    className="following-user-info-link"
                  >
                    <div className="following-user-info">
                      <img
                        src={follower.profilePic || DEFAULT_PROFILE_PIC}
                        alt={follower.username}
                        className="following-user-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_PROFILE_PIC;
                        }}
                      />
                      <div className="following-user-details">
                        <span className="following-user-name">
                          {follower.firstName} {follower.lastName}
                        </span>
                        <span className="following-user-handle">
                          @{follower.username}
                        </span>
                        {follower.bio && (
                          <span className="following-user-bio">
                            {follower.bio}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {follower.id !== loggedInUserId && (
                    <div className="following-follow">
                      <FollowButton
                        isFollowing={followingStates[follower.id]}
                        toggleFollow={() => toggleFollow(follower.id)}
                      />
                    </div>
                  )}
                </li>
              ))
            ) : (
              <div className="following-empty-state">
                <h3 className="following-empty-state-title">
                  No followers yet
                </h3>
                <p className="following-empty-state-text">
                  When someone follows this account, they'll show up here.
                </p>
              </div>
            )}
          </ul>
        ) : (
          <ul className="following-user-list">
            {following.length > 0 ? (
              following.map((user) => (
                <li className="following-user-item" key={user.id}>
                  <Link
                    to={`/profile/${user.id}`}
                    className="following-user-info-link"
                  >
                    <div className="following-user-info">
                      <img
                        src={user.profilePic || DEFAULT_PROFILE_PIC}
                        alt={user.username}
                        className="following-user-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_PROFILE_PIC;
                        }}
                      />
                      <div className="following-user-details">
                        <span className="following-user-name">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="following-user-handle">
                          @{user.username}
                        </span>
                        {user.bio && (
                          <span className="following-user-bio">{user.bio}</span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {user.id !== loggedInUserId && (
                    <div className="following-follow">
                      <FollowButton
                        isFollowing={activeTab === "following" ? true : followingStates[user.id]}
                        toggleFollow={() => toggleFollow(user.id)}
                      />
                    </div>
                  )}
                </li>
              ))
            ) : (
              <div className="following-empty-state">
                <h3 className="following-empty-state-title">
                  Not following anyone
                </h3>
                <p className="following-empty-state-text">
                  When this account follows someone, they'll show up here.
                </p>
              </div>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};
