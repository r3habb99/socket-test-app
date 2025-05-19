import { toast, Bounce } from "react-toastify";

// Detect if we're on a mobile device
const isMobileDevice = () => window.innerWidth <= 768;

// Default toast configuration
const defaultOptions = {
  position: isMobileDevice() ? "top-center" : "top-right",
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
    // Check for mobile viewport again in case window was resized
    const currentOptions = {
      ...defaultOptions,
      position: isMobileDevice() ? "top-center" : "top-right",
      ...options
    };
    toast.info(message, currentOptions);
  },

  /**
   * Display a success toast message
   * @param {string} message - The message to display
   * @param {Object} options - Optional toast configuration to override defaults
   */
  success: (message, options = {}) => {
    // Check for mobile viewport again in case window was resized
    const currentOptions = {
      ...defaultOptions,
      position: isMobileDevice() ? "top-center" : "top-right",
      ...options
    };
    toast.success(message, currentOptions);
  },

  /**
   * Display a warning toast message
   * @param {string} message - The message to display
   * @param {Object} options - Optional toast configuration to override defaults
   */
  warn: (message, options = {}) => {
    // Check for mobile viewport again in case window was resized
    const currentOptions = {
      ...defaultOptions,
      position: isMobileDevice() ? "top-center" : "top-right",
      ...options
    };
    toast.warn(message, currentOptions);
  },

  /**
   * Display an error toast message
   * @param {string} message - The message to display
   * @param {Object} options - Optional toast configuration to override defaults
   */
  error: (message, options = {}) => {
    // Check for mobile viewport again in case window was resized
    const currentOptions = {
      ...defaultOptions,
      position: isMobileDevice() ? "top-center" : "top-right",
      ...options
    };
    toast.error(message, currentOptions);
  },
};

// For backward compatibility, also export the original toast object
export { toast };
