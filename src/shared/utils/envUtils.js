/**
 * Environment variable utilities
 * This file provides a centralized way to access environment variables with fallbacks
 */

// Default values for environment variables
const DEFAULT_VALUES = {
  API_URL: 'http://192.168.0.120:5050/api',
  SOCKET_URL: 'http://192.168.0.120:5050',
};

/**
 * Get an environment variable with a fallback value
 * @param {string} name - Name of the environment variable (without REACT_APP_ prefix)
 * @param {string} [defaultValue] - Default value to use if the environment variable is not set
 * @returns {string} The environment variable value or the default value
 */
export const getEnv = (name, defaultValue) => {
  const envName = `REACT_APP_${name}`;
  const value = process.env[envName];

  // If the value is undefined or empty, use the default value
  if (value === undefined || value === '') {
    // Use the provided default value or the one from DEFAULT_VALUES
    return defaultValue || DEFAULT_VALUES[name] || '';
  }

  return value;
};

/**
 * Get the API URL
 * @returns {string} The API URL
 */
export const getApiUrl = () => getEnv('API_URL');

/**
 * Get the Socket URL
 * @returns {string} The Socket URL
 */
export const getSocketUrl = () => getEnv('SOCKET_URL');

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
console.log('Environment variables:');
console.log('API_URL:', getApiUrl());
console.log('SOCKET_URL:', getSocketUrl());
