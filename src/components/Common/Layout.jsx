import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProfileEdit from "../Profile/ProfileEdit";

import "../../css/dashboard.css";

import { FollowersList, FollowingList, Profile } from "../Profile/index";
import { SocketProvider } from "../Messages/SocketProvider";
import { Sidebar } from "./Sidebar";
// Removed import of Chat component
import { Feed } from "../Post";
import { MessagingAppContent } from "../Messages/MessagingApp";

export const Layout = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { name: "dashboard", label: "Feed" },
    { name: "dashboard/messages", label: "Messages" },
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
            <Route
              path="/dashboard/messages"
              element={<MessagingAppContent />}
            />
            <Route
              path="/chat"
              element={<Navigate to="/dashboard/messages" replace />}
            />
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
