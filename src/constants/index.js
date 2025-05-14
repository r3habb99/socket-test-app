/**
 * Application constants
 */

// Import environment utilities
import { getApiUrl, getSocketUrl } from '../shared/utils/envUtils';

// Default images
export const DEFAULT_COVER_PHOTO = "/assets/backgroundWall.jpg";
export const DEFAULT_PROFILE_PIC = "/assets/profilePic.jpeg";

// API endpoints
export const API_BASE_URL = getApiUrl();

// Socket
export const SOCKET_URL = getSocketUrl();

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;
