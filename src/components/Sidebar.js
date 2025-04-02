import React from "react";
import "../css/sidebar.css"; // Import sidebar styles

const Sidebar = ({ links, onLinkClick, sidebarOpen }) => {
  return (
    <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <h3>Dashboard</h3>
      <ul>
        {links.map((link, index) => (
          <li key={index} onClick={() => onLinkClick(link.name)}>
            {link.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
