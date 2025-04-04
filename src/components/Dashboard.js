import React, { useState } from "react";
import { SocketProvider } from "./SocketProvider";
import Chat from "./Chat";
import Sidebar from "./Sidebar";
import "../css/dashboard.css"; // Styles for layout and sidebar
import { Profile } from "./Profile";

const Dashboard = () => {
  const [activeComponent, setActiveComponent] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define the links for the sidebar
  const links = [
    { name: "chat", label: "Chat" },
    { name: "profile", label: "Profile" },
    // Add more links here as needed
  ];

  // Handle the active component change when a sidebar item is clicked
  const handleLinkClick = (componentName) => {
    setActiveComponent(componentName);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false); // Close the sidebar if it's a mobile view
    }
  };

  // Toggle sidebar visibility on small screens
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <SocketProvider>
      <div className="dashboard-container">
        {/* Hamburger icon for small screens */}
        <div className="hamburger-icon" onClick={toggleSidebar}>
          &#9776; {/* Unicode character for hamburger icon */}
        </div>

        <Sidebar
          links={links}
          onLinkClick={handleLinkClick}
          sidebarOpen={sidebarOpen}
        />

        <div className="main-content">
          {activeComponent === "chat" && <Chat />}
          {activeComponent === "profile" && <Profile />}
          {/* Add more components here based on the active component */}
        </div>
      </div>
    </SocketProvider>
  );
};

export default Dashboard;
