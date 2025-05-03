import React, { useEffect, useState } from "react";
import { getAllChats, createChat, createGroupChat } from "../../apis/index";
import "./css/chatlist.css";

export const ChatList = ({
  onSelectChat,
  prefillUserId = "",
  prefillGroupName = "",
  prefillGroupUsers = "",
  hideCreateInputs = false,
}) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUserId, setNewUserId] = useState(prefillUserId);
  const [groupName, setGroupName] = useState(prefillGroupName);
  const [groupUsers, setGroupUsers] = useState(prefillGroupUsers);

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

  return (
    <div className="chatlist-container">
      <h2>Your Chats</h2>
      {loading ? (
        <p>Loading chats...</p>
      ) : (
        <ul className="chatlist">
          {(Array.isArray(chats) ? chats : []).map((chat) => (
            <li
              key={chat._id}
              className="chatlist-item"
              onClick={() => onSelectChat(chat)}
            >
              {chat.chatName ||
                chat.users?.map((u) => u.username).join(", ") ||
                "Unnamed Chat"}
            </li>
          ))}
        </ul>
      )}

      {!hideCreateInputs && (
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
      )}
    </div>
  );
};
