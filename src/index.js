import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import "./output.css";
// Ant Design 5.x no longer requires explicit CSS import
// Import our custom responsive styles for Ant Design components
import "./shared/components/AntdResponsive.css";
// Import theme styles
// import "./features/preferences/styles/theme.css";
import App from "./App";
import store from "./core/store";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
