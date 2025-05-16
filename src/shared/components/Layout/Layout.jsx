import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../core/providers/AuthProvider";
import { Sidebar } from "../Sidebar/Sidebar";
import { logout } from "../../../features/auth/api/authApi";
import "./Layout.css";

/**
 * Layout component
 * @returns {JSX.Element} Layout component
 */
const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const authContext = useAuthContext();
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    try {
      // First call the API to logout from the server
      await logout();
      
      // Then use the context logout to clear local state
      if (typeof authContext.logout === 'function') {
        authContext.logout();
      } else {
        // Fallback if logout function is not available
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
      }
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      // Still logout locally even if server logout fails
      if (typeof authContext.logout === 'function') {
        authContext.logout();
      } else {
        // Fallback if logout function is not available
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
      }
      navigate('/login');
    }
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
