/**
 * Socket Slice
 * Centralized socket management for the entire application
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import io from 'socket.io-client';
import { SOCKET_URL } from '../../../constants';
import { setLoading, setError, clearError } from '../../ui/store/uiSlice';

// Initial state
const initialState = {
  socket: null,
  connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected', 'reconnecting'
  reconnectAttempts: 0,
  lastReconnectTime: null,
  onlineUsers: {},
  typingUsers: {},
  lastSeenTimes: {},
  events: {}, // Registered event listeners
  rooms: [], // Joined rooms
};

/**
 * Initialize socket connection
 */
export const initializeSocket = createAsyncThunk(
  'socket/initialize',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'socket', isLoading: true }));
      dispatch(clearError({ feature: 'socket' }));
      
      // Get user info from localStorage
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      const token = localStorage.getItem('token');
      
      if (!userId || !token) {
        const errorMsg = 'User information required for socket connection';
        dispatch(setError({ feature: 'socket', error: errorMsg }));
        return rejectWithValue(errorMsg);
      }
      
      // Check if socket already exists and is connected
      const { socket } = getState().socket;
      if (socket && socket.connected) {
        return { socket };
      }
      
      // Create new socket connection
      const newSocket = io(SOCKET_URL, {
        auth: {
          userId,
          username,
          token,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling'],
      });
      
      return { socket: newSocket };
    } catch (err) {
      const message = err.message || 'Failed to initialize socket';
      dispatch(setError({ feature: 'socket', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'socket', isLoading: false }));
    }
  }
);

/**
 * Join a socket room
 */
export const joinRoom = createAsyncThunk(
  'socket/joinRoom',
  async (roomId, { getState, rejectWithValue }) => {
    try {
      const { socket } = getState().socket;
      
      if (!socket || !socket.connected) {
        return rejectWithValue('Socket not connected');
      }
      
      socket.emit('join room', roomId);
      return { roomId };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to join room');
    }
  }
);

/**
 * Leave a socket room
 */
export const leaveRoom = createAsyncThunk(
  'socket/leaveRoom',
  async (roomId, { getState, rejectWithValue }) => {
    try {
      const { socket } = getState().socket;
      
      if (!socket) {
        return rejectWithValue('Socket not initialized');
      }
      
      socket.emit('leave room', roomId);
      return { roomId };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to leave room');
    }
  }
);

/**
 * Disconnect socket
 */
export const disconnectSocket = createAsyncThunk(
  'socket/disconnect',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { socket } = getState().socket;
      
      if (!socket) {
        return { success: true };
      }
      
      socket.disconnect();
      return { success: true };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to disconnect socket');
    }
  }
);

// Create the slice
const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    // Update connection status
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },
    
    // Set online user
    setOnlineUser: (state, action) => {
      const { userId, isOnline } = action.payload;
      state.onlineUsers[userId] = isOnline;
    },
    
    // Set typing user
    setTypingUser: (state, action) => {
      const { userId, chatId, isTyping } = action.payload;
      
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = {};
      }
      
      if (isTyping) {
        state.typingUsers[chatId][userId] = true;
      } else {
        delete state.typingUsers[chatId][userId];
      }
    },
    
    // Set last seen time
    setLastSeen: (state, action) => {
      const { userId, timestamp } = action.payload;
      state.lastSeenTimes[userId] = timestamp;
    },
    
    // Register event listener
    registerEvent: (state, action) => {
      const { event, handler } = action.payload;
      state.events[event] = handler;
    },
    
    // Unregister event listener
    unregisterEvent: (state, action) => {
      const { event } = action.payload;
      delete state.events[event];
    },
    
    // Increment reconnect attempts
    incrementReconnectAttempts: (state) => {
      state.reconnectAttempts += 1;
      state.lastReconnectTime = new Date().toISOString();
    },
    
    // Reset reconnect attempts
    resetReconnectAttempts: (state) => {
      state.reconnectAttempts = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize socket cases
      .addCase(initializeSocket.fulfilled, (state, action) => {
        state.socket = action.payload.socket;
        state.connectionStatus = 'connected';
        state.reconnectAttempts = 0;
      })
      .addCase(initializeSocket.rejected, (state) => {
        state.connectionStatus = 'disconnected';
      })
      
      // Join room cases
      .addCase(joinRoom.fulfilled, (state, action) => {
        const { roomId } = action.payload;
        if (!state.rooms.includes(roomId)) {
          state.rooms.push(roomId);
        }
      })
      
      // Leave room cases
      .addCase(leaveRoom.fulfilled, (state, action) => {
        const { roomId } = action.payload;
        state.rooms = state.rooms.filter(id => id !== roomId);
      })
      
      // Disconnect socket cases
      .addCase(disconnectSocket.fulfilled, (state) => {
        state.socket = null;
        state.connectionStatus = 'disconnected';
        state.rooms = [];
      });
  },
});

// Export actions
export const {
  setConnectionStatus,
  setOnlineUser,
  setTypingUser,
  setLastSeen,
  registerEvent,
  unregisterEvent,
  incrementReconnectAttempts,
  resetReconnectAttempts,
} = socketSlice.actions;

// Selectors
export const selectSocket = (state) => state.socket.socket;
export const selectConnectionStatus = (state) => state.socket.connectionStatus;
export const selectOnlineUsers = (state) => state.socket.onlineUsers;
export const selectTypingUsers = (state, chatId) => state.socket.typingUsers[chatId] || {};
export const selectLastSeenTimes = (state) => state.socket.lastSeenTimes;
export const selectIsUserOnline = (state, userId) => !!state.socket.onlineUsers[userId];
export const selectLastSeen = (state, userId) => state.socket.lastSeenTimes[userId];
export const selectReconnectAttempts = (state) => state.socket.reconnectAttempts;
export const selectJoinedRooms = (state) => state.socket.rooms;

// Export reducer
export default socketSlice.reducer;
