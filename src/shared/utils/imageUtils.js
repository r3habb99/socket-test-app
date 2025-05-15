/**
 * Utility functions for handling images
 */
import {
  API_URL,
  API_HOST,
  LEGACY_API_HOSTS,
} from '../../constants';

// For backward compatibility
const API_BASE_URL = API_URL;

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
  const currentApiHost = API_HOST;
  const legacyHosts = LEGACY_API_HOSTS;

  // Check if the image path includes any known API host
  const hasCurrentHost = imagePath.includes(currentApiHost);
  const legacyHostFound = legacyHosts.find(host => imagePath.includes(host));

  if (hasCurrentHost || legacyHostFound) {
    console.log('Detected server hostname in image path:', imagePath);

    // Get the current API host from the API URL
    const apiUrlObj = new URL(API_BASE_URL);
    const currentHostPort = apiUrlObj.host; // e.g. 192.168.0.120:5050
    console.log('Current API host:port is:', currentHostPort);

    // Replace any of the known IPs with the current API host
    let fixedPath = imagePath;

    if (legacyHostFound) {
      console.log(`Replacing ${legacyHostFound} with ${currentHostPort}`);
      // Create a regex to replace the legacy host with the current host
      const legacyHostRegex = new RegExp(legacyHostFound.replace(/\./g, '\\.'), 'g');
      fixedPath = imagePath.replace(legacyHostRegex, currentHostPort);
    }

    console.log('Path after IP replacement:', fixedPath);

    // Add http:// protocol if missing
    const fullUrl = fixedPath.startsWith('//')
      ? `http:${fixedPath}`
      : (fixedPath.startsWith('http://') || fixedPath.startsWith('https://'))
        ? fixedPath
        : `http://${fixedPath}`;

    console.log('Final fixed URL with protocol:', fullUrl);
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
