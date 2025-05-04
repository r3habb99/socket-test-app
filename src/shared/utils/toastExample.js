/**
 * This file provides examples of how to use the custom toast utility
 * 
 * Import the customToast utility:
 * import { customToast } from '../utils';
 * 
 * Then use it in your components:
 */

// Example usage:

// Success toast
customToast.success('Operation completed successfully!');

// Info toast
customToast.info('Here is some information for you.');

// Warning toast
customToast.warn('Please be careful with this action.');

// Error toast
customToast.error('An error occurred. Please try again.');

// With custom options
customToast.success('Custom position and duration', {
  position: "bottom-center",
  autoClose: 5000,
});

// With emoji
customToast.success('🎉 Congratulations!');
customToast.info('ℹ️ Did you know?');
customToast.warn('⚠️ Warning!');
customToast.error('❌ Error!');

/**
 * Available options:
 * 
 * position: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left"
 * autoClose: number (milliseconds) or false to disable
 * hideProgressBar: boolean
 * closeOnClick: boolean
 * pauseOnHover: boolean
 * draggable: boolean
 * progress: number (0-1)
 * theme: "light" | "dark" | "colored"
 * transition: Bounce | Slide | Zoom | Flip
 */
