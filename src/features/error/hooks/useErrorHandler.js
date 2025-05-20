import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/hooks';
import {
  addError,
  markErrorAsHandled,
  markAllErrorsAsHandled,
  removeError,
  clearErrors,
  clearErrorHistory,
  selectErrors,
  selectUnhandledErrors,
  selectErrorHistory,
  selectErrorById,
  selectErrorCount,
  selectUnhandledErrorCount,
} from '../store/errorSlice';
import { toast } from 'react-toastify';

/**
 * Custom hook for error handling
 * @param {Object} options - Error handling options
 * @param {boolean} options.showToasts - Whether to show toast notifications for errors
 * @param {boolean} options.logToConsole - Whether to log errors to console
 * @returns {Object} Error handling methods and state
 */
export const useErrorHandler = (options = {}) => {
  const {
    showToasts = true,
    logToConsole = true,
  } = options;
  
  const dispatch = useAppDispatch();
  const errors = useAppSelector(selectErrors);
  const unhandledErrors = useAppSelector(selectUnhandledErrors);
  const errorHistory = useAppSelector(selectErrorHistory);
  const errorCount = useAppSelector(selectErrorCount);
  const unhandledErrorCount = useAppSelector(selectUnhandledErrorCount);
  
  /**
   * Handle an error
   * @param {Error|string} error - Error object or message
   * @param {string} source - Source of the error (e.g., component name)
   * @param {Object} context - Additional context for the error
   */
  const handleError = useCallback((error, source = 'unknown', context = {}) => {
    // Create error payload
    const errorPayload = {
      error,
      source,
      context,
      timestamp: new Date().toISOString(),
    };
    
    // Log to console if enabled
    if (logToConsole) {
      console.error(`[${source}]`, error, context);
    }
    
    // Show toast if enabled
    if (showToasts) {
      const errorMessage = error.message || error;
      toast.error(errorMessage);
    }
    
    // Dispatch to store
    dispatch(addError(errorPayload));
    
    return errorPayload;
  }, [dispatch, logToConsole, showToasts]);
  
  /**
   * Create an error handler for a specific source
   * @param {string} source - Source of the error
   * @returns {Function} Error handler function
   */
  const createErrorHandler = useCallback((source) => {
    return (error, context = {}) => handleError(error, source, context);
  }, [handleError]);
  
  /**
   * Mark an error as handled
   * @param {string} errorId - ID of the error to mark as handled
   */
  const markAsHandled = useCallback((errorId) => {
    dispatch(markErrorAsHandled(errorId));
  }, [dispatch]);
  
  /**
   * Mark all errors as handled
   */
  const markAllAsHandled = useCallback(() => {
    dispatch(markAllErrorsAsHandled());
  }, [dispatch]);
  
  /**
   * Remove an error
   * @param {string} errorId - ID of the error to remove
   */
  const removeErrorById = useCallback((errorId) => {
    dispatch(removeError(errorId));
  }, [dispatch]);
  
  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);
  
  /**
   * Clear error history
   */
  const clearHistory = useCallback(() => {
    dispatch(clearErrorHistory());
  }, [dispatch]);
  
  /**
   * Get an error by ID
   * @param {string} errorId - ID of the error to get
   * @returns {Object} Error object
   */
  const getErrorById = useCallback((errorId) => {
    return useAppSelector(state => selectErrorById(state, errorId));
  }, []);
  
  /**
   * Try to execute a function and handle any errors
   * @param {Function} fn - Function to execute
   * @param {string} source - Source of the error
   * @param {Object} context - Additional context for the error
   * @returns {Promise<*>} Result of the function
   */
  const tryCatch = useCallback(async (fn, source = 'unknown', context = {}) => {
    try {
      return await fn();
    } catch (error) {
      handleError(error, source, context);
      throw error;
    }
  }, [handleError]);
  
  return {
    // Error state
    errors,
    unhandledErrors,
    errorHistory,
    errorCount,
    unhandledErrorCount,
    
    // Error methods
    handleError,
    createErrorHandler,
    markAsHandled,
    markAllAsHandled,
    removeError: removeErrorById,
    clearErrors: clearAllErrors,
    clearErrorHistory: clearHistory,
    getErrorById,
    tryCatch,
  };
};

export default useErrorHandler;
