import React from 'react';
import { useAuthContext } from '../../../../core/providers/AuthProvider';
import './Logout.css';

const Logout = () => {
  const { logout } = useAuthContext();

  const handleLogout = () => {
    logout();
  };

  return <button className="logout-button" onClick={handleLogout}>Logout</button>;
};

export default Logout;
