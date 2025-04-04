import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import FollowButton from "./FollowButton";
import "./css/userlist.css";
import { followUser, getUserFollowers } from "../../apis/profile";

const DEFAULT_PROFILE_PIC = "/assets/profilePic.jpeg";

const FollowersList = () => {
  const { userId } = useParams();
  const [followers, setFollowers] = useState([]);
  const [loggedInUserId] = useState(localStorage.getItem("userId"));
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const data = await getUserFollowers(userId);
        setFollowers(data);
        const followStatus = {};
        data.forEach((follower) => {
          followStatus[follower.id] =
            follower.followers?.includes(loggedInUserId);
        });
        setFollowingStates(followStatus);
      } catch (err) {
        console.error("Error fetching followers:", err);
      }
    };

    fetchFollowers();
  }, [userId, loggedInUserId]);

  const toggleFollow = async (targetUserId) => {
    try {
      await followUser(targetUserId);
      setFollowingStates((prev) => ({
        ...prev,
        [targetUserId]: !prev[targetUserId],
      }));
    } catch (err) {
      console.error("Follow/unfollow failed:", err);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Followers</h3>
        <ul className="user-list">
          {followers.length > 0 ? (
            followers.map((follower) => (
              <li className="user-item" key={follower.id}>
                <div className="user-info">
                  <img
                    src={DEFAULT_PROFILE_PIC}
                    // src={follower.profilePic || DEFAULT_PROFILE_PIC}
                    alt={follower.username}
                    className="user-avatar"
                  />
                  <div className="user-details">
                    <span className="user-name">
                      {follower.firstName} {follower.lastName}
                    </span>
                    <span className="user-handle">@{follower.username}</span>
                  </div>
                </div>

                {follower.id !== loggedInUserId && (
                  <div className="follow">
                    <FollowButton
                      isFollowing={followingStates[follower.id]}
                      toggleFollow={() => toggleFollow(follower.id)}
                    />
                  </div>
                )}
              </li>
            ))
          ) : (
            <p>No followers yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FollowersList;
