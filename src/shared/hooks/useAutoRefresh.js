import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for automatic data refreshing
 *
 * @param {Function} fetchFunction - The function to call to refresh data
 * @param {number} [delay=3000] - Delay in milliseconds before refreshing after trigger
 * @param {Array} [dependencies=[]] - Dependencies array for the refresh function
 * @returns {Object} - Object containing refresh trigger function and loading state
 */
const useAutoRefresh = (fetchFunction, delay = 3000, dependencies = []) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  // Store dependencies in a ref to avoid the spread operator in the dependency array
  const depsRef = useRef(dependencies);

  // Update the ref when dependencies change
  useEffect(() => {
    depsRef.current = dependencies;
  }, [dependencies]);

  // Function to trigger a refresh
  const triggerRefresh = useCallback((immediate = false) => {
    if (immediate) {
      setRefreshKey(prevKey => prevKey + 1);
    } else {
      setRefreshTrigger(true);
    }
  }, []);

  // Effect to handle delayed refresh
  useEffect(() => {
    if (refreshTrigger) {
      const timer = setTimeout(() => {
        setRefreshKey(prevKey => prevKey + 1);
        setRefreshTrigger(false);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [refreshTrigger, delay]);

  // Effect to call the fetch function when refreshKey changes
  useEffect(() => {
    const refreshData = async () => {
      if (typeof fetchFunction !== 'function') return;

      try {
        setIsRefreshing(true);
        await fetchFunction();
      } catch (error) {
        console.error('Error in auto refresh:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    refreshData();
    // We use fetchFunction and refreshKey directly in the dependency array
    // but access dependencies through the ref to avoid the spread operator
  }, [fetchFunction, refreshKey]);

  return {
    triggerRefresh,
    isRefreshing,
    refreshKey
  };
};

export default useAutoRefresh;
