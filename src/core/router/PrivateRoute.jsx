import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../providers/AuthProvider';

/**
 * Private Route component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};
