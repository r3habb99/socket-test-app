/**
 * Error Slice
 * Enhanced error handling for the application
 */
import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

// Initial state
const initialState = {
  errors: [],
  errorMap: {}, // Map of error IDs to error objects for quick lookup
  unhandledErrors: [], // Errors that haven't been handled yet
  errorHistory: [], // History of all errors for debugging
  maxHistorySize: 100, // Maximum number of errors to keep in history
};

// Create the slice
const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    // Add an error
    addError: (state, action) => {
      const { error, source, context, timestamp = new Date().toISOString() } = action.payload;
      
      // Create error object
      const errorObj = {
        id: uuidv4(),
        message: error.message || error,
        stack: error.stack,
        code: error.code,
        status: error.status || error.statusCode,
        source,
        context,
        timestamp,
        handled: false,
      };
      
      // Add to errors array
      state.errors.push(errorObj);
      
      // Add to error map
      state.errorMap[errorObj.id] = errorObj;
      
      // Add to unhandled errors
      state.unhandledErrors.push(errorObj.id);
      
      // Add to error history
      state.errorHistory.unshift(errorObj);
      
      // Limit error history size
      if (state.errorHistory.length > state.maxHistorySize) {
        state.errorHistory = state.errorHistory.slice(0, state.maxHistorySize);
      }
    },
    
    // Mark an error as handled
    markErrorAsHandled: (state, action) => {
      const errorId = action.payload;
      
      // Update error in errors array
      const errorIndex = state.errors.findIndex(e => e.id === errorId);
      if (errorIndex !== -1) {
        state.errors[errorIndex].handled = true;
      }
      
      // Update error in error map
      if (state.errorMap[errorId]) {
        state.errorMap[errorId].handled = true;
      }
      
      // Remove from unhandled errors
      state.unhandledErrors = state.unhandledErrors.filter(id => id !== errorId);
    },
    
    // Mark all errors as handled
    markAllErrorsAsHandled: (state) => {
      // Update all errors
      state.errors.forEach(error => {
        error.handled = true;
      });
      
      // Update error map
      Object.values(state.errorMap).forEach(error => {
        error.handled = true;
      });
      
      // Clear unhandled errors
      state.unhandledErrors = [];
    },
    
    // Remove an error
    removeError: (state, action) => {
      const errorId = action.payload;
      
      // Remove from errors array
      state.errors = state.errors.filter(error => error.id !== errorId);
      
      // Remove from error map
      delete state.errorMap[errorId];
      
      // Remove from unhandled errors
      state.unhandledErrors = state.unhandledErrors.filter(id => id !== errorId);
    },
    
    // Clear all errors
    clearErrors: (state) => {
      state.errors = [];
      state.errorMap = {};
      state.unhandledErrors = [];
    },
    
    // Clear error history
    clearErrorHistory: (state) => {
      state.errorHistory = [];
    },
    
    // Set max history size
    setMaxHistorySize: (state, action) => {
      state.maxHistorySize = action.payload;
      
      // Trim history if needed
      if (state.errorHistory.length > state.maxHistorySize) {
        state.errorHistory = state.errorHistory.slice(0, state.maxHistorySize);
      }
    },
  },
});

// Export actions
export const {
  addError,
  markErrorAsHandled,
  markAllErrorsAsHandled,
  removeError,
  clearErrors,
  clearErrorHistory,
  setMaxHistorySize,
} = errorSlice.actions;

// Selectors
export const selectErrors = (state) => state.error.errors;
export const selectUnhandledErrors = (state) => 
  state.error.unhandledErrors.map(id => state.error.errorMap[id]);
export const selectErrorHistory = (state) => state.error.errorHistory;
export const selectErrorById = (state, errorId) => state.error.errorMap[errorId];
export const selectErrorCount = (state) => state.error.errors.length;
export const selectUnhandledErrorCount = (state) => state.error.unhandledErrors.length;

// Export reducer
export default errorSlice.reducer;
