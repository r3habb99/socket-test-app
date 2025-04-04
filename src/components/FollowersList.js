import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getUserFollowers } from "../apis/profile"; // Make sure this is the correct API call

const DEFAULT_PROFILE_PIC = "/assets/profilePic.jpeg"; // Fallback image

const FollowersList = () => {
  const { userId } = useParams(); // Get the userId from the URL

  const [followers, setFollowers] = useState([]);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        // Make sure the userId is passed correctly in the API call
        const data = await getUserFollowers(userId); // Assuming the function is defined in your API helper
        setFollowers(data);
      } catch (err) {
        console.error("Error fetching followers:", err);
      }
    };

    fetchFollowers();
  }, [userId]); // Ensure the effect is rerun when the userId changes

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Followers</h3>
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
