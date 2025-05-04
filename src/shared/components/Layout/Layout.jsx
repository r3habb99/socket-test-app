import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuthContext } from "../../../core/providers/AuthProvider";
import { Sidebar } from "../Sidebar/Sidebar";
import "./Layout.css";

/**
 * Layout component
 * @returns {JSX.Element} Layout component
 */
const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuthContext();

  const links = [
    { name: "dashboard", label: "Feed", icon: "📰" },
    { name: "dashboard/messages", label: "Messages", icon: "✉️" },
    { name: "profile", label: "Profile", icon: "👤" },
    // { name: "toast-test", label: "Toast Tester", icon: "🔔" },
    { name: "logout", label: "Logout", icon: "🚪" },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard-container">
      <div className="hamburger-icon" onClick={toggleSidebar}>
        &#9776;
      </div>
      <Sidebar
        links={links}
        sidebarOpen={sidebarOpen}
        onLogout={handleLogout}
      />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
