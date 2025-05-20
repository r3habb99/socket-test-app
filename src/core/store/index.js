/**
 * Redux store configuration
 * This file configures the Redux store with middleware and combined reducers
 */
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';

/**
 * Configure the Redux store with middleware and combined reducers
 * @returns {Object} Configured Redux store
 */
export const setupStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types (for non-serializable values)
          ignoredActions: [
            'socket/initialize/fulfilled',
            'socket/setSocket',
            'error/addError',
          ],
          // Ignore these field paths in state (for non-serializable values)
          ignoredPaths: [
            'messaging.socket',
            'socket.socket',
            'socket.events',
            'error.errors',
            'error.errorMap',
            'error.errorHistory',
          ],
        },
      }),
    devTools: process.env.NODE_ENV !== 'production',
  });
};

// Create the store instance
const store = setupStore();

// Export the store
export default store;
