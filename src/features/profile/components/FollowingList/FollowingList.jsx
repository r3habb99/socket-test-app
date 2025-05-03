import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { FollowButton } from "../FollowButton";
import { getUserFollowing, followUser } from "../../api/profileApi";
import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import "./FollowingList.css";

export const FollowingList = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [loggedInUserId] = useState(localStorage.getItem("userId"));
  const [followingStates, setFollowingStates] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowing = async () => {
      setLoading(true);
      try {
        const response = await getUserFollowing(userId);

        if (response.error) {
          setError(response.message || "Failed to fetch following");
          return;
        }

        // The API response has a nested structure with the actual data in the 'data' property
        const userData = response.data;

        // Check if we have valid data and it's an array
        if (userData && userData.data && Array.isArray(userData.data)) {
          // Normalize each user object to ensure it has both id and _id properties
          const normalizedUsers = userData.data.map((user) => ({
            ...user,
            id: user.id || user._id, // Ensure id is available
            _id: user._id || user.id, // Ensure _id is available
          }));

          setFollowing(normalizedUsers);

          // Create follow status object
          const followStatus = {};
          normalizedUsers.forEach((user) => {
            followStatus[user.id] = user.followers?.includes(loggedInUserId);
          });
          setFollowingStates(followStatus);
        } else {
          console.error("Invalid following data structure:", userData);
          setError("Failed to parse following data");
        }
      } catch (err) {
        console.error("Error fetching following:", err);
        setError("Failed to load following. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
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
      <div className="modal">
        <div className="modal-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <div className="modal-header-info">
            <h2 className="modal-header-title">Following</h2>
          </div>
        </div>
        <div className="tabs-container">
          <Link to={`/profile/${userId}/followers`} className="tab">
            Followers
          </Link>
          <Link to={`/profile/${userId}/following`} className="tab active">
            Following
          </Link>
        </div>
        <div className="modal-content">
          <p>Loading following...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal">
        <div className="modal-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <div className="modal-header-info">
            <h2 className="modal-header-title">Following</h2>
          </div>
        </div>
        <div className="tabs-container">
          <Link to={`/profile/${userId}/followers`} className="tab">
            Followers
          </Link>
          <Link to={`/profile/${userId}/following`} className="tab active">
            Following
          </Link>
        </div>
        <div className="modal-content">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal">
      <div className="modal-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div className="modal-header-info">
          <h2 className="modal-header-title">Following</h2>
        </div>
      </div>
      <div className="tabs-container">
        <Link to={`/profile/${userId}/followers`} className="tab">
          Followers
        </Link>
        <Link to={`/profile/${userId}/following`} className="tab active">
          Following
        </Link>
      </div>
      <div className="modal-content">
        <ul className="user-list">
          {following.length > 0 ? (
            following.map((user) => (
              <li className="user-item" key={user.id}>
                <Link to={`/profile/${user.id}`} className="user-info-link">
                  <div className="user-info">
                    <img
                      src={user.profilePic || DEFAULT_PROFILE_PIC}
                      alt={user.username}
                      className="user-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_PROFILE_PIC;
                      }}
                    />
                    <div className="user-details">
                      <span className="user-name">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="user-handle">@{user.username}</span>
                    </div>
                  </div>
                </Link>

                {user.id !== loggedInUserId && (
                  <div className="follow">
                    <FollowButton
                      isFollowing={followingStates[user.id]}
                      toggleFollow={() => toggleFollow(user.id)}
                    />
                  </div>
                )}
              </li>
            ))
          ) : (
            <p>Not following anyone yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
};
