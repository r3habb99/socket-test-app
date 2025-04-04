import React from "react";
import { useNavigate } from "react-router-dom";
import "../../css/sidebar.css";

const Sidebar = ({ authenticated, onLogout, links = [], sidebarOpen }) => {
  const navigate = useNavigate();

  const handleNavigation = (name) => {
    if (name === "logout") {
      onLogout(); // Call logout function
      navigate("/login");
    } else {
      navigate(`/${name}`);
    }
  };

  return (
    <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <h3>Dashboard</h3>
      <ul>
        {links.map((link, index) => (
          <li key={index} onClick={() => handleNavigation(link.name)}>
            {link.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
