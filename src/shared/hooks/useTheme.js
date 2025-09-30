import { useThemeContext } from '../../core/providers/ThemeProvider';

/**
 * Custom hook to access theme functionality
 * Re-exports the theme context for easier imports
 * @returns {Object} Theme context with theme state and methods
 */
export const useTheme = () => {
  return useThemeContext();
};

