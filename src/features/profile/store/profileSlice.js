/**
 * Profile Slice
 * Manages profile state including user profiles, followers, and following
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchUserProfileById,
  updateUserProfile,
  uploadProfilePic,
  uploadCoverPhoto,
  getUserFollowers,
  getUserFollowing,
  followUser,
} from '../api/profileApi';
import { setLoading, setError, clearError } from '../../ui/store/uiSlice';
import { updateUserProfile as updateAuthUserProfile } from '../../auth/store/authSlice';

// Initial state
const initialState = {
  currentProfile: null,
  followers: [],
  following: [],
  followerCount: 0,
  followingCount: 0,
  hasMoreFollowers: true,
  hasMoreFollowing: true,
  followersPage: 1,
  followingPage: 1,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'profile', isLoading: true }));
      dispatch(clearError({ feature: 'profile' }));

      const response = await fetchUserProfileById(userId);

      if (response.error) {
        dispatch(setError({ feature: 'profile', error: response.message }));
        return rejectWithValue(response.message);
      }

      // Extract profile data from response
      const profileData = response.data?.data || response.data;

      if (!profileData) {
        const errorMsg = "Profile not found";
        dispatch(setError({ feature: 'profile', error: errorMsg }));
        return rejectWithValue(errorMsg);
      }

      // Get the logged-in user ID
      const loggedInUserId = localStorage.getItem("userId");

      // Ensure the profile has normalized ID fields
      const normalizedProfile = {
        ...profileData,
        id: profileData.id || profileData._id,
        _id: profileData._id || profileData.id,
      };

      // Determine if the logged-in user is following this profile
      // First check if isFollowing is already set in the API response
      if (normalizedProfile.isFollowing === undefined) {
        // If not set, check if the logged-in user is in the followers array
        const followersArray = normalizedProfile.followers || [];
        normalizedProfile.isFollowing = Array.isArray(followersArray) &&
          followersArray.some(followerId =>
            String(followerId) === String(loggedInUserId) ||
            (typeof followerId === 'object' &&
             (String(followerId.id) === String(loggedInUserId) ||
              String(followerId._id) === String(loggedInUserId)))
          );
      }

      return { profile: normalizedProfile };
    } catch (err) {
      const message = err.message || "Failed to fetch user profile";
      dispatch(setError({ feature: 'profile', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'profile', isLoading: false }));
    }
  }
);

export const updateUserProfileData = createAsyncThunk(
  'profile/updateUserProfileData',
  async (profileData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'profile', isLoading: true }));
      dispatch(clearError({ feature: 'profile' }));

      const response = await updateUserProfile(profileData);

      if (response.error) {
        dispatch(setError({ feature: 'profile', error: response.message }));
        return rejectWithValue(response.message);
      }

      // Extract updated profile data from response
      const updatedProfile = response.data?.data || response.data;

      // Update auth user profile if it's the current user
      const currentUserId = localStorage.getItem('userId');
      if (updatedProfile.id === currentUserId || updatedProfile._id === currentUserId) {
        dispatch(updateAuthUserProfile({
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          username: updatedProfile.username,
          email: updatedProfile.email,
          bio: updatedProfile.bio,
        }));
      }

      return { profile: updatedProfile };
    } catch (err) {
      const message = err.message || "Failed to update profile";
      dispatch(setError({ feature: 'profile', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'profile', isLoading: false }));
    }
  }
);

export const uploadProfilePicture = createAsyncThunk(
  'profile/uploadProfilePicture',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'profile', isLoading: true }));
      dispatch(clearError({ feature: 'profile' }));

      const response = await uploadProfilePic(formData);

      if (response.error) {
        dispatch(setError({ feature: 'profile', error: response.message }));
        return rejectWithValue(response.message);
      }

      // Extract profile pic URL from response
      const profilePicUrl = response.data?.data?.profilePic || response.data?.profilePic;

      if (!profilePicUrl) {
        const errorMsg = "Failed to get profile picture URL";
        dispatch(setError({ feature: 'profile', error: errorMsg }));
        return rejectWithValue(errorMsg);
      }

      // Update auth user profile pic
      dispatch(updateAuthUserProfile({ profilePic: profilePicUrl }));

      return { profilePic: profilePicUrl };
    } catch (err) {
      const message = err.message || "Failed to upload profile picture";
      dispatch(setError({ feature: 'profile', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'profile', isLoading: false }));
    }
  }
);

export const uploadCoverPhotoImage = createAsyncThunk(
  'profile/uploadCoverPhotoImage',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'profile', isLoading: true }));
      dispatch(clearError({ feature: 'profile' }));

      const response = await uploadCoverPhoto(formData);

      if (response.error) {
        dispatch(setError({ feature: 'profile', error: response.message }));
        return rejectWithValue(response.message);
      }

      // Extract cover photo URL from response
      const coverPhotoUrl = response.data?.data?.coverPhoto || response.data?.coverPhoto;

      if (!coverPhotoUrl) {
        const errorMsg = "Failed to get cover photo URL";
        dispatch(setError({ feature: 'profile', error: errorMsg }));
        return rejectWithValue(errorMsg);
      }

      return { coverPhoto: coverPhotoUrl };
    } catch (err) {
      const message = err.message || "Failed to upload cover photo";
      dispatch(setError({ feature: 'profile', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'profile', isLoading: false }));
    }
  }
);

export const fetchFollowers = createAsyncThunk(
  'profile/fetchFollowers',
  async ({ userId, page = 1, limit = 10 }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'profile', isLoading: true }));
      dispatch(clearError({ feature: 'profile' }));

      const response = await getUserFollowers(userId, page, limit);

      if (response.error) {
        dispatch(setError({ feature: 'profile', error: response.message }));
        return rejectWithValue(response.message);
      }

      // Extract followers from response
      const followersData = response.data?.data || response.data || [];
      const followerCount = response.data?.count || followersData.length;

      return {
        followers: followersData,
        followerCount,
        page,
        hasMore: followersData.length === limit,
      };
    } catch (err) {
      const message = err.message || "Failed to fetch followers";
      dispatch(setError({ feature: 'profile', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'profile', isLoading: false }));
    }
  }
);

export const fetchFollowing = createAsyncThunk(
  'profile/fetchFollowing',
  async ({ userId, page = 1, limit = 10 }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'profile', isLoading: true }));
      dispatch(clearError({ feature: 'profile' }));

      const response = await getUserFollowing(userId, page, limit);

      if (response.error) {
        dispatch(setError({ feature: 'profile', error: response.message }));
        return rejectWithValue(response.message);
      }

      // Extract following from response
      const followingData = response.data?.data || response.data || [];
      const followingCount = response.data?.count || followingData.length;

      return {
        following: followingData,
        followingCount,
        page,
        hasMore: followingData.length === limit,
      };
    } catch (err) {
      const message = err.message || "Failed to fetch following";
      dispatch(setError({ feature: 'profile', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'profile', isLoading: false }));
    }
  }
);

export const followUserProfile = createAsyncThunk(
  'profile/followUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await followUser(userId);

      if (response.error) {
        return rejectWithValue(response.message);
      }

      // Get the current logged-in user ID
      const loggedInUserId = localStorage.getItem("userId");

      return {
        userId,
        followed: true,
        loggedInUserId
      };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to follow user");
    }
  }
);

export const unfollowUserProfile = createAsyncThunk(
  'profile/unfollowUser',
  async (userId, { rejectWithValue }) => {
    try {
      // Use the same followUser API for unfollowing as it toggles follow status
      const response = await followUser(userId);

      if (response.error) {
        return rejectWithValue(response.message);
      }

      // Get the current logged-in user ID
      const loggedInUserId = localStorage.getItem("userId");

      return {
        userId,
        followed: false,
        loggedInUserId
      };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to unfollow user");
    }
  }
);

// Create the slice
const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Reset profile state
    resetProfile: (state) => {
      state.currentProfile = null;
    },

    // Reset followers state
    resetFollowers: (state) => {
      state.followers = [];
      state.followerCount = 0;
      state.followersPage = 1;
      state.hasMoreFollowers = true;
    },

    // Reset following state
    resetFollowing: (state) => {
      state.following = [];
      state.followingCount = 0;
      state.followingPage = 1;
      state.hasMoreFollowing = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile cases
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.currentProfile = action.payload.profile;

        // Update follower and following counts
        if (action.payload.profile.followers !== undefined) {
          state.followerCount = action.payload.profile.followers;
        }

        if (action.payload.profile.following !== undefined) {
          state.followingCount = action.payload.profile.following;
        }
      })

      // Update user profile cases
      .addCase(updateUserProfileData.fulfilled, (state, action) => {
        state.currentProfile = {
          ...state.currentProfile,
          ...action.payload.profile,
        };
      })

      // Upload profile picture cases
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        if (state.currentProfile) {
          state.currentProfile.profilePic = action.payload.profilePic;
        }
      })

      // Upload cover photo cases
      .addCase(uploadCoverPhotoImage.fulfilled, (state, action) => {
        if (state.currentProfile) {
          state.currentProfile.coverPhoto = action.payload.coverPhoto;
        }
      })

      // Fetch followers cases
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        const { followers, followerCount, page, hasMore } = action.payload;

        if (page === 1) {
          state.followers = followers;
        } else {
          // Append new followers, avoiding duplicates
          const existingFollowerIds = new Set(
            state.followers.map(follower => follower.id || follower._id)
          );

          const newFollowers = followers.filter(follower =>
            !existingFollowerIds.has(follower.id) &&
            !existingFollowerIds.has(follower._id)
          );

          state.followers = [...state.followers, ...newFollowers];
        }

        state.followerCount = followerCount;
        state.followersPage = page;
        state.hasMoreFollowers = hasMore;
      })

      // Fetch following cases
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        const { following, followingCount, page, hasMore } = action.payload;

        if (page === 1) {
          state.following = following;
        } else {
          // Append new following, avoiding duplicates
          const existingFollowingIds = new Set(
            state.following.map(follow => follow.id || follow._id)
          );

          const newFollowing = following.filter(follow =>
            !existingFollowingIds.has(follow.id) &&
            !existingFollowingIds.has(follow._id)
          );

          state.following = [...state.following, ...newFollowing];
        }

        state.followingCount = followingCount;
        state.followingPage = page;
        state.hasMoreFollowing = hasMore;
      })

      // Follow user cases
      .addCase(followUserProfile.fulfilled, (state, action) => {
        const { userId, loggedInUserId } = action.payload;

        // Update current profile if it matches the target user
        if (state.currentProfile &&
            (state.currentProfile.id === userId ||
             state.currentProfile._id === userId)) {
          state.followerCount += 1;
          state.currentProfile.isFollowing = true;

          // Add the logged-in user to the followers array if not already there
          if (state.currentProfile.followers) {
            if (!state.currentProfile.followers.includes(loggedInUserId)) {
              state.currentProfile.followers.push(loggedInUserId);
            }
          } else {
            state.currentProfile.followers = [loggedInUserId];
          }
        }

        // Update followers list if it contains the target user
        state.followers = state.followers.map(follower => {
          if (follower.id === userId || follower._id === userId) {
            return {
              ...follower,
              isFollowing: true,
              followers: follower.followers ?
                (follower.followers.includes(loggedInUserId) ?
                  follower.followers :
                  [...follower.followers, loggedInUserId]) :
                [loggedInUserId]
            };
          }
          return follower;
        });

        // Update following list if it contains the target user
        state.following = state.following.map(user => {
          if (user.id === userId || user._id === userId) {
            return {
              ...user,
              isFollowing: true,
              followers: user.followers ?
                (user.followers.includes(loggedInUserId) ?
                  user.followers :
                  [...user.followers, loggedInUserId]) :
                [loggedInUserId]
            };
          }
          return user;
        });
      })

      // Unfollow user cases
      .addCase(unfollowUserProfile.fulfilled, (state, action) => {
        const { userId, loggedInUserId } = action.payload;

        // Update current profile if it matches the target user
        if (state.currentProfile &&
            (state.currentProfile.id === userId ||
             state.currentProfile._id === userId)) {
          state.followerCount = Math.max(0, state.followerCount - 1);
          state.currentProfile.isFollowing = false;

          // Remove the logged-in user from the followers array
          if (state.currentProfile.followers) {
            state.currentProfile.followers = state.currentProfile.followers.filter(
              id => String(id) !== String(loggedInUserId)
            );
          }
        }

        // Update followers list if it contains the target user
        state.followers = state.followers.map(follower => {
          if (follower.id === userId || follower._id === userId) {
            return {
              ...follower,
              isFollowing: false,
              followers: follower.followers ?
                follower.followers.filter(id => String(id) !== String(loggedInUserId)) :
                []
            };
          }
          return follower;
        });

        // Update following list if it contains the target user
        state.following = state.following.map(user => {
          if (user.id === userId || user._id === userId) {
            return {
              ...user,
              isFollowing: false,
              followers: user.followers ?
                user.followers.filter(id => String(id) !== String(loggedInUserId)) :
                []
            };
          }
          return user;
        });
      });
  },
});

// Export actions
export const {
  resetProfile,
  resetFollowers,
  resetFollowing,
} = profileSlice.actions;

// Selectors
export const selectCurrentProfile = (state) => state.profile.currentProfile;
export const selectFollowers = (state) => state.profile.followers;
export const selectFollowing = (state) => state.profile.following;
export const selectFollowerCount = (state) => state.profile.followerCount;
export const selectFollowingCount = (state) => state.profile.followingCount;
export const selectHasMoreFollowers = (state) => state.profile.hasMoreFollowers;
export const selectHasMoreFollowing = (state) => state.profile.hasMoreFollowing;
export const selectFollowersPage = (state) => state.profile.followersPage;
export const selectFollowingPage = (state) => state.profile.followingPage;

// Export reducer
export default profileSlice.reducer;
