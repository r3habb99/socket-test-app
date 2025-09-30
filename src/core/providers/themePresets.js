/**
 * Theme Presets Configuration
 * Each preset includes colors, gradients, and styling options
 */

export const THEME_PRESETS = {
  default: {
    name: "Default",
    light: {
      primary: "#1d9bf0",
      primaryHover: "#1a8cd8",
      primaryLight: "rgba(29, 155, 240, 0.1)",
      gradient: "linear-gradient(135deg, #1d9bf0 0%, #0c7abf 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(29, 155, 240, 0.1) 0%, rgba(12, 122, 191, 0.05) 100%)",
      bgPrimary: "#ffffff",
      bgSurface: "#f9fafb",
      bgHover: "rgba(29, 155, 240, 0.1)",
      textPrimary: "#0f1419",
      textSecondary: "#536471",
      borderColor: "#eff3f4",
      shadowColor: "rgba(0, 0, 0, 0.08)",
    },
    dark: {
      primary: "#60a5fa",
      primaryHover: "#93c5fd",
      primaryLight: "rgba(96, 165, 250, 0.1)",
      gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)",
      bgPrimary: "#1a1a1a",
      bgSurface: "#262626",
      bgHover: "rgba(96, 165, 250, 0.1)",
      textPrimary: "#e7e9ea",
      textSecondary: "#8b98a5",
      borderColor: "#2f3336",
      shadowColor: "rgba(0, 0, 0, 0.3)",
    }
  },
  ocean: {
    name: "Ocean",
    light: {
      primary: "#0ea5e9",
      primaryHover: "#0284c7",
      primaryLight: "rgba(14, 165, 233, 0.1)",
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)",
      bgPrimary: "#f0f9ff",
      bgSurface: "#e0f2fe",
      bgHover: "rgba(14, 165, 233, 0.1)",
      textPrimary: "#0c4a6e",
      textSecondary: "#075985",
      borderColor: "#bae6fd",
      shadowColor: "rgba(14, 165, 233, 0.15)",
    },
    dark: {
      primary: "#22d3ee",
      primaryHover: "#67e8f9",
      primaryLight: "rgba(34, 211, 238, 0.1)",
      gradient: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)",
      bgPrimary: "#0c1821",
      bgSurface: "#164e63",
      bgHover: "rgba(34, 211, 238, 0.1)",
      textPrimary: "#e0f2fe",
      textSecondary: "#a5f3fc",
      borderColor: "#155e75",
      shadowColor: "rgba(34, 211, 238, 0.2)",
    }
  },
  sunset: {
    name: "Sunset",
    light: {
      primary: "#f97316",
      primaryHover: "#ea580c",
      primaryLight: "rgba(249, 115, 22, 0.1)",
      gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%)",
      bgPrimary: "#fff7ed",
      bgSurface: "#ffedd5",
      bgHover: "rgba(249, 115, 22, 0.1)",
      textPrimary: "#7c2d12",
      textSecondary: "#9a3412",
      borderColor: "#fed7aa",
      shadowColor: "rgba(249, 115, 22, 0.15)",
    },
    dark: {
      primary: "#fb923c",
      primaryHover: "#fdba74",
      primaryLight: "rgba(251, 146, 60, 0.1)",
      gradient: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)",
      bgPrimary: "#1a0f0a",
      bgSurface: "#431407",
      bgHover: "rgba(251, 146, 60, 0.1)",
      textPrimary: "#ffedd5",
      textSecondary: "#fed7aa",
      borderColor: "#7c2d12",
      shadowColor: "rgba(251, 146, 60, 0.2)",
    }
  },
  forest: {
    name: "Forest",
    light: {
      primary: "#10b981",
      primaryHover: "#059669",
      primaryLight: "rgba(16, 185, 129, 0.1)",
      gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.05) 100%)",
      bgPrimary: "#f0fdf4",
      bgSurface: "#dcfce7",
      bgHover: "rgba(16, 185, 129, 0.1)",
      textPrimary: "#064e3b",
      textSecondary: "#065f46",
      borderColor: "#bbf7d0",
      shadowColor: "rgba(16, 185, 129, 0.15)",
    },
    dark: {
      primary: "#34d399",
      primaryHover: "#6ee7b7",
      primaryLight: "rgba(52, 211, 153, 0.1)",
      gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
      bgPrimary: "#0a1f1a",
      bgSurface: "#064e3b",
      bgHover: "rgba(52, 211, 153, 0.1)",
      textPrimary: "#d1fae5",
      textSecondary: "#a7f3d0",
      borderColor: "#065f46",
      shadowColor: "rgba(52, 211, 153, 0.2)",
    }
  },
  midnight: {
    name: "Midnight",
    light: {
      primary: "#8b5cf6",
      primaryHover: "#7c3aed",
      primaryLight: "rgba(139, 92, 246, 0.1)",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%)",
      bgPrimary: "#faf5ff",
      bgSurface: "#f3e8ff",
      bgHover: "rgba(139, 92, 246, 0.1)",
      textPrimary: "#4c1d95",
      textSecondary: "#5b21b6",
      borderColor: "#e9d5ff",
      shadowColor: "rgba(139, 92, 246, 0.15)",
    },
    dark: {
      primary: "#a78bfa",
      primaryHover: "#c4b5fd",
      primaryLight: "rgba(167, 139, 250, 0.1)",
      gradient: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)",
      bgPrimary: "#1a0f2e",
      bgSurface: "#4c1d95",
      bgHover: "rgba(167, 139, 250, 0.1)",
      textPrimary: "#f3e8ff",
      textSecondary: "#e9d5ff",
      borderColor: "#5b21b6",
      shadowColor: "rgba(167, 139, 250, 0.2)",
    }
  },
  rose: {
    name: "Rose",
    light: {
      primary: "#f43f5e",
      primaryHover: "#e11d48",
      primaryLight: "rgba(244, 63, 94, 0.1)",
      gradient: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(251, 113, 133, 0.05) 100%)",
      bgPrimary: "#fff1f2",
      bgSurface: "#ffe4e6",
      bgHover: "rgba(244, 63, 94, 0.1)",
      textPrimary: "#881337",
      textSecondary: "#9f1239",
      borderColor: "#fecdd3",
      shadowColor: "rgba(244, 63, 94, 0.15)",
    },
    dark: {
      primary: "#fb7185",
      primaryHover: "#fda4af",
      primaryLight: "rgba(251, 113, 133, 0.1)",
      gradient: "linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)",
      gradientSubtle: "linear-gradient(135deg, rgba(251, 113, 133, 0.1) 0%, rgba(244, 63, 94, 0.05) 100%)",
      bgPrimary: "#1f0a0f",
      bgSurface: "#4c0519",
      bgHover: "rgba(251, 113, 133, 0.1)",
      textPrimary: "#ffe4e6",
      textSecondary: "#fecdd3",
      borderColor: "#881337",
      shadowColor: "rgba(251, 113, 133, 0.2)",
    }
  }
};

