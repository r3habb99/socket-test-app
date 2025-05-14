import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { FollowButton } from "../FollowButton";
import {
  getUserFollowing,
  getUserFollowers,
  followUser,
  fetchUserProfileById,
} from "../../api/profileApi";
import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import "./FollowingList.css";

export const FollowingList = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
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
        console.log("Profile response for following list:", profileResponse);

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

        // Process followers data
        console.log("Followers response:", followersResponse);

        // Handle different response structures
        let followersArray = null;

        // Case 1: Direct response with statusCode, message, data structure
        if (followersResponse.data && followersResponse.data.statusCode && followersResponse.data.data) {
          followersArray = followersResponse.data.data;
          console.log("Found followers in response.data.data with statusCode structure", followersArray);
        }
        // Case 2: Nested data.data structure
        else if (followersResponse.data && followersResponse.data.data && Array.isArray(followersResponse.data.data)) {
          followersArray = followersResponse.data.data;
          console.log("Found followers in response.data.data structure", followersArray);
        }
        // Case 3: Direct data structure
        else if (followersResponse.data && Array.isArray(followersResponse.data)) {
          followersArray = followersResponse.data;
          console.log("Found followers in direct response.data structure", followersArray);
        }

        if (followersArray && Array.isArray(followersArray)) {
          // Normalize each user object to ensure it has both id and _id properties
          const normalizedFollowers = followersArray.map((follower) => ({
            ...follower,
            id: follower.id || follower._id, // Ensure id is available
            _id: follower._id || follower.id, // Ensure _id is available
          }));

          setFollowers(normalizedFollowers);
        } else {
          console.error("Invalid followers data structure:", followersResponse);
          setError("Failed to parse followers data");
        }

        // Process following data
        console.log("Following response:", followingResponse);

        // Handle different response structures
        let followingArray = null;

        // Case 1: Direct response with statusCode, message, data structure
        if (followingResponse.data && followingResponse.data.statusCode && followingResponse.data.data) {
          followingArray = followingResponse.data.data;
          console.log("Found following in response.data.data with statusCode structure", followingArray);
        }
        // Case 2: Nested data.data structure
        else if (followingResponse.data && followingResponse.data.data && Array.isArray(followingResponse.data.data)) {
          followingArray = followingResponse.data.data;
          console.log("Found following in response.data.data structure", followingArray);
        }
        // Case 3: Direct data structure
        else if (followingResponse.data && Array.isArray(followingResponse.data)) {
          followingArray = followingResponse.data;
          console.log("Found following in direct response.data structure", followingArray);
        }

        if (followingArray && Array.isArray(followingArray)) {
          // Normalize each user object to ensure it has both id and _id properties
          const normalizedFollowing = followingArray.map((user) => ({
            ...user,
            id: user.id || user._id, // Ensure id is available
            _id: user._id || user.id, // Ensure _id is available
          }));

          setFollowing(normalizedFollowing);
        } else {
          console.error("Invalid following data structure:", followingResponse);
          setError("Failed to parse following data");
        }

        // Create follow status object for all users
        const allUsers = [
          ...(followersArray || []),
          ...(followingArray || []),
        ];
        const followStatus = {};
        allUsers.forEach((user) => {
          const userIdToCheck = user.id || user._id;
          if (userIdToCheck) {
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

      setFollowingStates((prev) => ({
        ...prev,
        [userId]: !prev[userId],
      }));
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
