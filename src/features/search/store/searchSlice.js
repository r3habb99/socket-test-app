/**
 * Search Slice
 * Manages search functionality across the application
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { searchUsers } from '../../auth/api/authApi';
import { setLoading, setError, clearError } from '../../ui/store/uiSlice';

// Initial state
const initialState = {
  query: '',
  results: [],
  recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
  resultCount: 0,
  hasMore: false,
  page: 1,
  searchType: 'users', // 'users', 'posts', 'messages', etc.
  noResultsFound: false, // Flag to indicate when a search was performed but no results were found
};

/**
 * Search for users
 */
export const performUserSearch = createAsyncThunk(
  'search/performUserSearch',
  async ({ query, page = 1, limit = 10 }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'search', isLoading: true }));
      dispatch(clearError({ feature: 'search' }));

      if (!query.trim()) {
        return { results: [], resultCount: 0, hasMore: false };
      }

      // Create search params object based on the query
      // This allows searching by firstName, lastName, username, or email
      const searchParams = {
        firstName: query,
        lastName: query,
        username: query,
        email: query,
        page,
        limit,
      };

      const response = await searchUsers(searchParams);

      if (response.error) {
        dispatch(setError({ feature: 'search', error: response.message }));
        return rejectWithValue(response.message);
      }

      // Extract results from response
      let results = [];
      let resultCount = 0;

      if (response.data && response.data.statusCode === 200 && Array.isArray(response.data.data)) {
        // API returns { statusCode: 200, message: "...", data: [...] }
        results = response.data.data;
        resultCount = response.data.count || results.length;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // API returns { data: { data: [...] } }
        results = response.data.data;
        resultCount = response.data.count || results.length;
      } else if (Array.isArray(response.data)) {
        // API returns { data: [...] }
        results = response.data;
        resultCount = results.length;
      } else if (response.data && typeof response.data === 'object') {
        // Try to find an array in the response
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          // Use the first array found
          results = possibleArrays[0];
          resultCount = results.length;
        }
      }

      // Check if we have any results
      if (results.length === 0) {
        return {
          results: [],
          resultCount: 0,
          hasMore: false,
          query,
          page,
          noResultsFound: true
        };
      }

      // Normalize results
      const normalizedResults = results.map(result => ({
        ...result,
        id: result.id || result._id, // Ensure id is available
        _id: result._id || result.id, // Ensure _id is available
      }));

      return {
        results: normalizedResults,
        resultCount,
        hasMore: normalizedResults.length === limit,
        query,
        page,
        noResultsFound: false
      };
    } catch (err) {
      const message = err.message || 'Failed to perform search';
      dispatch(setError({ feature: 'search', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'search', isLoading: false }));
    }
  }
);

/**
 * Clear search results
 */
export const clearSearchResults = createAsyncThunk(
  'search/clearSearchResults',
  async (_, { dispatch }) => {
    dispatch(clearError({ feature: 'search' }));
    return { success: true };
  }
);

// Create the slice
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // Set search query
    setSearchQuery: (state, action) => {
      state.query = action.payload;
    },

    // Add recent search
    addRecentSearch: (state, action) => {
      const search = action.payload;

      // Remove if already exists
      state.recentSearches = state.recentSearches.filter(item =>
        item.query !== search.query || item.type !== search.type
      );

      // Add to beginning of list
      state.recentSearches.unshift(search);

      // Limit to 10 recent searches
      if (state.recentSearches.length > 10) {
        state.recentSearches = state.recentSearches.slice(0, 10);
      }

      // Save to localStorage
      localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
    },

    // Remove recent search
    removeRecentSearch: (state, action) => {
      const { query, type } = action.payload;

      state.recentSearches = state.recentSearches.filter(item =>
        item.query !== query || item.type !== type
      );

      // Save to localStorage
      localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
    },

    // Clear recent searches
    clearRecentSearches: (state) => {
      state.recentSearches = [];
      localStorage.removeItem('recentSearches');
    },

    // Set search type
    setSearchType: (state, action) => {
      state.searchType = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Perform user search cases
      .addCase(performUserSearch.fulfilled, (state, action) => {
        const { results, resultCount, hasMore, query, page, noResultsFound } = action.payload;

        // Set the noResultsFound flag
        state.noResultsFound = !!noResultsFound;

        if (page === 1) {
          state.results = results;
        } else {
          // Append new results, avoiding duplicates
          const existingIds = new Set(state.results.map(result => result.id || result._id));

          const newResults = results.filter(result =>
            !existingIds.has(result.id) && !existingIds.has(result._id)
          );

          state.results = [...state.results, ...newResults];
        }

        state.resultCount = resultCount;
        state.hasMore = hasMore;
        state.query = query;
        state.page = page;

        // Add to recent searches if results were found
        if (results.length > 0) {
          const recentSearch = {
            query,
            type: state.searchType,
            timestamp: new Date().toISOString(),
          };

          // Use the reducer to add the recent search
          searchSlice.caseReducers.addRecentSearch(state, { payload: recentSearch });
        }
      })

      // Clear search results cases
      .addCase(clearSearchResults.fulfilled, (state) => {
        state.results = [];
        state.resultCount = 0;
        state.hasMore = false;
        state.page = 1;
        state.noResultsFound = false;
      });
  },
});

// Export actions
export const {
  setSearchQuery,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  setSearchType,
} = searchSlice.actions;

// Selectors
export const selectSearchQuery = (state) => state.search.query;
export const selectSearchResults = (state) => state.search.results;
export const selectResultCount = (state) => state.search.resultCount;
export const selectHasMore = (state) => state.search.hasMore;
export const selectPage = (state) => state.search.page;
export const selectRecentSearches = (state) => state.search.recentSearches;
export const selectSearchType = (state) => state.search.searchType;
export const selectNoResultsFound = (state) => state.search.noResultsFound;

// Export reducer
export default searchSlice.reducer;