/**
 * Apply theme preset to CSS variables
 * @param {string} presetName - Name of the preset
 * @param {string} mode - 'light' or 'dark'
 */
export const applyThemePreset = (presetName, mode) => {
  const preset = THEME_PRESETS[presetName];
  if (!preset) {
    console.error(`Theme preset "${presetName}" not found`);
    return;
  }

  const colors = preset[mode];
  const root = document.documentElement;

  // Apply CSS variables
  root.style.setProperty('--primary-color', colors.primary);
  root.style.setProperty('--primary-color-hover', colors.primaryHover);
  root.style.setProperty('--primary-color-light', colors.primaryLight);
  root.style.setProperty('--gradient-primary', colors.gradient);
  root.style.setProperty('--gradient-subtle', colors.gradientSubtle);
  root.style.setProperty('--bg-primary', colors.bgPrimary);
  root.style.setProperty('--bg-surface', colors.bgSurface);
  root.style.setProperty('--hover-bg', colors.bgHover);
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--border-color', colors.borderColor);
  root.style.setProperty('--shadow-color', colors.shadowColor);
};

/**
 * Get all available theme preset names
 * @returns {Array} Array of preset names
 */
export const getThemePresetNames = () => {
  return Object.keys(THEME_PRESETS);
};

/**
 * Get theme preset by name
 * @param {string} presetName - Name of the preset
 * @returns {Object} Theme preset object
 */
export const getThemePreset = (presetName) => {
  return THEME_PRESETS[presetName] || THEME_PRESETS.default;
};

