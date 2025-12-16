import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../../core/providers/AuthProvider';
import { useSocketContext } from '../../../../core/providers/SocketProvider';
import './Logout.css';

/**
 * Logout component - handles user logout with proper cleanup
 */
const Logout = () => {
  const { logout: contextLogout } = useAuthContext();
  const socketContext = useSocketContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Get the cleanup function from socket context
      const cleanupForLogout = socketContext?.cleanupForLogout;

      // Call context logout which will:
      // 1. Execute the cleanup callback (socket/WebRTC cleanup)
      // 2. Call the logout API to invalidate token on server
      // 3. Clear all localStorage data
      await contextLogout(cleanupForLogout);

      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Navigate to login even on error
      navigate('/login');
    }
  };

  return <button className="logout-button" onClick={handleLogout}>Logout</button>;
};

export default Logout;
