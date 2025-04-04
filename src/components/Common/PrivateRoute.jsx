// components/PrivateRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

export const PrivateRoute = ({ element, ...rest }) => {
  const isAuthenticated = localStorage.getItem("token");

  return isAuthenticated ? element : <Navigate to="/login" replace />;
};
