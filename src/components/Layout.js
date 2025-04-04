import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider } from "./SocketProvider";
import Sidebar from "./Sidebar";
import Chat from "./Chat";
import Profile from "./Profile";
import FollowersList from "./FollowersList"; // Import the Followers List component
import FollowingList from "./FollowingList"; // Import the Following List component
import "../css/dashboard.css";
import ProfileEdit from "./ProfileEdit";

const Layout = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { name: "dashboard", label: "Dashboard" },
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
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            {/* Add routes for followers and following */}
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

export default Layout;
