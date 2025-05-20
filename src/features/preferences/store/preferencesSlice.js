/**
 * Preferences Slice
 * Manages user preferences including notifications and display settings
 */
import { createSlice } from '@reduxjs/toolkit';

// Get initial font size from localStorage or default
const getInitialFontSize = () => {
  const savedFontSize = localStorage.getItem('fontSize');
  return savedFontSize || 'medium';
};

// Get initial notification settings from localStorage or defaults
const getInitialNotificationSettings = () => {
  const savedSettings = localStorage.getItem('notificationSettings');
  if (savedSettings) {
    try {
      return JSON.parse(savedSettings);
    } catch (error) {
      console.error('Failed to parse notification settings:', error);
    }
  }

  return {
    newMessages: true,
    mentions: true,
    follows: true,
    likes: true,
    comments: true,
    sound: true,
    desktop: false,
  };
};

// Get initial display settings from localStorage or defaults
const getInitialDisplaySettings = () => {
  const savedSettings = localStorage.getItem('displaySettings');
  if (savedSettings) {
    try {
      return JSON.parse(savedSettings);
    } catch (error) {
      console.error('Failed to parse display settings:', error);
    }
  }

  return {
    reducedMotion: false,
    highContrast: false,
    compactView: false,
    showReadReceipts: true,
    showTypingIndicators: true,
    showOnlineStatus: true,
  };
};

// Initial state
const initialState = {
  fontSize: getInitialFontSize(),
  notificationSettings: getInitialNotificationSettings(),
  displaySettings: getInitialDisplaySettings(),
  language: localStorage.getItem('language') || 'en',
};

// Create the slice
const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {

    // Set font size
    setFontSize: (state, action) => {
      const fontSize = action.payload;
      state.fontSize = fontSize;
      localStorage.setItem('fontSize', fontSize);

      // Apply font size to document
      document.documentElement.setAttribute('data-font-size', fontSize);
    },

    // Update notification settings
    updateNotificationSettings: (state, action) => {
      state.notificationSettings = {
        ...state.notificationSettings,
        ...action.payload,
      };

      localStorage.setItem('notificationSettings', JSON.stringify(state.notificationSettings));
    },

    // Update display settings
    updateDisplaySettings: (state, action) => {
      state.displaySettings = {
        ...state.displaySettings,
        ...action.payload,
      };

      localStorage.setItem('displaySettings', JSON.stringify(state.displaySettings));

      // Apply display settings to document
      if (state.displaySettings.reducedMotion) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }

      if (state.displaySettings.highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }

      if (state.displaySettings.compactView) {
        document.documentElement.classList.add('compact-view');
      } else {
        document.documentElement.classList.remove('compact-view');
      }
    },

    // Set language
    setLanguage: (state, action) => {
      const language = action.payload;
      state.language = language;
      localStorage.setItem('language', language);
    },

    // Reset all preferences to defaults
    resetPreferences: (state) => {

      // Reset font size
      state.fontSize = 'medium';
      localStorage.setItem('fontSize', 'medium');
      document.documentElement.setAttribute('data-font-size', 'medium');

      // Reset notification settings
      state.notificationSettings = {
        newMessages: true,
        mentions: true,
        follows: true,
        likes: true,
        comments: true,
        sound: true,
        desktop: false,
      };
      localStorage.setItem('notificationSettings', JSON.stringify(state.notificationSettings));

      // Reset display settings
      state.displaySettings = {
        reducedMotion: false,
        highContrast: false,
        compactView: false,
        showReadReceipts: true,
        showTypingIndicators: true,
        showOnlineStatus: true,
      };
      localStorage.setItem('displaySettings', JSON.stringify(state.displaySettings));

      // Remove display classes
      document.documentElement.classList.remove('reduced-motion', 'high-contrast', 'compact-view');

      // Reset language
      state.language = 'en';
      localStorage.setItem('language', 'en');
    },
  },
});

// Export actions
export const {
  setFontSize,
  updateNotificationSettings,
  updateDisplaySettings,
  setLanguage,
  resetPreferences,
} = preferencesSlice.actions;

// Selectors
export const selectFontSize = (state) => state.preferences.fontSize;
export const selectNotificationSettings = (state) => state.preferences.notificationSettings;
export const selectDisplaySettings = (state) => state.preferences.displaySettings;
export const selectLanguage = (state) => state.preferences.language;

// Export reducer
export default preferencesSlice.reducer;
