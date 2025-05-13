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
 * @returns {JSX.Element} Sidebar component
 */
export const Sidebar = ({ links, sidebarOpen, onLogout }) => {
  const location = useLocation();

  const handleLinkClick = (name) => {
    if (name === "logout") {
      onLogout();
    }
  };

  return (
    <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
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
                    location.pathname === `/${link.name}` ? "active" : ""
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
