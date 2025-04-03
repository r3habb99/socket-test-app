import React, { useState, useEffect } from "react";
import "../css/userlist.css";
import { getUserFollowers } from "../apis/profile";

const DEFAULT_PROFILE_PIC = "/assets/profilePic.jpeg"; // Fallback image

const FollowersList = ({ userId, setModal }) => {
  const [followers, setFollowers] = useState([]);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const data = await getUserFollowers(userId);
        console.log(data);
        setFollowers(data);
      } catch (err) {
        console.error("Error fetching followers:", err);
      }
    };

    fetchFollowers();
  }, [userId]);

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Followers</h3>
        <button onClick={() => setModal(false)}>×</button>
        <ul className="user-list">
          {followers.length > 0 ? (
            followers.map((follower) => (
              <li key={follower.id} className="user-item">
                <img
                  src={follower.profilePic || DEFAULT_PROFILE_PIC}
                  alt="Profile"
                  className="user-avatar"
                />
                <span className="user-name">{follower.username}</span>
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
