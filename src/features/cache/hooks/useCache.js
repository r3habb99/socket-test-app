import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/hooks';
import {
  setCacheEntry,
  getCacheEntry,
  removeCacheEntry,
  clearCache,
  clearExpiredEntries,
  updateCacheConfig,
  enableCaching,
  disableCaching,
  invalidateCacheByPrefix,
  refreshCacheTTL,
  selectCacheEntry,
  selectCacheMetadata,
  selectIsCacheEntryValid,
  selectCacheConfig,
  selectIsCachingEnabled,
} from '../store/cacheSlice';

/**
 * Custom hook for cache management
 * @param {Object} options - Cache options
 * @param {number} options.cleanupInterval - Interval in ms to clean up expired entries
 * @returns {Object} Cache methods and state
 */
export const useCache = (options = {}) => {
  const {
    cleanupInterval = 60 * 1000, // 1 minute
  } = options;
  
  const dispatch = useAppDispatch();
  const cacheConfig = useAppSelector(selectCacheConfig);
  const isCachingEnabled = useAppSelector(selectIsCachingEnabled);
  
  // Clean up expired entries periodically
  useEffect(() => {
    if (!isCachingEnabled) return;
    
    const intervalId = setInterval(() => {
      dispatch(clearExpiredEntries());
    }, cleanupInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [cleanupInterval, dispatch, isCachingEnabled]);
  
  /**
   * Set a cache entry
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttl - Time to live in ms
   */
  const setCache = useCallback((key, data, ttl) => {
    if (!isCachingEnabled) return;
    
    dispatch(setCacheEntry({ key, data, ttl }));
  }, [dispatch, isCachingEnabled]);
  
  /**
   * Get a cache entry
   * @param {string} key - Cache key
   * @returns {*} Cached data or undefined
   */
  const getCache = useCallback((key) => {
    if (!isCachingEnabled) return undefined;
    
    const isValid = useAppSelector(state => selectIsCacheEntryValid(state, key));
    if (!isValid) return undefined;
    
    dispatch(getCacheEntry({ key }));
    return useAppSelector(state => selectCacheEntry(state, key));
  }, [dispatch, isCachingEnabled]);
  
  /**
   * Check if a cache entry exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean} Whether the cache entry exists and is valid
   */
  const hasCache = useCallback((key) => {
    if (!isCachingEnabled) return false;
    
    return useAppSelector(state => selectIsCacheEntryValid(state, key));
  }, [isCachingEnabled]);
  
  /**
   * Remove a cache entry
   * @param {string} key - Cache key
   */
  const removeCache = useCallback((key) => {
    dispatch(removeCacheEntry({ key }));
  }, [dispatch]);
  
  /**
   * Clear all cache entries
   */
  const clearAllCache = useCallback(() => {
    dispatch(clearCache());
  }, [dispatch]);
  
  /**
   * Invalidate cache entries by prefix
   * @param {string} prefix - Cache key prefix
   */
  const invalidateByPrefix = useCallback((prefix) => {
    dispatch(invalidateCacheByPrefix({ prefix }));
  }, [dispatch]);
  
  /**
   * Refresh a cache entry's TTL
   * @param {string} key - Cache key
   * @param {number} ttl - New TTL in ms
   */
  const refreshTTL = useCallback((key, ttl) => {
    dispatch(refreshCacheTTL({ key, ttl }));
  }, [dispatch]);
  
  /**
   * Update cache configuration
   * @param {Object} config - New cache configuration
   */
  const updateConfig = useCallback((config) => {
    dispatch(updateCacheConfig(config));
  }, [dispatch]);
  
  /**
   * Enable caching
   */
  const enable = useCallback(() => {
    dispatch(enableCaching());
  }, [dispatch]);
  
  /**
   * Disable caching
   */
  const disable = useCallback(() => {
    dispatch(disableCaching());
  }, [dispatch]);
  
  /**
   * Get cache metadata
   * @param {string} key - Cache key
   * @returns {Object} Cache metadata
   */
  const getCacheMetadata = useCallback((key) => {
    return useAppSelector(state => selectCacheMetadata(state, key));
  }, []);
  
  /**
   * Cached API call wrapper
   * @param {Function} apiCall - API call function
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in ms
   * @returns {Promise<*>} API response
   */
  const cachedApiCall = useCallback(async (apiCall, key, ttl) => {
    if (!isCachingEnabled) {
      return apiCall();
    }
    
    // Check cache first
    const cachedData = getCache(key);
    if (cachedData) {
      return cachedData;
    }
    
    // Call API
    const response = await apiCall();
    
    // Cache response
    setCache(key, response, ttl);
    
    return response;
  }, [getCache, isCachingEnabled, setCache]);
  
  return {
    // Cache state
    cacheConfig,
    isCachingEnabled,
    
    // Cache methods
    setCache,
    getCache,
    hasCache,
    removeCache,
    clearCache: clearAllCache,
    invalidateByPrefix,
    refreshTTL,
    updateConfig,
    enable,
    disable,
    getCacheMetadata,
    cachedApiCall,
  };
};

export default useCache;
