import React from "react";
import ReactDOM from "react-dom/client";
import "./output.css";
// Ant Design 5.x no longer requires explicit CSS import
// Import our custom responsive styles for Ant Design components
import "./shared/components/AntdResponsive.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
