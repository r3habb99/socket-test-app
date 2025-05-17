import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Search } from "../Search";
import "./Sidebar.css";

/**
 * Sidebar component
 * @param {Object} props - Component props
 * @param {Array} props.links - Navigation links
 * @param {boolean} props.sidebarOpen - Whether sidebar is open
 * @param {Function} props.onLogout - Logout function
 * @param {Function} props.onClose - Function to close the sidebar
 * @returns {JSX.Element} Sidebar component
 */
export const Sidebar = ({ links, sidebarOpen, onLogout, onClose }) => {
  const location = useLocation();
  const isMobile = window.innerWidth <= 768;

  const handleLinkClick = (name) => {
    if (name === "logout") {
      onLogout();
    }

    // Close sidebar on mobile after clicking a link
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      {/* Close button for mobile */}
      {isMobile && onClose && (
        <button className="sidebar-close" onClick={onClose}>
          &times;
        </button>
      )}

      <div className="sidebar-header">
        <h2>Twitter Clone</h2>
      </div>

      {/* Search Component */}
      <Search />

      <nav className="sidebar-nav">
        <ul>
          {links.map((link) => (
            <li key={link.name}>
              {link.name === "logout" ? (
                <button
                  className="logout-button"
                  onClick={() => handleLinkClick(link.name)}
                >
                  <span className="nav-icon">{link.icon}</span>
                  {link.label}
                </button>
              ) : (
                <Link
                  to={`/${link.name}`}
                  className={
                    location.pathname.includes(`/${link.name}`) ? "active" : ""
                  }
                  onClick={() => handleLinkClick(link.name)}
                >
                  <span className="nav-icon">{link.icon}</span>
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
