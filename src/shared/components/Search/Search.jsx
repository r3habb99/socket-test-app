import React, { useState, useRef, useEffect } from 'react';
import { Input, List, Avatar, Empty, Spin, Typography } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { searchUsers } from '../../../features/auth/api/authApi';
import { getImageUrl } from '../../utils/imageUtils';
import { ImageProxy } from '../ImageProxy';
import { DEFAULT_PROFILE_PIC } from '../../../constants';
import './Search.css';

const { Text } = Typography;

/**
 * Search component for finding users
 * @returns {JSX.Element} Search component
 */
export const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle search for users
   * @param {string} query - Search query
   */
  const handleSearch = async (query) => {
    // If called from onSearch, use the current searchQuery if no query is provided
    const searchTerm = query || searchQuery;

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      // Create search params object based on the query
      // This allows searching by firstName, lastName, username, or email
      const searchParams = {
        firstName: searchTerm,
        lastName: searchTerm,
        username: searchTerm,
        email: searchTerm
      };

      const response = await searchUsers(searchParams);

      // Log the full response to see its structure
      console.log("Full search response:", response);

      // Handle nested data structure
      let results = [];

      if (!response.error) {
        if (response.data && response.data.statusCode === 200 && Array.isArray(response.data.data)) {
          // API returns { statusCode: 200, message: "...", data: [...] }
          results = response.data.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // API returns { data: { data: [...] } }
          results = response.data.data;
        } else if (Array.isArray(response.data)) {
          // API returns { data: [...] }
          results = response.data;
        } else {
          console.warn("Unexpected search results format:", response.data);
        }
      }

      // Log the extracted results
      console.log("Extracted search results:", results);

      // Log the first result if available to see its structure
      if (results.length > 0) {
        console.log("First result structure:", results[0]);
      }

      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handle search input change with debounce
   * @param {Event} e - Input change event
   */
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to delay the search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 500); // 500ms delay
  };

  /**
   * Navigate to user profile
   * @param {Object} user - User object
   */
  const navigateToUserProfile = (user) => {
    const userId = user._id || user.id;

    if (!userId) {
      console.error('Cannot navigate to profile: User ID is missing', user);
      return;
    }

    navigate(`/profile/${userId}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  return (
    <div
      className="sidebar-search-container"
      ref={searchContainerRef}
      role="search"
      aria-label="Search users"
    >
      <div className="sidebar-search">
        <Input.Search
          placeholder="Search Users"
          prefix={<SearchOutlined style={{ color: '#536471' }} aria-hidden="true" />}
          value={searchQuery}
          onChange={handleSearchInputChange}
          onSearch={handleSearch}
          onFocus={() => setShowSearchResults(true)}
          className="sidebar-search-input"
          allowClear
          enterButton={<SearchOutlined style={{ color: '#ffffff' }} aria-hidden="true" />}
          aria-label="Search for users by name, username, or email"
          aria-expanded={showSearchResults}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
      </div>

      {/* Search Results */}
      {showSearchResults && (
        <div
          id="search-results"
          className="sidebar-search-results"
          role="listbox"
          aria-label="Search results"
          aria-busy={isSearching}
        >
          {isSearching ? (
            <div className="sidebar-search-loading" role="status" aria-live="polite">
              <Spin size="small" tip="Searching..." />
              <span className="sr-only">Searching for users...</span>
            </div>
          ) : searchQuery.trim() === "" ? (
            <div className="sidebar-search-instructions" role="status">
              <Text type="secondary">Try searching for people by name, username, or email</Text>
            </div>
          ) : searchResults.length > 0 ? (
            <List
              className="sidebar-search-results-list"
              itemLayout="horizontal"
              dataSource={searchResults}
              renderItem={(user) => (
                <List.Item
                  key={user._id || user.id}
                  className="sidebar-search-result-item"
                  onClick={() => navigateToUserProfile(user)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigateToUserProfile(user);
                    }
                  }}
                  role="option"
                  tabIndex={0}
                  aria-label={`${user.firstName || ''} ${user.lastName || ''} ${user.username ? `@${user.username}` : ''}`}
                >
                  <div className="sidebar-search-result-avatar-container">
                    <Avatar
                      src={user.profilePic ?
                        <ImageProxy
                          src={getImageUrl(user.profilePic, DEFAULT_PROFILE_PIC)}
                          alt={user.username || 'User'}
                          defaultSrc={DEFAULT_PROFILE_PIC}
                        /> : null
                      }
                      alt={user.username || 'User'}
                      className={user.profilePic ? "sidebar-search-result-avatar-img" : "sidebar-search-result-avatar"}
                      icon={!user.profilePic ? <UserOutlined aria-hidden="true" /> : null}
                      style={!user.profilePic ? { backgroundColor: '#1d9bf0' } : {}}
                    >
                      {!user.profilePic && user.username ? user.username.charAt(0).toUpperCase() :
                       !user.profilePic && user.firstName ? user.firstName.charAt(0).toUpperCase() :
                       !user.profilePic ? <UserOutlined aria-hidden="true" /> : null}
                    </Avatar>
                  </div>
                  <div className="sidebar-search-result-content">
                    <div className="sidebar-search-result-name">
                      {user.firstName || ''} {user.lastName || ''}
                      {!user.firstName && !user.lastName && user.username && (
                        <span>{user.username}</span>
                      )}
                    </div>
                    <div className="sidebar-search-result-username">
                      {user.username && `@${user.username}`}
                      {!user.username && user.email && user.email}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty
              description={
                <div className="sidebar-search-no-results-text" role="status" aria-live="polite">
                  <Text strong>No users found</Text>
                  <Text type="secondary">Try searching for a different term</Text>
                </div>
              }
              className="sidebar-search-no-results"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
