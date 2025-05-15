/**
 * Application constants
 */

// Default images
export const DEFAULT_COVER_PHOTO = "/assets/backgroundWall.jpg";
export const DEFAULT_PROFILE_PIC = "/assets/profilePic.jpeg";

// API and Socket URLs
export const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.120:5050/api';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://192.168.0.120:5050';
export const API_HOST = process.env.REACT_APP_API_HOST || '192.168.0.120:5050';
export const LEGACY_API_HOSTS = (process.env.REACT_APP_LEGACY_API_HOSTS || '192.168.1.7:5050,localhost:5050').split(',').map(host => host.trim());
export const MEDIA_URL = process.env.REACT_APP_MEDIA_URL || 'http://192.168.0.120:5050';
export const PLACEHOLDER_IMAGE = process.env.REACT_APP_PLACEHOLDER_IMAGE || 'https://via.placeholder.com/400x300?text=Image+Loading...';

// For backward compatibility
export const API_BASE_URL = API_URL;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;
