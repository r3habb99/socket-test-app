/**
 * Utility functions for handling images
 */

// Get the API base URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://192.168.0.120:8080";

/**
 * Get the full URL for an image path
 * @param {string} imagePath - Relative path to the image
 * @param {string} defaultImage - Default image to use if path is invalid
 * @returns {string} Full URL to the image
 */
export const getImageUrl = (imagePath, defaultImage) => {
  // If no image path is provided, return the default image
  if (!imagePath) {
    return defaultImage;
  }

  // If the image path already starts with http:// or https://, return it as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If the image path starts with a slash, append it to the API base URL
  if (imagePath.startsWith("/")) {
    return `${API_BASE_URL}${imagePath}`;
  }

  // Otherwise, append the image path to the API base URL with a slash
  return `${API_BASE_URL}/${imagePath}`;
};
