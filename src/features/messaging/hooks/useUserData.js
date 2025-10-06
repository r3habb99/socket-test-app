/**
 * Custom hook for fetching and caching user data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserById } from '../../auth/api/authApi';
import { DEFAULT_PROFILE_PIC } from '../../../constants';
import { getImageUrl } from '../../../shared/utils/imageUtils';

/**
 * Custom hook to fetch and cache user data
 * @param {string} userId - User ID to fetch data for
 * @returns {Object} User data state and methods
 */
export const useUserData = (userId) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());

  // Get user display name
  const getUserDisplayName = useCallback((user) => {
    if (!user) return 'Unknown User';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    return user.username || user.email || 'Unknown User';
  }, []);

  // Get user profile picture URL
  const getUserProfilePic = useCallback((user) => {
    if (!user || !user.profilePic) {
      return DEFAULT_PROFILE_PIC;
    }

    try {
      return getImageUrl(user.profilePic, DEFAULT_PROFILE_PIC);
    } catch (error) {
      console.warn('Error processing profile picture URL:', error);
      return DEFAULT_PROFILE_PIC;
    }
  }, []);

  // Get user initials for avatar fallback
  const getUserInitials = useCallback((user) => {
    if (!user) return '?';

    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }

    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return '?';
  }, []);

  // Fetch user data
  const fetchUserData = useCallback(async (targetUserId) => {
    if (!targetUserId) {
      setUserData(null);
      return;
    }

    // Check cache first
    if (cacheRef.current.has(targetUserId)) {
      const cachedData = cacheRef.current.get(targetUserId);
      setUserData(cachedData);
      return cachedData;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getUserById(targetUserId);
      
      if (response.error) {
        throw new Error(response.message || 'Failed to fetch user data');
      }

      const user = response.data;
      
      // Create enhanced user object with helper methods
      const enhancedUser = {
        ...user,
        displayName: getUserDisplayName(user),
        profilePicUrl: getUserProfilePic(user),
        initials: getUserInitials(user)
      };

      // Cache the data
      cacheRef.current.set(targetUserId, enhancedUser);
      setUserData(enhancedUser);
      
      return enhancedUser;
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to fetch user data');
      
      // Create fallback user object
      const fallbackUser = {
        _id: targetUserId,
        id: targetUserId,
        displayName: 'Unknown User',
        profilePicUrl: DEFAULT_PROFILE_PIC,
        initials: '?',
        username: targetUserId
      };
      
      setUserData(fallbackUser);
      return fallbackUser;
    } finally {
      setLoading(false);
    }
  }, [getUserDisplayName, getUserProfilePic, getUserInitials]);

  // Effect to fetch data when userId changes
  useEffect(() => {
    fetchUserData(userId);
  }, [userId, fetchUserData]);

  // Clear cache method
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Refresh user data
  const refreshUserData = useCallback(() => {
    if (userId) {
      // Remove from cache and refetch
      cacheRef.current.delete(userId);
      fetchUserData(userId);
    }
  }, [userId, fetchUserData]);

  return {
    userData,
    loading,
    error,
    fetchUserData,
    clearCache,
    refreshUserData,
    // Helper methods for easy access
    displayName: userData?.displayName || 'Unknown User',
    profilePicUrl: userData?.profilePicUrl || DEFAULT_PROFILE_PIC,
    initials: userData?.initials || '?',
    username: userData?.username || 'unknown'
  };
};

/**
 * Hook for managing multiple users data
 * @param {string[]} userIds - Array of user IDs
 * @returns {Object} Multiple users data state and methods
 */
export const useMultipleUsersData = (userIds = []) => {
  const [usersData, setUsersData] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(new Map());

  const fetchMultipleUsers = useCallback(async (targetUserIds) => {
    if (!targetUserIds || targetUserIds.length === 0) {
      setUsersData(new Map());
      return;
    }

    setLoading(true);
    const newUsersData = new Map();
    const newErrors = new Map();

    await Promise.all(
      targetUserIds.map(async (userId) => {
        try {
          const response = await getUserById(userId);
          
          if (response.error) {
            throw new Error(response.message || 'Failed to fetch user data');
          }

          const user = response.data;
          const enhancedUser = {
            ...user,
            displayName: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.username || user.email || 'Unknown User',
            profilePicUrl: user.profilePic 
              ? getImageUrl(user.profilePic, DEFAULT_PROFILE_PIC) 
              : DEFAULT_PROFILE_PIC,
            initials: user.firstName && user.lastName
              ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
              : (user.username ? user.username.substring(0, 2).toUpperCase() : '?')
          };

          newUsersData.set(userId, enhancedUser);
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          newErrors.set(userId, error.message);
          
          // Add fallback user
          newUsersData.set(userId, {
            _id: userId,
            id: userId,
            displayName: 'Unknown User',
            profilePicUrl: DEFAULT_PROFILE_PIC,
            initials: '?',
            username: userId
          });
        }
      })
    );

    setUsersData(newUsersData);
    setErrors(newErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMultipleUsers(userIds);
  }, [userIds, fetchMultipleUsers]);

  return {
    usersData,
    loading,
    errors,
    fetchMultipleUsers,
    getUserData: (userId) => usersData.get(userId),
    hasUserData: (userId) => usersData.has(userId)
  };
};
