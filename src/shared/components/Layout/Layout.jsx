import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthContext } from "../../../core/providers/AuthProvider";
import { Sidebar } from "../Sidebar/Sidebar";
import { ThemeToggle } from "../ThemeToggle";
import { logout } from "../../../features/auth/api/authApi";
import {
  HomeOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  MoreOutlined,
  HomeFilled,
  MessageFilled,
  SearchOutlined,
  BellOutlined
} from "@ant-design/icons";
import "./Layout.css";

/**
 * Layout component
 * @returns {JSX.Element} Layout component
 */
const Layout = () => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const authContext = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const moreMenuRef = useRef(null);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const links = [
    {
      name: "dashboard",
      label: "Feed",
      icon: <HomeOutlined />,
      activeIcon: <HomeFilled />
    },
    {
      name: "dashboard/messages",
      label: "Messages",
      icon: <MessageOutlined />,
      activeIcon: <MessageFilled style={{ color: '#1d9bf0' }}/>
    },
    {
      name: "search",
      label: "Search",
      icon: <SearchOutlined />,
      activeIcon: <SearchOutlined style={{ color: '#1d9bf0' }} />
    },
    {
      name: "notifications",
      label: "Notifications",
      icon: <BellOutlined />,
      activeIcon: <BellOutlined style={{ color: '#1d9bf0' }} />
    },
    {
      name: "profile",
      label: "Profile",
      icon: <UserOutlined />,
      activeIcon: <UserOutlined style={{ color: '#1d9bf0' }} />
    },
    {
      name: "logout",
      label: "Logout",
      icon: <LogoutOutlined />
    },
  ];

  // No sidebar toggle needed - using bottom navigation only

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

  // Check if the current path matches a link
  const isActive = (path) => {
    // Handle special cases for nested routes
    if (path === 'dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    // For other paths, check if the location pathname includes the path
    return location.pathname.includes(`/${path}`);
  };

  // No overlay click handler needed - using bottom navigation only

  // Define primary links for mobile navigation (limited to 3 + More)
  const primaryLinks = links.slice(0, 5); // First 3 links
  const moreLinks = links.slice(5); // Remaining links

  // Toggle more menu
  const toggleMoreMenu = (e) => {
    e.stopPropagation();
    setMoreMenuOpen(!moreMenuOpen);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar for desktop only */}
      {!isMobile && (
        <Sidebar
          links={links}
          onLogout={handleLogout}
        />
      )}

      {/* Main content area */}
      <div className="main-content">
        <Outlet />
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <nav className="mobile-nav">
          <ul className="mobile-nav-list">
            {/* Primary navigation items */}
            {primaryLinks.map((link) => (
              <Link
                key={link.name}
                to={`/${link.name}`}
                className={`mobile-nav-item ${isActive(link.name) ? 'active' : ''}`}
              >
                <span className="mobile-nav-icon">
                  {isActive(link.name) && link.activeIcon ? link.activeIcon : link.icon}
                </span>
                <span className="mobile-nav-label">{link.label}</span>
              </Link>
            ))}

            {/* More menu button */}
            <button
              className={`mobile-nav-item ${moreMenuOpen ? 'active' : ''}`}
              onClick={toggleMoreMenu}
              ref={moreMenuRef}
            >
              <span className="mobile-nav-icon">
                <MoreOutlined />
              </span>
              <span className="mobile-nav-label">More</span>
            </button>
          </ul>
        </nav>
      )}

      {/* More menu dropdown */}
      {moreMenuOpen && (
        <>
          <div
            className={`more-menu-overlay ${moreMenuOpen ? 'open' : ''}`}
            onClick={() => setMoreMenuOpen(false)}
          />
          <div className={`more-menu ${moreMenuOpen ? 'open' : ''}`} ref={moreMenuRef}>
            <ul className="more-menu-list">
              {moreLinks.map((link) => (
                <li key={link.name}>
                  {link.name === 'logout' ? (
                    <button
                      className="more-menu-item"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <span className="more-menu-icon">{link.icon}</span>
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      to={`/${link.name}`}
                      className="more-menu-item"
                      onClick={() => setMoreMenuOpen(false)}
                    >
                      <span className="more-menu-icon">{link.icon}</span>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
              {/* Theme Toggle in More Menu */}
              <li>
                <div className="more-menu-theme-toggle">
                  <ThemeToggle compact={false} />
                </div>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Layout;
