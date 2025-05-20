/**
 * Messaging Slice
 * Manages messaging state including chats, messages, and socket connection
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getAllChats,
  getChatById,
  getMessages,
  sendMessage as sendMessageApi,
  createChat as createChatApi,
} from '../api/messagingApi';
import { setLoading, setError, clearError } from '../../ui/store/uiSlice';

// Initial state
const initialState = {
  chats: [],
  selectedChat: null,
  messages: [],
  socket: null,
  connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected'
  typingUsers: {},
  onlineUsers: {},
  lastSeenTimes: {},
};

// Async thunks
export const fetchChats = createAsyncThunk(
  'messaging/fetchChats',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'messaging', isLoading: true }));
      dispatch(clearError({ feature: 'messaging' }));
      
      const response = await getAllChats();
      
      if (response.error) {
        dispatch(setError({ feature: 'messaging', error: response.message }));
        return rejectWithValue(response.message);
      }
      
      // Extract chats from response
      const chatsData = response.data?.data || response.data || [];
      
      // Normalize chat objects to ensure they have both id and _id properties
      const normalizedChats = chatsData.map(chat => ({
        ...chat,
        id: chat.id || chat._id, // Ensure id is available
        _id: chat._id || chat.id, // Ensure _id is available
      }));
      
      return { chats: normalizedChats };
    } catch (err) {
      const message = err.message || "Failed to fetch chats";
      dispatch(setError({ feature: 'messaging', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'messaging', isLoading: false }));
    }
  }
);

export const fetchChat = createAsyncThunk(
  'messaging/fetchChat',
  async (chatId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'messaging', isLoading: true }));
      dispatch(clearError({ feature: 'messaging' }));
      
      const response = await getChatById(chatId);
      
      if (response.error) {
        dispatch(setError({ feature: 'messaging', error: response.message }));
        return rejectWithValue(response.message);
      }
      
      // Extract chat data from response
      const chatData = response.data?.data || response.data;
      
      if (!chatData) {
        const errorMsg = "Chat not found";
        dispatch(setError({ feature: 'messaging', error: errorMsg }));
        return rejectWithValue(errorMsg);
      }
      
      // Normalize chat object
      const normalizedChat = {
        ...chatData,
        id: chatData.id || chatData._id, // Ensure id is available
        _id: chatData._id || chatData.id, // Ensure _id is available
      };
      
      return { chat: normalizedChat };
    } catch (err) {
      const message = err.message || "Failed to fetch chat";
      dispatch(setError({ feature: 'messaging', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'messaging', isLoading: false }));
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messaging/fetchMessages',
  async (chatId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'messaging', isLoading: true }));
      dispatch(clearError({ feature: 'messaging' }));
      
      const response = await getMessages(chatId);
      
      if (response.error) {
        dispatch(setError({ feature: 'messaging', error: response.message }));
        return rejectWithValue(response.message);
      }
      
      // Extract messages from response
      const messagesData = response.data?.data || response.data || [];
      
      // Normalize message objects
      const normalizedMessages = messagesData.map(message => ({
        ...message,
        id: message.id || message._id, // Ensure id is available
        _id: message._id || message.id, // Ensure _id is available
      }));
      
      return { messages: normalizedMessages, chatId };
    } catch (err) {
      const message = err.message || "Failed to fetch messages";
      dispatch(setError({ feature: 'messaging', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'messaging', isLoading: false }));
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messaging/sendMessage',
  async ({ content, chatId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await sendMessageApi(content, chatId);
      
      if (response.error) {
        return rejectWithValue(response.message);
      }
      
      // Extract message data from response
      const messageData = response.data?.data || response.data;
      
      // Normalize message object
      const normalizedMessage = {
        ...messageData,
        id: messageData.id || messageData._id, // Ensure id is available
        _id: messageData._id || messageData.id, // Ensure _id is available
      };
      
      return { message: normalizedMessage, chatId };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to send message");
    }
  }
);

export const createChat = createAsyncThunk(
  'messaging/createChat',
  async (chatData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'messaging', isLoading: true }));
      dispatch(clearError({ feature: 'messaging' }));
      
      const response = await createChatApi(chatData);
      
      if (response.error) {
        dispatch(setError({ feature: 'messaging', error: response.message }));
        return rejectWithValue(response.message);
      }
      
      // Extract chat data from response
      const newChatData = response.data?.data || response.data;
      
      // Normalize chat object
      const normalizedChat = {
        ...newChatData,
        id: newChatData.id || newChatData._id, // Ensure id is available
        _id: newChatData._id || newChatData.id, // Ensure _id is available
      };
      
      return { chat: normalizedChat };
    } catch (err) {
      const message = err.message || "Failed to create chat";
      dispatch(setError({ feature: 'messaging', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'messaging', isLoading: false }));
    }
  }
);

// Create the slice
const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    // Set socket instance
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    
    // Update connection status
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },
    
    // Select a chat
    selectChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    
    // Add a new message (e.g., from socket)
    addMessage: (state, action) => {
      const message = action.payload;
      
      // Normalize message object
      const normalizedMessage = {
        ...message,
        id: message.id || message._id, // Ensure id is available
        _id: message._id || message.id, // Ensure _id is available
      };
      
      // Add message to the list if it's for the selected chat
      if (state.selectedChat && 
          (normalizedMessage.chat === state.selectedChat.id || 
           normalizedMessage.chat === state.selectedChat._id)) {
        state.messages.push(normalizedMessage);
      }
      
      // Update last message in chat list
      const chatIndex = state.chats.findIndex(chat => 
        chat.id === normalizedMessage.chat || chat._id === normalizedMessage.chat
      );
      
      if (chatIndex !== -1) {
        state.chats[chatIndex].latestMessage = normalizedMessage;
      }
    },
    
    // Update typing users
    setTypingUser: (state, action) => {
      const { chatId, userId, isTyping } = action.payload;
      
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = {};
      }
      
      if (isTyping) {
        state.typingUsers[chatId][userId] = true;
      } else {
        delete state.typingUsers[chatId][userId];
      }
    },
    
    // Update online users
    setOnlineUser: (state, action) => {
      const { userId, isOnline } = action.payload;
      state.onlineUsers[userId] = isOnline;
    },
    
    // Update last seen time for a user
    setLastSeen: (state, action) => {
      const { userId, timestamp } = action.payload;
      state.lastSeenTimes[userId] = timestamp;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch chats cases
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.chats = action.payload.chats;
      })
      
      // Fetch chat cases
      .addCase(fetchChat.fulfilled, (state, action) => {
        const { chat } = action.payload;
        
        // Update in chats list if it exists
        const chatIndex = state.chats.findIndex(c => 
          c.id === chat.id || c._id === chat._id
        );
        
        if (chatIndex !== -1) {
          state.chats[chatIndex] = chat;
        } else {
          state.chats.push(chat);
        }
        
        // Update selected chat if it matches
        if (state.selectedChat && 
            (state.selectedChat.id === chat.id || state.selectedChat._id === chat._id)) {
          state.selectedChat = chat;
        }
      })
      
      // Fetch messages cases
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { messages, chatId } = action.payload;
        
        // Only update messages if they're for the selected chat
        if (state.selectedChat && 
            (state.selectedChat.id === chatId || state.selectedChat._id === chatId)) {
          state.messages = messages;
        }
      })
      
      // Send message cases
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { message, chatId } = action.payload;
        
        // Add message to the list if it's for the selected chat
        if (state.selectedChat && 
            (state.selectedChat.id === chatId || state.selectedChat._id === chatId)) {
          state.messages.push(message);
        }
        
        // Update last message in chat list
        const chatIndex = state.chats.findIndex(chat => 
          chat.id === chatId || chat._id === chatId
        );
        
        if (chatIndex !== -1) {
          state.chats[chatIndex].latestMessage = message;
        }
      })
      
      // Create chat cases
      .addCase(createChat.fulfilled, (state, action) => {
        const { chat } = action.payload;
        state.chats.unshift(chat); // Add to beginning of list
        state.selectedChat = chat; // Select the new chat
        state.messages = []; // Clear messages for the new chat
      });
  },
});

// Export actions
export const {
  setSocket,
  setConnectionStatus,
  selectChat,
  addMessage,
  setTypingUser,
  setOnlineUser,
  setLastSeen,
} = messagingSlice.actions;

// Selectors
export const selectChats = (state) => state.messaging.chats;
export const selectSelectedChat = (state) => state.messaging.selectedChat;
export const selectMessages = (state) => state.messaging.messages;
export const selectConnectionStatus = (state) => state.messaging.connectionStatus;
export const selectTypingUsers = (state) => state.messaging.typingUsers;
export const selectOnlineUsers = (state) => state.messaging.onlineUsers;
export const selectLastSeenTimes = (state) => state.messaging.lastSeenTimes;

// Export reducer
export default messagingSlice.reducer;
