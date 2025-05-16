import React, { useEffect, useState, useRef } from "react";
import { useMessaging } from "../../hooks";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
import { getImageUrl, customToast } from "../../../../shared/utils";
import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import UserStatus from "../UserStatus";
import {
  formatChatTime,
  getChatName,
  getChatUsername,
  handleUserSearch,
  startChatWithUser as startChat
} from "./ChatListHelpers";
import {
  Input,
  Typography,
  List,
  Avatar,
  Spin,
  Empty,
  FloatButton
} from "antd";
import {
  MailOutlined,
  UserOutlined,
  TeamOutlined,
  SearchOutlined
} from "@ant-design/icons";
import "./ChatList.css";

export const ChatList = ({
  onSelectChat,
  prefillUserId = "",
  prefillGroupName = "",
  prefillGroupUsers = "",
  selectedChatId = null,
}) => {
  const { chats, loading, fetchChats, createChat, createGroupChat } =
    useMessaging();
  const socketContext = useSocketContext();
  const [newUserId, setNewUserId] = useState(prefillUserId);
  const [groupName, setGroupName] = useState(prefillGroupName);
  const [groupUsers, setGroupUsers] = useState(prefillGroupUsers);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Fetch chats on component mount
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle click outside search results to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle prefilled user ID
  useEffect(() => {
    if (prefillUserId.trim()) {
      handleCreateChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillUserId]);

  // Handle prefilled group chat
  useEffect(() => {
    if (prefillGroupName.trim() && prefillGroupUsers.trim()) {
      handleCreateGroupChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillGroupName, prefillGroupUsers]);

  const handleCreateChat = async () => {
    if (!newUserId.trim()) return;

    try {
      const result = await createChat({ userId: newUserId.trim() });

      if (result.success) {
        setNewUserId("");
        onSelectChat(result.chat);
      } else {
        customToast.error("Failed to create chat. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
      customToast.error("Failed to create chat. Please try again.");
    }
  };

  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || !groupUsers.trim()) return;

    const usersArray = groupUsers.split(",").map((u) => u.trim());

    try {
      const result = await createGroupChat({
        name: groupName.trim(),
        users: usersArray,
      });

      if (result.success) {
        setGroupName("");
        setGroupUsers("");
        onSelectChat(result.chat);
      } else {
        customToast.error("Failed to create group chat. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create group chat", error);
      customToast.error("Failed to create group chat. Please try again.");
    }
  };

  // Function to handle search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const results = await handleUserSearch(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      customToast.error("Error searching for users. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
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

  // Function to start a chat with a user from search results
  const startChatWithUser = async (user) => {
    // Create a function to clear search state
    const clearSearch = () => {
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
    };

    // Use the helper function
    await startChat(user, chats, createChat, onSelectChat, clearSearch);
  };

  const { Title, Text } = Typography;
  const { Search } = Input;

  // Function to render chat avatar
  const renderChatAvatar = (chat) => {
    // For group chats, use the chat name
    if (chat.isGroupChat) {
      return (
        <Avatar
          className="chat-avatar"
          icon={<TeamOutlined />}
          style={{ backgroundColor: '#1d9bf0' }}
        >
          {(chat.chatName || "G").charAt(0).toUpperCase()}
        </Avatar>
      );
    }

    // For 1:1 chats, find the other user (not the current logged-in user)
    const currentUserId = localStorage.getItem("userId");
    const otherUser = chat.users?.find(
      (user) => String(user._id || user.id) !== String(currentUserId)
    );

    return (
      <Avatar
        src={otherUser && otherUser.profilePic ? getImageUrl(otherUser.profilePic, DEFAULT_PROFILE_PIC) : null}
        alt={otherUser?.username || "User"}
        className={otherUser && otherUser.profilePic ? "chat-avatar-img" : "chat-avatar"}
        icon={!otherUser || !otherUser.profilePic ? <UserOutlined /> : null}
        style={(!otherUser || !otherUser.profilePic) ? { backgroundColor: '#1d9bf0' } : {}}
      >
        {otherUser && !otherUser.profilePic ? otherUser.username.charAt(0).toUpperCase() : null}
        {!otherUser && "?"}
      </Avatar>
    );
  };

  return (
    <div className="chatlist-container">
      <Title level={4} className="chatlist-header">Messages</Title>

      <div
        className="chatlist-search"
        ref={searchContainerRef}
        onClick={() => {
          // Show search UI when the container is clicked
          setShowSearchResults(true);
        }}
      >
        <Search
          placeholder="Search for people and groups"
          value={searchQuery}
          onChange={handleSearchInputChange}
          onFocus={() => {
            // Always show search UI when input is focused
            setShowSearchResults(true);
          }}
          className="chatlist-search-input"
          allowClear
          enterButton={<SearchOutlined />}
          prefix={<SearchOutlined style={{ color: '#536471' }} />}
        />

        {/* Search Results */}
        {showSearchResults && (
          <div className="search-results">
            {isSearching ? (
              <div className="loading-message">
                <Spin size="small" /> <span>Searching...</span>
              </div>
            ) : searchQuery.trim() === "" ? (
              <div className="search-instructions">
                <p>Type a username to find people</p>
                <p className="search-hint">Start typing to search for users</p>
              </div>
            ) : searchResults.length > 0 ? (
              <List
                className="search-results-list"
                itemLayout="horizontal"
                dataSource={searchResults}
                renderItem={(user) => (
                  <List.Item
                    key={user._id || user.id}
                    className="search-result-item"
                    onClick={() => startChatWithUser(user)}
                  >
                    <Avatar
                      src={user.profilePic ? getImageUrl(user.profilePic, DEFAULT_PROFILE_PIC) : null}
                      alt={user.username || 'User'}
                      className={user.profilePic ? "search-result-avatar-img" : "search-result-avatar"}
                      icon={!user.profilePic ? <UserOutlined /> : null}
                      style={!user.profilePic ? { backgroundColor: '#1d9bf0' } : {}}
                    >
                      {!user.profilePic && user.username ? user.username.charAt(0).toUpperCase() :
                       !user.profilePic && user.firstName ? user.firstName.charAt(0).toUpperCase() :
                       !user.profilePic ? <UserOutlined /> : null}
                    </Avatar>
                    <div className="search-result-details">
                      <div className="search-result-name">
                        {user.firstName || ''} {user.lastName || ''}
                        {!user.firstName && !user.lastName && user.username && (
                          <span>{user.username}</span>
                        )}
                      </div>
                      <div className="search-result-username">
                        {user.username && `@${user.username}`}
                        {!user.username && user.email && user.email}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description={<Text>No users found with "{searchQuery}"</Text>}
                className="no-results"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-message">
          <Spin size="large" /> <Text>Loading chats...</Text>
        </div>
      ) : (
        <List
          className="chatlist"
          itemLayout="horizontal"
          dataSource={Array.isArray(chats) ? chats : []}
          renderItem={(chat) => {
            // Get timestamp from latest message or chat creation time
            const timestamp =
              chat.latestMessage?.createdAt || chat.createdAt || null;
            // Format the time for display using the imported helper function
            const timeDisplay = formatChatTime(timestamp);

            return (
              <List.Item
                key={
                  chat._id ||
                  chat.id ||
                  `chat-${Math.random().toString(36).substring(2, 11)}`
                }
                className={`chatlist-item ${
                  (chat._id || chat.id) === selectedChatId ? "selected" : ""
                }`}
                onClick={() => onSelectChat(chat)}
              >
                <div className="chat-item-content">
                  {renderChatAvatar(chat)}
                  <div className="chat-details">
                    <div className="chat-header">
                      <div className="chat-name">
                        {getChatName(chat)}
                      </div>
                      <div className="chat-time">{timeDisplay}</div>
                    </div>

                    {/* Show username and status for non-group chats */}
                    {!chat.isGroupChat && (
                      <div className="chat-username-container">
                        {getChatUsername(chat) && (
                          <div className="chat-username">
                            {getChatUsername(chat)}
                          </div>
                        )}

                        {/* Get the other user's ID for status */}
                        {(() => {
                          const currentUserId = localStorage.getItem("userId");
                          const otherUser = chat.users?.find(
                            user => String(user._id || user.id) !== String(currentUserId)
                          );
                          const otherUserId = otherUser?._id || otherUser?.id;

                          return otherUserId ? (
                            <UserStatus
                              userId={otherUserId}
                              size="small"
                              showText={false}
                            />
                          ) : null;
                        })()}
                      </div>
                    )}

                    <div className="chat-preview">
                      {chat.latestMessage?.content || "No messages yet"}
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}

      {/* New Message Button - only show when no chat is selected */}
      {!selectedChatId && (
        <FloatButton
          icon={

              <MailOutlined style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
          }
          type="primary"
          className="new-message-button"
          onClick={() => {
            // Focus the search input and show search UI
            const searchInput = document.querySelector(
              ".chatlist-search .ant-input"
            );
            if (searchInput) {
              searchInput.focus();
              searchInput.scrollIntoView({ behavior: "smooth" });
              // Clear any previous search
              setSearchQuery("");
              setSearchResults([]);
              // Show a hint to the user
              setShowSearchResults(true);
            }
          }}
          tooltip="New Message"
        />
      )}
    </div>
  );
};
