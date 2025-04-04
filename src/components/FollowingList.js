import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Import useParams to get the userId from the URL
import "../css/userlist.css";
import { getUserFollowing } from "../apis/profile";

const DEFAULT_PROFILE_PIC = "/assets/profilePic.jpeg"; // Fallback image

const FollowingList = () => {
  const { userId } = useParams(); // Get userId from the route params
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
