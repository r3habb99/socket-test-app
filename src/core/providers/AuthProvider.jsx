import React, { createContext, useContext, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  checkAuthStatus,
  loginUser,
  registerUser,
  logoutUser,
  selectUser,
  selectIsAuthenticated
} from '../../features/auth/store/authSlice';

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider component
 * Uses Redux for state management but maintains the same context API
 * for backward compatibility with existing components
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Check authentication status on mount
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  // Create auth object with the same API as the old useAuth hook
  const auth = {
    user,
    loading: false, // Loading state is now managed by UI slice
    error: null, // Error state is now managed by UI slice

    // Login function
    login: async (credentials) => {
      const resultAction = await dispatch(loginUser(credentials));
      return resultAction.payload || { success: false, message: resultAction.error.message };
    },

    // Register function
    register: async (userData) => {
      const resultAction = await dispatch(registerUser(userData));
      return resultAction.payload || { success: false, message: resultAction.error.message };
    },

    // Logout function
    logout: async () => {
      await dispatch(logoutUser());
      return { success: true };
    },

    // Check if user is authenticated
    isAuthenticated: () => isAuthenticated,
  };

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
};
