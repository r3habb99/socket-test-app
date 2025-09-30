import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const ThemeContext = createContext(null);

// Theme modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Local storage key
const THEME_STORAGE_KEY = 'app-theme-preference';

/**
 * Get system theme preference
 * @returns {string} 'light' or 'dark'
 */
const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? THEME_MODES.DARK
      : THEME_MODES.LIGHT;
  }
  return THEME_MODES.LIGHT;
};

/**
 * Get initial theme from localStorage or system preference
 * @returns {string} Theme mode
 */
const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && Object.values(THEME_MODES).includes(savedTheme)) {
      return savedTheme;
    }
  } catch (error) {
    console.error('Error reading theme from localStorage:', error);
  }
  return THEME_MODES.SYSTEM;
};

/**
 * Get the actual theme to apply (resolves 'system' to 'light' or 'dark')
 * @param {string} themeMode - The theme mode preference
 * @returns {string} 'light' or 'dark'
 */
const getResolvedTheme = (themeMode) => {
  if (themeMode === THEME_MODES.SYSTEM) {
    return getSystemTheme();
  }
  return themeMode;
};

/**
 * Theme Provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => getResolvedTheme(getInitialTheme()));

  /**
   * Update the resolved theme based on theme mode
   */
  useEffect(() => {
    const newResolvedTheme = getResolvedTheme(themeMode);
    setResolvedTheme(newResolvedTheme);

    // Apply theme to document root
    const root = document.documentElement;
    root.classList.remove(THEME_MODES.LIGHT, THEME_MODES.DARK);
    root.classList.add(newResolvedTheme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        newResolvedTheme === THEME_MODES.DARK ? '#1a1a1a' : '#ffffff'
      );
    }
  }, [themeMode]);

  /**
   * Listen for system theme changes when in system mode
   */
  useEffect(() => {
    if (themeMode !== THEME_MODES.SYSTEM) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const newSystemTheme = e.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT;
      setResolvedTheme(newSystemTheme);
      
      // Apply theme to document root
      const root = document.documentElement;
      root.classList.remove(THEME_MODES.LIGHT, THEME_MODES.DARK);
      root.classList.add(newSystemTheme);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [themeMode]);

  /**
   * Save theme preference to localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [themeMode]);

  /**
   * Set theme mode
   * @param {string} mode - Theme mode to set
   */
  const setTheme = (mode) => {
    if (!Object.values(THEME_MODES).includes(mode)) {
      console.error(`Invalid theme mode: ${mode}`);
      return;
    }
    setThemeMode(mode);
  };

  /**
   * Toggle between light and dark modes
   */
  const toggleTheme = () => {
    setThemeMode((prevMode) => {
      if (prevMode === THEME_MODES.SYSTEM) {
        // If in system mode, toggle to the opposite of current system theme
        return getSystemTheme() === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK;
      }
      return prevMode === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT;
    });
  };

  const value = {
    themeMode, // Current theme preference (light/dark/system)
    resolvedTheme, // Actual theme being applied (light/dark)
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === THEME_MODES.DARK,
    isLight: resolvedTheme === THEME_MODES.LIGHT,
    isSystem: themeMode === THEME_MODES.SYSTEM,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the theme context
 * @returns {Object} Theme context
 */
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  
  return context;
};

