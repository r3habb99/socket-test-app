/**
 * Notification Slice
 * Manages notification state including fetching, marking as read, and real-time updates
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getNotifications,
  getLatestNotification,
  markNotificationAsOpened,
  markAllNotificationsAsOpened,
} from '../api/notificationApi';
import { setLoading, setError, clearError } from '../../ui/store/uiSlice';

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  hasMore: true,
  page: 1,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async ({ page = 1, limit = 10, unreadOnly = false }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'notification', isLoading: true }));
      dispatch(clearError({ feature: 'notification' }));

      const response = await getNotifications(page, limit, unreadOnly);

      if (response.error) {
        dispatch(setError({ feature: 'notification', error: response.message }));
        return rejectWithValue(response.message);
      }

      // Extract notifications from response
      const notificationsData = response.data?.data || response.data || [];
      const unreadCount = response.data?.unreadCount || 0;

      // Normalize notification objects
      const normalizedNotifications = notificationsData.map(notification => ({
        ...notification,
        id: notification.id || notification._id, // Ensure id is available
        _id: notification._id || notification.id, // Ensure _id is available
      }));

      return {
        notifications: normalizedNotifications,
        unreadCount,
        page,
        hasMore: normalizedNotifications.length === limit,
      };
    } catch (err) {
      const message = err.message || "Failed to fetch notifications";
      dispatch(setError({ feature: 'notification', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'notification', isLoading: false }));
    }
  }
);

export const fetchLatestNotifications = createAsyncThunk(
  'notification/fetchLatestNotifications',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await getLatestNotification();

      if (response.error) {
        return rejectWithValue(response.message);
      }

      // Extract notifications from response
      const notificationsData = response.data?.data || response.data || [];
      const unreadCount = response.data?.unreadCount || 0;

      // Normalize notification objects
      const normalizedNotifications = notificationsData.map(notification => ({
        ...notification,
        id: notification.id || notification._id, // Ensure id is available
        _id: notification._id || notification.id, // Ensure _id is available
      }));

      return { notifications: normalizedNotifications, unreadCount };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch latest notifications");
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId, { dispatch, rejectWithValue }) => {
    try {
      const response = await markNotificationAsOpened(notificationId);

      if (response.error) {
        return rejectWithValue(response.message);
      }

      return { notificationId };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to mark notification as read");
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await markAllNotificationsAsOpened();

      if (response.error) {
        return rejectWithValue(response.message);
      }

      return { success: true };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to mark all notifications as read");
    }
  }
);

// Create the slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Reset notifications
    resetNotifications: (state) => {
      state.notifications = [];
      state.page = 1;
      state.hasMore = true;
    },

    // Add a new notification (e.g., from socket)
    addNotification: (state, action) => {
      const notification = action.payload;

      // Normalize notification object
      const normalizedNotification = {
        ...notification,
        id: notification.id || notification._id, // Ensure id is available
        _id: notification._id || notification.id, // Ensure _id is available
      };

      // Add to beginning of list
      state.notifications.unshift(normalizedNotification);

      // Increment unread count if notification is not opened
      if (!normalizedNotification.opened) {
        state.unreadCount += 1;
      }
    },

    // Update unread count
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications cases
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { notifications, unreadCount, page, hasMore } = action.payload;

        if (page === 1) {
          state.notifications = notifications;
        } else {
          // Append new notifications, avoiding duplicates
          const existingNotificationIds = new Set(
            state.notifications.map(notification => notification.id || notification._id)
          );

          const newNotifications = notifications.filter(notification =>
            !existingNotificationIds.has(notification.id) &&
            !existingNotificationIds.has(notification._id)
          );

          state.notifications = [...state.notifications, ...newNotifications];
        }

        state.unreadCount = unreadCount;
        state.page = page;
        state.hasMore = hasMore;
      })

      // Fetch latest notifications cases
      .addCase(fetchLatestNotifications.fulfilled, (state, action) => {
        const { notifications, unreadCount } = action.payload;

        // Add new notifications to the beginning of the list, avoiding duplicates
        const existingNotificationIds = new Set(
          state.notifications.map(notification => notification.id || notification._id)
        );

        const newNotifications = notifications.filter(notification =>
          !existingNotificationIds.has(notification.id) &&
          !existingNotificationIds.has(notification._id)
        );

        state.notifications = [...newNotifications, ...state.notifications];
        state.unreadCount = unreadCount;
      })

      // Mark notification as read cases
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const { notificationId } = action.payload;

        // Find and update the notification
        const notificationIndex = state.notifications.findIndex(notification =>
          notification.id === notificationId || notification._id === notificationId
        );

        if (notificationIndex !== -1) {
          const notification = state.notifications[notificationIndex];

          // Only decrement unread count if notification was not already opened
          if (!notification.opened) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }

          // Mark as opened
          state.notifications[notificationIndex].opened = true;
        }
      })

      // Mark all notifications as read cases
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        // Mark all notifications as opened
        state.notifications.forEach(notification => {
          notification.opened = true;
        });

        // Reset unread count
        state.unreadCount = 0;
      });
  },
});

// Export actions
export const {
  resetNotifications,
  addNotification,
  setUnreadCount,
} = notificationSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notification.notifications;
export const selectUnreadCount = (state) => state.notification.unreadCount;
export const selectHasMore = (state) => state.notification.hasMore;
export const selectPage = (state) => state.notification.page;

// Export reducer
export default notificationSlice.reducer;
