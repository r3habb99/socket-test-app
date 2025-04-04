import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProfileEdit from "../../components/Profile/ProfileEdit";
import Chat from "../../components/Chat";
import Profile from "../../components/Profile/Profile";
import FollowersList from "../Profile/FollowersList"; // Import the Followers List component
import FollowingList from "../Profile/FollowingList"; // Import the Following List component
import "../../css/dashboard.css";
import { SocketProvider } from "../Common/SocketProvider";
import Sidebar from "../Common/Sidebar";

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
