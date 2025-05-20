import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/hooks';
import {
  setFontSize,
  updateNotificationSettings,
  updateDisplaySettings,
  setLanguage,
  resetPreferences,
  selectFontSize,
  selectNotificationSettings,
  selectDisplaySettings,
  selectLanguage,
} from '../store/preferencesSlice';

/**
 * Custom hook for managing user preferences
 * @returns {Object} Preferences methods and state
 */
export const usePreferences = () => {
  const dispatch = useAppDispatch();
  const fontSize = useAppSelector(selectFontSize);
  const notificationSettings = useAppSelector(selectNotificationSettings);
  const displaySettings = useAppSelector(selectDisplaySettings);
  const language = useAppSelector(selectLanguage);

  // Apply font size on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  // Apply display settings on mount and when they change
  useEffect(() => {
    if (displaySettings.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }

    if (displaySettings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    if (displaySettings.compactView) {
      document.documentElement.classList.add('compact-view');
    } else {
      document.documentElement.classList.remove('compact-view');
    }
  }, [displaySettings]);



  /**
   * Change font size
   * @param {string} newFontSize - New font size ('small', 'medium', or 'large')
   */
  const changeFontSize = useCallback((newFontSize) => {
    dispatch(setFontSize(newFontSize));
  }, [dispatch]);

  /**
   * Update notification settings
   * @param {Object} settings - New notification settings
   */
  const updateNotifications = useCallback((settings) => {
    dispatch(updateNotificationSettings(settings));
  }, [dispatch]);

  /**
   * Toggle a notification setting
   * @param {string} setting - Setting to toggle
   */
  const toggleNotificationSetting = useCallback((setting) => {
    dispatch(updateNotificationSettings({
      [setting]: !notificationSettings[setting],
    }));
  }, [dispatch, notificationSettings]);

  /**
   * Update display settings
   * @param {Object} settings - New display settings
   */
  const updateDisplay = useCallback((settings) => {
    dispatch(updateDisplaySettings(settings));
  }, [dispatch]);

  /**
   * Toggle a display setting
   * @param {string} setting - Setting to toggle
   */
  const toggleDisplaySetting = useCallback((setting) => {
    dispatch(updateDisplaySettings({
      [setting]: !displaySettings[setting],
    }));
  }, [dispatch, displaySettings]);

  /**
   * Change language
   * @param {string} newLanguage - New language code
   */
  const changeLanguage = useCallback((newLanguage) => {
    dispatch(setLanguage(newLanguage));
  }, [dispatch]);

  /**
   * Reset all preferences to defaults
   */
  const resetAllPreferences = useCallback(() => {
    dispatch(resetPreferences());
  }, [dispatch]);

  return {
    // Preferences state
    fontSize,
    notificationSettings,
    displaySettings,
    language,

    // Preferences methods
    changeFontSize,
    updateNotificationSettings: updateNotifications,
    toggleNotificationSetting,
    updateDisplaySettings: updateDisplay,
    toggleDisplaySetting,
    changeLanguage,
    resetPreferences: resetAllPreferences,
  };
};

export default usePreferences;
