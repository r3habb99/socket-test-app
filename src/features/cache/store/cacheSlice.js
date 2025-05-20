/**
 * Cache Slice
 * Manages caching of API responses and other data
 */
import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  cache: {},
  metadata: {},
  config: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes in milliseconds
    maxSize: 100, // Maximum number of cache entries
    enabled: true, // Whether caching is enabled
  },
};

// Create the slice
const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    // Set cache entry
    setCacheEntry: (state, action) => {
      const { key, data, ttl } = action.payload;
      const timestamp = Date.now();
      const expiresAt = timestamp + (ttl || state.config.defaultTTL);
      
      // Set cache entry
      state.cache[key] = data;
      
      // Set metadata
      state.metadata[key] = {
        timestamp,
        expiresAt,
        ttl: ttl || state.config.defaultTTL,
        hits: 0,
        lastAccessed: timestamp,
      };
      
      // Enforce max size
      if (Object.keys(state.cache).length > state.config.maxSize) {
        // Find least recently used entry
        const lruKey = Object.entries(state.metadata)
          .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
          [0][0];
        
        // Remove least recently used entry
        delete state.cache[lruKey];
        delete state.metadata[lruKey];
      }
    },
    
    // Get cache entry (updates metadata)
    getCacheEntry: (state, action) => {
      const { key } = action.payload;
      
      // If entry exists, update metadata
      if (state.cache[key] && state.metadata[key]) {
        state.metadata[key].hits += 1;
        state.metadata[key].lastAccessed = Date.now();
      }
    },
    
    // Remove cache entry
    removeCacheEntry: (state, action) => {
      const { key } = action.payload;
      
      // Remove entry
      delete state.cache[key];
      delete state.metadata[key];
    },
    
    // Clear cache
    clearCache: (state) => {
      state.cache = {};
      state.metadata = {};
    },
    
    // Clear expired entries
    clearExpiredEntries: (state) => {
      const now = Date.now();
      
      // Find expired entries
      const expiredKeys = Object.entries(state.metadata)
        .filter(([, metadata]) => metadata.expiresAt < now)
        .map(([key]) => key);
      
      // Remove expired entries
      expiredKeys.forEach(key => {
        delete state.cache[key];
        delete state.metadata[key];
      });
    },
    
    // Update cache config
    updateCacheConfig: (state, action) => {
      state.config = {
        ...state.config,
        ...action.payload,
      };
    },
    
    // Enable caching
    enableCaching: (state) => {
      state.config.enabled = true;
    },
    
    // Disable caching
    disableCaching: (state) => {
      state.config.enabled = false;
    },
    
    // Invalidate cache entries by prefix
    invalidateCacheByPrefix: (state, action) => {
      const { prefix } = action.payload;
      
      // Find entries with matching prefix
      const matchingKeys = Object.keys(state.cache)
        .filter(key => key.startsWith(prefix));
      
      // Remove matching entries
      matchingKeys.forEach(key => {
        delete state.cache[key];
        delete state.metadata[key];
      });
    },
    
    // Refresh cache entry TTL
    refreshCacheTTL: (state, action) => {
      const { key, ttl } = action.payload;
      
      // If entry exists, update TTL
      if (state.metadata[key]) {
        const newTTL = ttl || state.config.defaultTTL;
        state.metadata[key].ttl = newTTL;
        state.metadata[key].expiresAt = Date.now() + newTTL;
      }
    },
  },
});

// Export actions
export const {
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
} = cacheSlice.actions;

// Selectors
export const selectCacheEntry = (state, key) => state.cache.cache[key];
export const selectCacheMetadata = (state, key) => state.cache.metadata[key];
export const selectIsCacheEntryValid = (state, key) => {
  const metadata = state.cache.metadata[key];
  if (!metadata) return false;
  
  return metadata.expiresAt > Date.now();
};
export const selectCacheConfig = (state) => state.cache.config;
export const selectIsCachingEnabled = (state) => state.cache.config.enabled;

// Export reducer
export default cacheSlice.reducer;
