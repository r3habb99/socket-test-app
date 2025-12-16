/**
 * Application constants
 */

// Default images
export const DEFAULT_COVER_PHOTO = "/assets/backgroundWall.jpg";
export const DEFAULT_PROFILE_PIC = "/assets/profilePic.jpeg";

// API and Socket URLs - Using Vite's import.meta.env
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5050";
export const API_HOST = import.meta.env.VITE_API_HOST || "localhost:5050";
export const LEGACY_API_HOSTS = (import.meta.env.VITE_LEGACY_API_HOSTS || "localhost:5050")
  .split(",")
  .map((host) => host.trim());
export const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || "http://localhost:5050";
export const PLACEHOLDER_IMAGE =
  import.meta.env.VITE_PLACEHOLDER_IMAGE ||
  "https://via.placeholder.com/400x300?text=Image+Loading...";

// For backward compatibility
export const API_BASE_URL = API_URL;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;
