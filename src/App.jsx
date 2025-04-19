import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Login, Register } from "./components/Auth";
import { Layout, Sidebar } from "./components/Common";
import ToastController from "./components/Common/ToastController";

const isAuthenticated = () => !!localStorage.getItem("token");

const App = () => {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  useEffect(() => {
    const handleStorageChange = () => {
      setAuthenticated(isAuthenticated());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setAuthenticated(false);
  };

  return (
    <>
      <Router>
        <SidebarWrapper authenticated={authenticated} onLogout={handleLogout} />
        <Routes>
          <Route
            path="/"
            element={
              authenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              authenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login setAuthenticated={setAuthenticated} />
              )
            }
          />
          <Route
            path="/register"
            element={
              authenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register />
              )
            }
          />
          <Route
            path="/*"
            element={
              authenticated ? (
                <Layout onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
      <ToastController />
    </>
  );
};

// Sidebar should be hidden on login/register pages
const SidebarWrapper = ({ authenticated, onLogout }) => {
  const location = useLocation();
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }
  return <Sidebar authenticated={authenticated} onLogout={onLogout} />;
};

export default App;
