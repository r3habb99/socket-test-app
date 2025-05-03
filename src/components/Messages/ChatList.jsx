import React, { useEffect, useState, useRef } from "react";
import { getAllChats, createChat, createGroupChat } from "../../apis/index";
import { fetchUser } from "../../apis/auth";
import "./css/chatlist.css";

export const ChatList = ({
  onSelectChat,
  prefillUserId = "",
  prefillGroupName = "",
  prefillGroupUsers = "",
  hideCreateInputs = false,
  selectedChatId = null,
}) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const data = await getAllChats();
        setChats(data);
      } catch (error) {
        console.error("Failed to fetch chats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

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

  useEffect(() => {
    if (prefillUserId.trim()) {
      console.log("ChatList: Creating chat with prefillUserId:", prefillUserId);
      handleCreateChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillUserId]);

  useEffect(() => {
    if (prefillGroupName.trim() && prefillGroupUsers.trim()) {
      handleCreateGroupChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillGroupName, prefillGroupUsers]);

  const handleCreateChat = async () => {
    if (!newUserId.trim()) return;
    try {
      console.log("Creating chat with user ID:", newUserId.trim());
      const chatData = await createChat(newUserId.trim());
      console.log("Chat created successfully:", chatData);

      // Check if we have a valid chat object
      if (!chatData) {
        console.error("No chat data returned");
        alert("Failed to create chat. Please try again.");
        return;
      }

      // Determine the actual chat object (might be nested in data property)
      let newChat = chatData;

      // If the chat has a data property, use that
      if (newChat.data) {
        console.log("Using nested chat data:", newChat.data);
        newChat = newChat.data;
      }

      // Normalize the chat object to ensure it has an _id property
      // The API might return 'id' instead of '_id'
      newChat = {
        ...newChat,
        _id: newChat._id || newChat.id, // Use _id if available, otherwise use id
      };

      console.log("Normalized chat object:", newChat);

      // Final check for valid chat object
      if (!newChat._id) {
        console.error(
          "Invalid chat object structure (no id or _id):",
          chatData
        );
        alert("Failed to create chat. Please try again.");
        return;
      }

      // Update the chats list with the new chat
      setChats((prev) => {
        // Check if chat already exists to avoid duplicates
        const exists = prev.some((chat) => chat._id === newChat._id);
        if (exists) {
          console.log("Chat already exists in the list");
          return prev;
        }
        return [newChat, ...prev];
      });

      setNewUserId("");

      // Select the new chat
      console.log("Selecting new chat:", newChat);
      onSelectChat(newChat);
    } catch (error) {
      console.error("Failed to create chat:", error);
      alert("Failed to create chat. Please try again.");
    }
  };

  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || !groupUsers.trim()) return;
    const usersArray = groupUsers.split(",").map((u) => u.trim());
    try {
      const newGroupChat = await createGroupChat(groupName.trim(), usersArray);
      setChats((prev) => [newGroupChat, ...prev]);
      setGroupName("");
      setGroupUsers("");
      onSelectChat(newGroupChat);
    } catch (error) {
      console.error("Failed to create group chat", error);
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
      const results = await fetchUser(query);
      console.log("Search results:", results);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error("Error searching users:", error);
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
      const userId = user._id || user.id;
      console.log("Starting chat with user:", user.username, userId);

      const chatData = await createChat(userId);
      console.log("Chat created:", chatData);

      // Normalize the chat object
      let newChat = chatData;
      if (newChat.data) {
        newChat = newChat.data;
      }

      newChat = {
        ...newChat,
        _id: newChat._id || newChat.id,
      };

      // Update chats list
      setChats((prev) => {
        const exists = prev.some((chat) => chat._id === newChat._id);
        if (exists) {
          return prev;
        }
        return [newChat, ...prev];
      });

      // Select the new chat
      onSelectChat(newChat);

      // Clear search
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
    } catch (error) {
      console.error("Error creating chat:", error);
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
                    <div className="search-result-avatar">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
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
                  <div className="chat-avatar">
                    {(() => {
                      // For group chats, use the chat name
                      if (chat.isGroupChat) {
                        return (chat.chatName || "G").charAt(0).toUpperCase();
                      }

                      // For 1:1 chats, find the other user (not the current logged-in user)
                      const currentUserId = localStorage.getItem("userId");
                      const otherUser = chat.users?.find(
                        (user) =>
                          String(user._id || user.id) !== String(currentUserId)
                      );

                      return otherUser
                        ? otherUser.username.charAt(0).toUpperCase()
                        : "?";
                    })()}
                  </div>
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

      {/* {!hideCreateInputs && (
        <>
          <div className="create-chat">
            <h3>Create Individual Chat</h3>
            <input
              type="text"
              placeholder="User ID"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
            />
            <button onClick={handleCreateChat} disabled={!newUserId.trim()}>
              Create Chat
            </button>
          </div>

          <div className="create-group-chat">
            <h3>Create Group Chat</h3>
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <input
              type="text"
              placeholder="User IDs (comma separated)"
              value={groupUsers}
              onChange={(e) => setGroupUsers(e.target.value)}
            />
            <button
              onClick={handleCreateGroupChat}
              disabled={!groupName.trim() || !groupUsers.trim()}
            >
              Create Group Chat
            </button>
          </div>
        </>
      )} */}
    </div>
  );
};
