import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProfileEdit from "../Profile/ProfileEdit";

import "../../css/dashboard.css";

import { FollowersList, FollowingList, Profile } from "../Profile";
import { SocketProvider } from "../Messages/SocketProvider";
import { Sidebar } from "./index";
import { Chat } from "../Messages/Chat";
import { Feed } from "../Post";

export const Layout = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { name: "dashboard", label: "Feed" },
    { name: "chat", label: "Chat" },
    { name: "profile", label: "Profile" },
    { name: "logout", label: "Logout" },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <SocketProvider>
      <div className="dashboard-container">
        <div className="hamburger-icon" onClick={toggleSidebar}>
          &#9776;
        </div>
        <Sidebar links={links} sidebarOpen={sidebarOpen} onLogout={onLogout} />
        <div className="main-content">
          <Routes>
            <Route path="/dashboard" element={<Feed />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/user/:userId/followers" element={<FollowersList />} />
            <Route path="/user/:userId/following" element={<FollowingList />} />
            <Route path="/user/edit-profile" element={<ProfileEdit />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </SocketProvider>
  );
};
// Layout.jsx
