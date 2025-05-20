import React, { useRef, useEffect } from 'react';
import { Input, List, Avatar, Empty, Spin, Typography } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUtils';
import { ImageProxy } from '../ImageProxy';
import { DEFAULT_PROFILE_PIC } from '../../../constants';
import { useSearch } from '../../../features/search/hooks';
import './Search.css';

const { Text } = Typography;

/**
 * Search component for finding users
 * @returns {JSX.Element} Search component
 */
export const Search = () => {
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  // Use the search hook from Redux
  const {
    query,
    results,
    isLoading,
    error,
    showResults,
    noResultsFound,
    setShowResults,
    handleSearchChange,
    performSearch,
    clearSearch
  } = useSearch({
    debounceTime: 500,
    initialType: 'users'
  });

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowResults]);

  /**
   * Handle search input change
   * @param {Event} e - Input change event
   */
  const handleSearchInputChange = (e) => {
    handleSearchChange(e.target.value);
  };

  /**
   * Handle search button click or Enter key
   */
  const handleSearchSubmit = () => {
    if (query.trim()) {
      performSearch(query);
    }
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
    setShowResults(false);
    clearSearch();
  };

  return (
    <div className="sidebar-search-container" ref={searchContainerRef}>
      <div className="sidebar-search">
        <Input.Search
          placeholder="Search Users"
          prefix={<SearchOutlined style={{ color: '#536471' }} />}
          value={query}
          onChange={handleSearchInputChange}
          onSearch={handleSearchSubmit}
          onFocus={() => setShowResults(true)}
          className="sidebar-search-input"
          allowClear
          enterButton={<SearchOutlined style={{ color: '#ffffff' }} />}
        />
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="sidebar-search-results">
          {isLoading ? (
            <div className="sidebar-search-loading">
              <Spin size="small" tip="Searching..." />
            </div>
          ) : query.trim() === "" ? (
            <div className="sidebar-search-instructions">
              <Text type="secondary">Try searching for people by name, username, or email</Text>
            </div>
          ) : noResultsFound ? (
            <Empty
              description={
                <div className="sidebar-search-no-results-text">
                  <Text strong>No users found for "{query}"</Text>
                  <Text type="secondary">Try searching with a different name, username, or email</Text>
                  <Text type="secondary">Make sure the spelling is correct</Text>
                </div>
              }
              className="sidebar-search-no-results"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : results && results.length > 0 ? (
            <List
              className="sidebar-search-results-list"
              itemLayout="horizontal"
              dataSource={results}
              renderItem={(user) => (
                <List.Item
                  key={user._id || user.id}
                  className="sidebar-search-result-item"
                  onClick={() => navigateToUserProfile(user)}
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
                      icon={!user.profilePic ? <UserOutlined /> : null}
                      style={!user.profilePic ? { backgroundColor: '#1d9bf0' } : {}}
                    >
                      {!user.profilePic && user.username ? user.username.charAt(0).toUpperCase() :
                       !user.profilePic && user.firstName ? user.firstName.charAt(0).toUpperCase() :
                       !user.profilePic ? <UserOutlined /> : null}
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
          ) : null}
          {error && (
            <div className="sidebar-search-error">
              <Text type="danger">Error: {error}</Text>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
