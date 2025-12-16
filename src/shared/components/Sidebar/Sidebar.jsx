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
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-header">
        <h2>ChatSphere</h2>
      </div>

      {/* Search Component */}

      <nav className="sidebar-nav" aria-label="Primary navigation">
        <ul role="menubar" aria-label="Navigation menu">
          {links.map((link) => {
            // Skip logout, we'll add it separately at the end
            if (link.name === "logout") return null;

            // Check if this link is active - exact match only
            const currentPath = location.pathname.replace(/^\//, ''); // Remove leading slash
            const linkPath = link.name;

            // Exact match for the path
            const isActive = currentPath === linkPath;

            return (
              <li key={link.name} role="none">
                <Link
                  to={`/${link.name}`}
                  className={isActive ? "active" : ""}
                  onClick={() => handleLinkClick(link.name)}
                  role="menuitem"
                  aria-label={`Navigate to ${link.label}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Bottom section with Theme Controls and Logout */}
        <div className="sidebar-bottom">
          <ul role="menubar" aria-label="Settings and logout">
            {/* Theme Selector */}
            <li role="none">
              <ThemeSelector />
            </li>
            {/* Theme Toggle */}
            <li role="none">
              <ThemeToggle />
            </li>
            {/* Logout Button */}
            <li role="none">
              <button
                className="logout-button"
                onClick={() => handleLinkClick("logout")}
                role="menuitem"
                aria-label="Log out of your account"
              >
                <span className="nav-icon" aria-hidden="true">
                  {links.find(l => l.name === "logout")?.icon}
                </span>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
};
