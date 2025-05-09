import React, { useEffect, useState, useRef } from "react";
import { useMessaging } from "../../hooks";
import { searchUsers } from "../../../auth/api";
import { customToast, getImageUrl } from "../../../../shared/utils";
import { DEFAULT_PROFILE_PIC } from "../../../../constants";
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
      const response = await searchUsers(query);

      // Handle nested data structure
      let results = [];

      if (!response.error) {
        // Check if response.data contains a nested data property
        if (response.data && response.data.data) {
          // API returns { data: { data: [...] } }
          results = response.data.data;
        } else if (Array.isArray(response.data)) {
          // API returns { data: [...] }
          results = response.data;
        } else {
          console.warn("Unexpected search results format:", response.data);
        }
      }

      setSearchResults(Array.isArray(results) ? results : []);
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
    try {
      // Ensure we have a valid user ID
      if (!user) {
        console.error("Invalid user object:", user);
        customToast.error("Invalid user. Please try again.");
        return;
      }

      const userId = user._id || user.id;
      if (!userId) {
        console.error("User object has no ID:", user);
        customToast.error("User has no ID. Please try again.");
        return;
      }


      const result = await createChat({ userId });

      if (result.success) {
        // Select the new chat
        onSelectChat(result.chat);

        // Clear search
        setSearchQuery("");
        setSearchResults([]);
        setShowSearchResults(false);

        // Show success toast
        customToast.success(`Chat started with ${user.username}`);
      } else {
        console.error("Failed to create chat:", result);
        customToast.error("Failed to create chat. Please try again.");
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      customToast.error("Failed to create chat. Please try again.");
    }
  };

  // Function to format date for chat list
  const formatChatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If this year, show month/day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: "numeric", day: "numeric" });
    }

    // Otherwise show month/day/year
    return date.toLocaleDateString([], {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    });
  };

  return (
    <div className="chatlist-container">
      <h2>Messages</h2>

      <div
        className="chatlist-search"
        ref={searchContainerRef}
        onClick={() => {
          // Show search UI when the container is clicked
          setShowSearchResults(true);
        }}
      >
        <input
          type="text"
          placeholder="Search for people and groups"
          value={searchQuery}
          onChange={handleSearchInputChange}
          onFocus={() => {
            // Always show search UI when input is focused
            setShowSearchResults(true);
          }}
        />

        {/* Search Results */}
        {showSearchResults && (
          <div className="search-results">
            {isSearching ? (
              <p className="loading-message">Searching...</p>
            ) : searchQuery.trim() === "" ? (
              <div className="search-instructions">
                <p>Type a username to find people</p>
                <p className="search-hint">Start typing to search for users</p>
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="search-results-list">
                {searchResults.map((user) => (
                  <li
                    key={user._id || user.id}
                    className="search-result-item"
                    onClick={() => startChatWithUser(user)}
                  >
                    {user.profilePic ? (
                      <img
                        src={getImageUrl(user.profilePic, DEFAULT_PROFILE_PIC)}
                        alt={user.username}
                        className="search-result-avatar-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_PROFILE_PIC;
                        }}
                      />
                    ) : (
                      <div className="search-result-avatar">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="search-result-details">
                      <div className="search-result-name">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="search-result-username">
                        @{user.username}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-results">No users found with "{searchQuery}"</p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p className="loading-message">Loading chats...</p>
      ) : (
        <ul className="chatlist">
          {(Array.isArray(chats) ? chats : []).map((chat) => {
            // Get timestamp from latest message or chat creation time
            const timestamp =
              chat.latestMessage?.createdAt || chat.createdAt || null;
            // Format the time for display
            const timeDisplay = formatChatTime(timestamp);

            return (
              <li
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
                  {(() => {
                    // For group chats, use the chat name
                    if (chat.isGroupChat) {
                      return (
                        <div className="chat-avatar">
                          {(chat.chatName || "G").charAt(0).toUpperCase()}
                        </div>
                      );
                    }

                    // For 1:1 chats, find the other user (not the current logged-in user)
                    const currentUserId = localStorage.getItem("userId");
                    const otherUser = chat.users?.find(
                      (user) =>
                        String(user._id || user.id) !== String(currentUserId)
                    );

                    if (otherUser && otherUser.profilePic) {
                      return (
                        <img
                          src={getImageUrl(
                            otherUser.profilePic,
                            DEFAULT_PROFILE_PIC
                          )}
                          alt={otherUser.username || "User"}
                          className="chat-avatar-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_PROFILE_PIC;
                          }}
                        />
                      );
                    } else {
                      return (
                        <div className="chat-avatar">
                          {otherUser
                            ? otherUser.username.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      );
                    }
                  })()}
                  <div className="chat-details">
                    <div className="chat-header">
                      <div className="chat-name">
                        {(() => {
                          // For group chats, use the chat name
                          if (chat.isGroupChat) {
                            return chat.chatName || "Group Chat";
                          }

                          // For 1:1 chats, find the other user (not the current logged-in user)
                          const currentUserId = localStorage.getItem("userId");
                          const otherUser = chat.users?.find(
                            (user) =>
                              String(user._id || user.id) !==
                              String(currentUserId)
                          );

                          // Return the other user's name (first name + last name if available)
                          if (otherUser) {
                            if (otherUser.firstName && otherUser.lastName) {
                              return `${otherUser.firstName} ${otherUser.lastName}`;
                            }
                            return otherUser.username;
                          }
                          return "Unknown User";
                        })()}
                      </div>
                      <div className="chat-time">{timeDisplay}</div>
                    </div>

                    {/* Show username for non-group chats */}
                    {!chat.isGroupChat &&
                      (() => {
                        const currentUserId = localStorage.getItem("userId");
                        const otherUser = chat.users?.find(
                          (user) =>
                            String(user._id || user.id) !==
                            String(currentUserId)
                        );

                        return otherUser ? (
                          <div className="chat-username">
                            @{otherUser.username || "user"}
                          </div>
                        ) : null;
                      })()}

                    <div className="chat-preview">
                      {chat.latestMessage?.content || "No messages yet"}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* New Message Button - only show when no chat is selected */}
      {!selectedChatId && (
        <div
          className="new-message-button"
          onClick={() => {
            // Focus the search input and show search UI
            const searchInput = document.querySelector(
              ".chatlist-search input"
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
          title="New Message"
        >
          ✉️
        </div>
      )}
    </div>
  );
};
