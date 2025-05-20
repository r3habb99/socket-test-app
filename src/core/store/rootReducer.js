/**
 * Root reducer configuration
 * Combines all feature reducers into a single root reducer
 */
import { combineReducers } from '@reduxjs/toolkit';

// Import feature reducers
import authReducer from '../../features/auth/store/authSlice';
import feedReducer from '../../features/feed/store/feedSlice';
import messagingReducer from '../../features/messaging/store/messagingSlice';
import notificationReducer from '../../features/notification/store/notificationSlice';
import profileReducer from '../../features/profile/store/profileSlice';
// Import UI reducer with absolute path to avoid path resolution issues
import uiReducer from '../../features/ui/store/uiSlice';

// Import new feature reducers
import socketReducer from '../../features/socket/store/socketSlice';
import searchReducer from '../../features/search/store/searchSlice';
import preferencesReducer from '../../features/preferences/store/preferencesSlice';
import errorReducer from '../../features/error/store/errorSlice';
import formReducer from '../../features/form/store/formSlice';
import cacheReducer from '../../features/cache/store/cacheSlice';

/**
 * Root reducer that combines all feature reducers
 */
export const rootReducer = combineReducers({
  // Core features
  auth: authReducer,
  feed: feedReducer,
  messaging: messagingReducer,
  notification: notificationReducer,
  profile: profileReducer,
  ui: uiReducer,

  // Enhanced features
  socket: socketReducer,
  search: searchReducer,
  preferences: preferencesReducer,
  error: errorReducer,
  form: formReducer,
  cache: cacheReducer,
});
