import { toast, Bounce } from "react-toastify";

// Default toast configuration
const defaultOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  transition: Bounce,
};

/**
 * Custom toast utility functions with consistent styling
 */
export const customToast = {
  /**
   * Display an info toast message
   * @param {string} message - The message to display
   * @param {Object} options - Optional toast configuration to override defaults
   */
  info: (message, options = {}) => {
    toast.info(message, { ...defaultOptions, ...options });
  },

  /**
   * Display a success toast message
   * @param {string} message - The message to display
   * @param {Object} options - Optional toast configuration to override defaults
   */
  success: (message, options = {}) => {
    toast.success(message, { ...defaultOptions, ...options });
  },

  /**
   * Display a warning toast message
   * @param {string} message - The message to display
   * @param {Object} options - Optional toast configuration to override defaults
   */
  warn: (message, options = {}) => {
    toast.warn(message, { ...defaultOptions, ...options });
  },

  /**
   * Display an error toast message
   * @param {string} message - The message to display
   * @param {Object} options - Optional toast configuration to override defaults
   */
  error: (message, options = {}) => {
    toast.error(message, { ...defaultOptions, ...options });
  },
};

// For backward compatibility, also export the original toast object
export { toast };
