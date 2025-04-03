import React, { useState, useEffect } from "react";
import "../css/userlist.css";
import { getUserFollowing } from "../apis/profile";

const DEFAULT_PROFILE_PIC = "/assets/backgroundWall.jpg";

const FollowingList = ({ userId, setModal }) => {
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const data = await getUserFollowing(userId);
        setFollowing(data);
      } catch (err) {
        console.error("Error fetching following:", err);
      }
    };

    fetchFollowing();
  }, [userId]);

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Following</h3>
        <button onClick={() => setModal(false)}>×</button>
        <ul className="user-list">
          {following.length > 0 ? (
            following.map((follow) => (
              <li key={follow.id} className="user-item">
                <img
                  src={follow.profilePic || DEFAULT_PROFILE_PIC}
                  alt="Profile"
                  className="user-avatar"
                />
                <span className="user-name">{follow.username}</span>
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
