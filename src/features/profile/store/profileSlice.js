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

      return { profile: profileData };
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
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      const response = await followUser(userId);

      if (response.error) {
        return rejectWithValue(response.message);
      }

      return { userId, followed: true };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to follow user");
    }
  }
);

export const unfollowUserProfile = createAsyncThunk(
  'profile/unfollowUser',
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      // Use the same followUser API for unfollowing as it toggles follow status
      const response = await followUser(userId);

      if (response.error) {
        return rejectWithValue(response.message);
      }

      return { userId, followed: false };
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
        // Update current profile if it matches
        if (state.currentProfile &&
            (state.currentProfile.id === action.payload.userId ||
             state.currentProfile._id === action.payload.userId)) {
          state.followerCount += 1;
          state.currentProfile.isFollowing = true;
        }
      })

      // Unfollow user cases
      .addCase(unfollowUserProfile.fulfilled, (state, action) => {
        // Update current profile if it matches
        if (state.currentProfile &&
            (state.currentProfile.id === action.payload.userId ||
             state.currentProfile._id === action.payload.userId)) {
          state.followerCount = Math.max(0, state.followerCount - 1);
          state.currentProfile.isFollowing = false;
        }
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
