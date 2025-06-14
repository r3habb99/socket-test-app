import {
  apiClient,
  endpoints,
  handleApiError,
  handleApiResponse,
} from "../../../shared/api";

/**
 * Get all notifications for the current user
 * @param {boolean} unreadOnly - Whether to get only unread notifications
 * @returns {Promise<Object>} Response object
 */
export const getNotifications = async (unreadOnly = false) => {
  try {
    const response = await apiClient.get(endpoints.notification.getAll(unreadOnly));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get latest notification for the current user
 * @returns {Promise<Object>} Response object
 */
export const getLatestNotification = async () => {
  try {
    const response = await apiClient.get(endpoints.notification.latest);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Mark a notification as opened
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Response object
 */
export const markNotificationAsOpened = async (notificationId) => {
  try {
    const response = await apiClient.put(endpoints.notification.markAsOpened(notificationId));
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Mark all notifications as opened
 * @returns {Promise<Object>} Response object
 */
export const markAllNotificationsAsOpened = async () => {
  try {
  const response = await apiClient.put(endpoints.notification.markAllAsOpened);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};
