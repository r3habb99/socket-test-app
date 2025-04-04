import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getUserFollowing, followUser } from "../apis/profile";
import FollowButton from "./FollowButton";
import "../css/userlist.css";

const DEFAULT_PROFILE_PIC = "/assets/profilePic.jpeg";

const FollowingList = () => {
  const { userId } = useParams();
  const [following, setFollowing] = useState([]);
  const [loggedInUserId] = useState(localStorage.getItem("userId"));
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const data = await getUserFollowing(userId);
        setFollowing(data);

        const followStatus = {};
        data.forEach((user) => {
          followStatus[user.id] = user.followers?.includes(loggedInUserId);
        });
        setFollowingStates(followStatus);
      } catch (err) {
        console.error("Error fetching following:", err);
      }
    };

    fetchFollowing();
  }, [userId, loggedInUserId]);

  const toggleFollow = async (targetUserId) => {
    try {
      await followUser(targetUserId);
      setFollowingStates((prev) => ({
        ...prev,
        [targetUserId]: !prev[targetUserId],
      }));
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Following</h3>
        <ul className="user-list">
          {following.length > 0 ? (
            following.map((user) => (
              <li className="user-item" key={user.id}>
                <div className="user-info">
                  <img
                    src={DEFAULT_PROFILE_PIC}
                    // src={user.profilePic || DEFAULT_PROFILE_PIC}
                    alt={user.username}
                    className="user-avatar"
                  />
                  <div className="user-details">
                    <span className="user-name">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="user-handle">@{user.username}</span>
                  </div>
                </div>

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

export default FollowingList;
