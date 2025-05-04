import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { FollowButton } from "../FollowButton";
import {
  getUserFollowers,
  getUserFollowing,
  followUser,
  fetchUserProfileById,
} from "../../api/profileApi";
import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import "./FollowersList.css";

export const FollowersList = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = window.location.pathname;

  // Set initial active tab based on the URL
  const initialTab = location.includes("/following")
    ? "following"
    : "followers";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loggedInUserId] = useState(localStorage.getItem("userId"));
  const [followingStates, setFollowingStates] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch the profile user's information
        const profileResponse = await fetchUserProfileById(userId);

        if (profileResponse.error) {
          setError(profileResponse.message || "Failed to fetch user profile");
          return;
        }

        // Process profile data
        if (profileResponse.data && profileResponse.data.data) {
          const userData = profileResponse.data.data;
          setProfileUser({
            ...userData,
            id: userData.id || userData._id,
            _id: userData._id || userData.id,
          });
        } else {
          console.error(
            "Invalid profile data structure:",
            profileResponse.data
          );
          setError("Failed to parse profile data");
          return;
        }

        // Fetch followers of the profile we're viewing
        const followersResponse = await getUserFollowers(userId);
        // Fetch users that the profile we're viewing is following
        const followingResponse = await getUserFollowing(userId);

        if (followersResponse.error) {
          setError(followersResponse.message || "Failed to fetch followers");
          return;
        }

        if (followingResponse.error) {
          setError(followingResponse.message || "Failed to fetch following");
          return;
        }

        // Process followers data - these are people who follow the profile we're viewing
        const followersData = followersResponse.data;
        if (
          followersData &&
          followersData.data &&
          Array.isArray(followersData.data)
        ) {
          // Normalize each user object to ensure it has both id and _id properties
          const normalizedFollowers = followersData.data.map((follower) => ({
            ...follower,
            id: follower.id || follower._id, // Ensure id is available
            _id: follower._id || follower.id, // Ensure _id is available
          }));

          setFollowers(normalizedFollowers);
        } else {
          console.error("Invalid followers data structure:", followersData);
          setError("Failed to parse followers data");
        }

        // Process following data - these are people the profile we're viewing follows
        const followingData = followingResponse.data;
        if (
          followingData &&
          followingData.data &&
          Array.isArray(followingData.data)
        ) {
          // Normalize each user object to ensure it has both id and _id properties
          const normalizedFollowing = followingData.data.map((user) => ({
            ...user,
            id: user.id || user._id, // Ensure id is available
            _id: user._id || user.id, // Ensure _id is available
          }));

          setFollowing(normalizedFollowing);
        } else {
          console.error("Invalid following data structure:", followingData);
          setError("Failed to parse following data");
        }

        // Create follow status object for all users (both followers and following)
        // This determines which users the LOGGED IN user is following
        const allUsers = [
          ...(followersData?.data || []),
          ...(followingData?.data || []),
        ];
        const followStatus = {};
        allUsers.forEach((user) => {
          const userIdToCheck = user.id || user._id;
          if (userIdToCheck) {
            // Check if the logged-in user is following this user
            followStatus[userIdToCheck] =
              user.followers?.includes(loggedInUserId);
          }
        });
        setFollowingStates(followStatus);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, loggedInUserId]);

  const toggleFollow = async (userId) => {
    try {
      const response = await followUser(userId);

      if (response.error) {
        console.error("Error following/unfollowing user:", response.message);
        return;
      }

      // Update the following state for this user
      setFollowingStates((prev) => ({
        ...prev,
        [userId]: !prev[userId],
      }));

      // If we're unfollowing a user in the "following" tab, we might want to refetch the data
      // to ensure the UI is consistent, but we'll keep the user in the list until a refresh
      // for better UX
    } catch (err) {
      console.error("Error toggling follow:", err);
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
              navigate(`/profile/${userId}/followers`, { replace: true });
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
              navigate(`/profile/${userId}/following`, { replace: true });
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
              navigate(`/profile/${userId}/followers`, { replace: true });
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
              navigate(`/profile/${userId}/following`, { replace: true });
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
            navigate(`/profile/${userId}/followers`, { replace: true });
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
            navigate(`/profile/${userId}/following`, { replace: true });
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
                        isFollowing={followingStates[user.id]}
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
