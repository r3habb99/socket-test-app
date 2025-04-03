import React, { useEffect, useState } from "react";
import "../css/profile.css";
import FollowButton from "./FollowButton";
import FollowersList from "./FollowersList";
import FollowingList from "./FollowingList";
import ProfilePicUploader from "./ProfilePicUploader";
import CoverPhotoUploader from "./CoverPhotoUploader";
import { fetchUserProfile } from "../apis/auth";
import { followUser } from "../apis/profile";

const DEFAULT_COVER_PHOTO = "/assets/backgroundWall.jpg";
const DEFAULT_PROFILE_PIC = "/assets/profilePic.jpeg";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersModal, setFollowersModal] = useState(false);
  const [followingModal, setFollowingModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await fetchUserProfile();
        setUser(data);
        setIsFollowing(data.followers.includes(localStorage.getItem("userId")));
      } catch (err) {
        setError(err.message);
      }
    };
    fetchProfile();
  }, []);

  const toggleFollow = async () => {
    try {
      await followUser(user.id);
      setIsFollowing(!isFollowing);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="profile-container">
      {/* Cover Photo Section */}
      <div className="profile-header">
        {user && (
          <img
            src={user.coverPhoto || DEFAULT_COVER_PHOTO}
            alt="Cover"
            className="cover-photo"
          />
        )}
        <CoverPhotoUploader setUser={setUser} />
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        <div className="profile-left">
          {user && (
            <img
              src={user.profilePic || DEFAULT_PROFILE_PIC}
              alt="Profile"
              className="profile-pic"
            />
          )}
          <ProfilePicUploader setUser={setUser} />
        </div>

        <div className="profile-right">
          <h2>
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="username">@{user?.username}</p>
          <p className="email">{user?.email}</p>

          {/* Followers & Following */}
          <div className="stats">
            <div>
              <strong>{user?.followers?.length}</strong> Followers
              <span onClick={() => setFollowersModal(true)}>View</span>
            </div>
            <div>
              <strong>{user?.following?.length}</strong> Following
              <span onClick={() => setFollowingModal(true)}>View</span>
            </div>
          </div>

          <FollowButton isFollowing={isFollowing} toggleFollow={toggleFollow} />

          <div className="bio">
            <p>Bio: Coming soon!</p>
          </div>
        </div>
      </div>

      {/* Followers & Following Modals */}
      {followersModal && (
        <FollowersList userId={user.id} setModal={setFollowersModal} />
      )}
      {followingModal && (
        <FollowingList userId={user.id} setModal={setFollowingModal} />
      )}
    </div>
  );
};

export default Profile;
