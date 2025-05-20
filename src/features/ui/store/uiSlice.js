/**
 * UI Slice
 * Manages global UI state like loading indicators, error messages, and modals
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Global loading state
  loading: {
    global: false,
    auth: false,
    feed: false,
    profile: false,
    messaging: false,
    notification: false,
    search: false,
  },
  // Global error state
  error: {
    global: null,
    auth: null,
    feed: null,
    profile: null,
    messaging: null,
    notification: null,
    search: null,
  },
  // Modal states
  modals: {
    imagePreview: {
      isOpen: false,
      imageUrl: null,
      title: null,
    },
    userProfile: {
      isOpen: false,
      userId: null,
    },
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Set loading state for a specific feature
    setLoading: (state, action) => {
      const { feature, isLoading } = action.payload;
      state.loading[feature] = isLoading;
    },

    // Set error state for a specific feature
    setError: (state, action) => {
      const { feature, error } = action.payload;
      state.error[feature] = error;
    },

    // Clear error state for a specific feature
    clearError: (state, action) => {
      const { feature } = action.payload;
      state.error[feature] = null;
    },

    // Open image preview modal
    openImagePreviewModal: (state, action) => {
      const { imageUrl, title } = action.payload;
      state.modals.imagePreview = {
        isOpen: true,
        imageUrl,
        title,
      };
    },

    // Close image preview modal
    closeImagePreviewModal: (state) => {
      state.modals.imagePreview = {
        isOpen: false,
        imageUrl: null,
        title: null,
      };
    },

    // Open user profile modal
    openUserProfileModal: (state, action) => {
      const { userId } = action.payload;
      state.modals.userProfile = {
        isOpen: true,
        userId,
      };
    },

    // Close user profile modal
    closeUserProfileModal: (state) => {
      state.modals.userProfile = {
        isOpen: false,
        userId: null,
      };
    },
  },
});

// Export actions
export const {
  setLoading,
  setError,
  clearError,
  openImagePreviewModal,
  closeImagePreviewModal,
  openUserProfileModal,
  closeUserProfileModal,
} = uiSlice.actions;

// Selectors
export const selectLoading = (state, feature) => state.ui.loading[feature];
export const selectError = (state, feature) => state.ui.error[feature];
export const selectImagePreviewModal = (state) => state.ui.modals.imagePreview;
export const selectUserProfileModal = (state) => state.ui.modals.userProfile;

// Export reducer
export default uiSlice.reducer;
