import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/authApi';
import { useAuthContext } from '../../../../core/providers/AuthProvider';
import './Logout.css';

const Logout = () => {
  const { logout: contextLogout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // First call the API to logout from the server
      await logout();
      
      // Then use the context logout to clear local state
      contextLogout();
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still logout locally even if server logout fails
      contextLogout();
      navigate('/login');
    }
  };

  return <button className="logout-button" onClick={handleLogout}>Logout</button>;
};

export default Logout;
