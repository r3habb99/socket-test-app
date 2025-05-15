/**
 * Environment variable utilities
 * This file provides a centralized way to access environment variables with fallbacks
 *
 * NOTE: This file is deprecated. Use constants/index.js instead for environment variables.
 */

import {
  API_URL,
  SOCKET_URL,
  API_HOST,
  LEGACY_API_HOSTS,
  MEDIA_URL,
  PLACEHOLDER_IMAGE
} from '../../constants';

/**
 * Get an environment variable with a fallback value
 * @param {string} name - Name of the environment variable (without REACT_APP_ prefix)
 * @param {string} [defaultValue] - Default value to use if the environment variable is not set
 * @returns {string} The environment variable value or the default value
 * @deprecated Use constants/index.js instead
 */
export const getEnv = (name, defaultValue) => {
  // Map environment variable names to constants
  const constantsMap = {
    'API_URL': API_URL,
    'SOCKET_URL': SOCKET_URL,
    'API_HOST': API_HOST,
    'LEGACY_API_HOSTS': LEGACY_API_HOSTS.join(','),
    'MEDIA_URL': MEDIA_URL,
    'PLACEHOLDER_IMAGE': PLACEHOLDER_IMAGE
  };

  // If the name is in our constants map, return the constant value
  if (constantsMap[name]) {
    return constantsMap[name];
  }

  // Otherwise, try to get it from process.env
  const envName = `REACT_APP_${name}`;
  const value = process.env[envName];

  // If the value is undefined or empty, use the default value
  if (value === undefined || value === '') {
    return defaultValue || '';
  }

  return value;
};

/**
 * Get the API URL
 * @returns {string} The API URL
 * @deprecated Use API_URL from constants/index.js instead
 */
export const getApiUrl = () => API_URL;

/**
 * Get the Socket URL
 * @returns {string} The Socket URL
 * @deprecated Use SOCKET_URL from constants/index.js instead
 */
export const getSocketUrl = () => SOCKET_URL;

/**
 * Get the API host (without protocol)
 * @returns {string} The API host
 * @deprecated Use API_HOST from constants/index.js instead
 */
export const getApiHost = () => API_HOST;

/**
 * Get the legacy API hosts as an array
 * @returns {string[]} Array of legacy API hosts
 * @deprecated Use LEGACY_API_HOSTS from constants/index.js instead
 */
export const getLegacyApiHosts = () => LEGACY_API_HOSTS;

/**
 * Get the media URL
 * @returns {string} The media URL
 * @deprecated Use MEDIA_URL from constants/index.js instead
 */
export const getMediaUrl = () => MEDIA_URL;

/**
 * Get the placeholder image URL
 * @returns {string} The placeholder image URL
 * @deprecated Use PLACEHOLDER_IMAGE from constants/index.js instead
 */
export const getPlaceholderImage = () => PLACEHOLDER_IMAGE;

/**
 * Extract hostname from a URL
 * @param {string} url - URL to extract hostname from
 * @returns {string|null} Hostname or null if the URL is invalid
 */
export const getHostname = (url) => {
  if (!url) return null;

  try {
    return new URL(url).hostname;
  } catch (error) {
    console.error('Invalid URL:', url);
    return null;
  }
};

// Log environment variables for debugging
console.log('Environment variables (from constants):');
console.log('API_URL:', API_URL);
console.log('SOCKET_URL:', SOCKET_URL);
console.log('API_HOST:', API_HOST);
console.log('LEGACY_API_HOSTS:', LEGACY_API_HOSTS);
console.log('MEDIA_URL:', MEDIA_URL);
console.log('PLACEHOLDER_IMAGE:', PLACEHOLDER_IMAGE);
