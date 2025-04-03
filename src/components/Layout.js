import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider } from "./SocketProvider";
import Sidebar from "./Sidebar";
import Chat from "./Chat";
import Profile from "./Profile";
import "../css/dashboard.css";

const Layout = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { name: "dashboard", label: "Dashboard" },
    { name: "chat", label: "Chat" },
    { name: "profile", label: "Profile" },
    { name: "logout", label: "Logout" }, // Logout is handled here
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
            <Route path="/dashboard" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </SocketProvider>
  );
};

export default Layout;
