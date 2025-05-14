/**
 * Utility functions for handling images
 */
import { getApiUrl } from './envUtils';

// Get the API base URL from environment
const API_BASE_URL = getApiUrl();

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
    // Fix the URL if it contains spaces (replace spaces with %20)
    return imagePath.replace(/ /g, '%20');
  }

  // Special case for URLs that include the server hostname but might be missing the protocol
  // For example: 192.168.1.7:5050/uploads/profile-pictures/image.jpg
  if (imagePath.includes('192.168.1.7:5050') ||
      imagePath.includes('localhost:5050')) {
    // Add http:// protocol if missing
    const fullUrl = imagePath.startsWith('//')
      ? `http:${imagePath}`
      : `http://${imagePath}`;
    console.log('Fixed URL with protocol:', fullUrl);
    return fullUrl.replace(/ /g, '%20');
  }

  // If the image path starts with a slash, append it to the API base URL
  if (imagePath.startsWith("/")) {
    // Special handling for profile pictures and other uploads
    if (imagePath.startsWith("/uploads/")) {
      // Remove /api suffix from API_BASE_URL if it exists
      const baseUrl = API_BASE_URL.endsWith('/api')
        ? API_BASE_URL.substring(0, API_BASE_URL.length - 4)
        : API_BASE_URL;

      // Don't add /api prefix to /uploads/ paths
      const fullUrl = `${baseUrl}${imagePath}`.replace(/ /g, '%20');
      console.log('Generated image URL:', fullUrl);
      return fullUrl;
    }

    // For other paths, use the API_BASE_URL as is
    return `${API_BASE_URL}${imagePath}`.replace(/ /g, '%20');
  }

  // Otherwise, append the image path to the API base URL with a slash
  return `${API_BASE_URL}/${imagePath}`.replace(/ /g, '%20');
};

/**
 * Checks if a URL is an external URL (not from our domain)
 * @param {string} url - URL to check
 * @returns {boolean} True if the URL is external
 */
export const isExternalUrl = (url) => {
  if (!url) return false;

  // If it's a relative URL, it's not external
  if (url.startsWith('/')) return false;

  // If it doesn't have a protocol, it's not external
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

  // Check if the URL is from our domain
  const currentDomain = window.location.hostname;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname !== currentDomain;
  } catch (e) {
    return false;
  }
};
