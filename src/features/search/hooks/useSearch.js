import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/hooks';
import {
  performUserSearch,
  clearSearchResults,
  setSearchQuery,
  removeRecentSearch,
  clearRecentSearches,
  setSearchType,
  selectSearchQuery,
  selectSearchResults,
  selectResultCount,
  selectHasMore,
  selectPage,
  selectRecentSearches,
  selectSearchType,
  selectNoResultsFound,
} from '../store/searchSlice';
import { selectLoading, selectError } from '../../../features/ui/store/uiSlice';

/**
 * Custom hook for search functionality
 * @param {Object} options - Search options
 * @param {number} options.debounceTime - Debounce time in milliseconds
 * @param {string} options.initialType - Initial search type
 * @returns {Object} Search methods and state
 */
export const useSearch = (options = {}) => {
  const {
    debounceTime = 500,
    initialType = 'users',
  } = options;

  const dispatch = useAppDispatch();
  const query = useAppSelector(selectSearchQuery);
  const results = useAppSelector(selectSearchResults);
  const resultCount = useAppSelector(selectResultCount);
  const hasMore = useAppSelector(selectHasMore);
  const page = useAppSelector(selectPage);
  const recentSearches = useAppSelector(selectRecentSearches);
  const searchType = useAppSelector(selectSearchType);
  const noResultsFound = useAppSelector(selectNoResultsFound);
  const isLoading = useAppSelector(state => selectLoading(state, 'search'));
  const error = useAppSelector(state => selectError(state, 'search'));

  const [localQuery, setLocalQuery] = useState(query);
  const [showResults, setShowResults] = useState(false);
  const debounceTimerRef = useRef(null);

  // Set initial search type
  useEffect(() => {
    if (initialType && initialType !== searchType) {
      dispatch(setSearchType(initialType));
    }
  }, [dispatch, initialType, searchType]);

  /**
   * Perform search
   * @param {string} searchQuery - Search query
   * @param {number} pageNum - Page number
   */
  const performSearch = useCallback((searchQuery = query, pageNum = 1) => {
    if (!searchQuery.trim()) {
      dispatch(clearSearchResults());
      return;
    }

    setShowResults(true);

    if (searchType === 'users') {
      dispatch(performUserSearch({ query: searchQuery, page: pageNum }));
    }
    // Add other search types here as needed
  }, [dispatch, query, searchType]);

  /**
   * Handle search input change with debounce
   * @param {string} value - Search query
   */
  const handleSearchChange = useCallback((value) => {
    setLocalQuery(value);

    // Clear any existing timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timeout to delay the search
    debounceTimerRef.current = setTimeout(() => {
      dispatch(setSearchQuery(value));

      if (value.trim()) {
        performSearch(value);
      } else {
        dispatch(clearSearchResults());
      }
    }, debounceTime);
  }, [debounceTime, dispatch, performSearch]);

  /**
   * Load more results
   */
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    performSearch(query, page + 1);
  }, [hasMore, isLoading, page, performSearch, query]);

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setLocalQuery('');
    dispatch(setSearchQuery(''));
    dispatch(clearSearchResults());
    setShowResults(false);
  }, [dispatch]);

  /**
   * Remove a recent search
   * @param {Object} search - Search to remove
   */
  const removeRecent = useCallback((search) => {
    dispatch(removeRecentSearch(search));
  }, [dispatch]);

  /**
   * Clear all recent searches
   */
  const clearRecents = useCallback(() => {
    dispatch(clearRecentSearches());
  }, [dispatch]);

  /**
   * Use a recent search
   * @param {Object} search - Search to use
   */
  const useRecentSearch = useCallback((search) => {
    setLocalQuery(search.query);
    dispatch(setSearchType(search.type));
    dispatch(setSearchQuery(search.query));
    performSearch(search.query);
  }, [dispatch, performSearch]);

  /**
   * Change search type
   * @param {string} type - Search type
   */
  const changeSearchType = useCallback((type) => {
    dispatch(setSearchType(type));

    // Re-run search with new type if there's a query
    if (query.trim()) {
      performSearch(query);
    }
  }, [dispatch, performSearch, query]);

  return {
    // Search state
    query: localQuery,
    results,
    resultCount,
    hasMore,
    page,
    recentSearches,
    searchType,
    isLoading,
    error,
    showResults,
    noResultsFound,

    // Search methods
    handleSearchChange,
    performSearch,
    loadMore,
    clearSearch,
    removeRecent,
    clearRecents,
    useRecentSearch,
    changeSearchType,
    setShowResults,
  };
};

export default useSearch;
