import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "../ThemeToggle";
import { ThemeSelector } from "../ThemeSelector";
// import { Search } from "../Search";
import "./Sidebar.css";

/**
 * Sidebar component - Only used for desktop view
 * @param {Object} props - Component props
 * @param {Array} props.links - Navigation links
 * @param {Function} props.onLogout - Logout function
 * @returns {JSX.Element} Sidebar component
 */
export const Sidebar = ({ links, onLogout }) => {
  const location = useLocation();

  const handleLinkClick = (name) => {
    if (name === "logout") {
      onLogout();
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>ChatSphere</h2>
      </div>

      {/* Search Component */}

      <nav className="sidebar-nav">
        <ul>
          {links.map((link) => {
            // Skip logout, we'll add it separately at the end
            if (link.name === "logout") return null;

            // Check if this link is active - exact match only
            const currentPath = location.pathname.replace(/^\//, ''); // Remove leading slash
            const linkPath = link.name;

            // Exact match for the path
            const isActive = currentPath === linkPath;

            return (
              <li key={link.name}>
                <Link
                  to={`/${link.name}`}
                  className={isActive ? "active" : ""}
                  onClick={() => handleLinkClick(link.name)}
                >
                  <span className="nav-icon">{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Bottom section with Theme Controls and Logout */}
        <div className="sidebar-bottom">
          <ul>
            {/* Theme Selector */}
            <li>
              <ThemeSelector />
            </li>
            {/* Theme Toggle */}
            <li>
              <ThemeToggle />
            </li>
            {/* Logout Button */}
            <li>
              <button
                className="logout-button"
                onClick={() => handleLinkClick("logout")}
              >
                <span className="nav-icon">
                  {links.find(l => l.name === "logout")?.icon}
                </span>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};
