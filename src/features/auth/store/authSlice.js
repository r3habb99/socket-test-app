/**
 * Auth Slice
 * Manages authentication state including user data, login/logout functionality
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { login as loginApi, register as registerApi } from '../api/authApi';
import { setLoading, setError, clearError } from '../../ui/store/uiSlice';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('token') || null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'auth', isLoading: true }));
      dispatch(clearError({ feature: 'auth' }));
      
      const response = await loginApi(credentials);
      
      if (response.error) {
        dispatch(setError({ feature: 'auth', error: response.message }));
        return rejectWithValue(response.message);
      }
      
      // Extract data from response
      const responseData = response.data;
      
      // Handle nested response structure
      let token, userId, userData, username;
      
      // Extract token
      token = responseData?.data?.token || responseData?.token;
      
      // Extract user data
      userData =
        responseData?.data?.userData ||
        responseData?.data?.user ||
        responseData?.userData ||
        responseData?.user ||
        {};
      
      // Extract user ID
      userId = userData?.id || userData?._id;
      
      // Extract username
      username = userData?.username || userData?.name;
      
      if (!token) {
        const errorMsg = "Authentication failed: Token is missing";
        dispatch(setError({ feature: 'auth', error: errorMsg }));
        return rejectWithValue(errorMsg);
      }
      
      if (!userId) {
        const errorMsg = "Authentication failed: User ID is missing";
        dispatch(setError({ feature: 'auth', error: errorMsg }));
        return rejectWithValue(errorMsg);
      }
      
      // Store user data in localStorage for persistence
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      
      if (username) {
        localStorage.setItem('username', username);
      }
      
      if (userData.firstName) {
        localStorage.setItem('firstName', userData.firstName);
      }
      
      if (userData.lastName) {
        localStorage.setItem('lastName', userData.lastName);
      }
      
      if (userData.profilePic) {
        const profilePicUrl = userData.profilePic;
        localStorage.setItem('profilePic', profilePicUrl);
      }
      
      if (userData.email) {
        localStorage.setItem('email', userData.email);
      }
      
      // Return user data for the reducer
      return {
        token,
        user: {
          id: userId,
          username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profilePic: userData.profilePic,
          email: userData.email,
        },
      };
    } catch (err) {
      const message = err.message || "An error occurred during login";
      dispatch(setError({ feature: 'auth', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'auth', isLoading: false }));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ feature: 'auth', isLoading: true }));
      dispatch(clearError({ feature: 'auth' }));
      
      const response = await registerApi(userData);
      
      if (response.error) {
        dispatch(setError({ feature: 'auth', error: response.message }));
        return rejectWithValue(response.message);
      }
      
      return { success: true };
    } catch (err) {
      const message = err.message || "An error occurred during registration";
      dispatch(setError({ feature: 'auth', error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading({ feature: 'auth', isLoading: false }));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      // Remove all user-related data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('firstName');
      localStorage.removeItem('lastName');
      localStorage.removeItem('profilePic');
      localStorage.removeItem('email');
      
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      return { success: false };
    }
  }
);

// Create the slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Check authentication status from localStorage
    checkAuthStatus: (state) => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (token && userId) {
        state.isAuthenticated = true;
        state.token = token;
        state.user = {
          id: userId,
          username: localStorage.getItem('username'),
          firstName: localStorage.getItem('firstName'),
          lastName: localStorage.getItem('lastName'),
          profilePic: localStorage.getItem('profilePic'),
          email: localStorage.getItem('email'),
        };
      } else {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      }
    },
    
    // Update user profile data
    updateUserProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      
      // Update localStorage
      Object.entries(action.payload).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(key, value);
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      
      // Register cases
      .addCase(registerUser.fulfilled, (state) => {
        // Registration successful, but user still needs to login
      })
      
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      });
  },
});

// Export actions
export const { checkAuthStatus, updateUserProfile } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;

// Export reducer
export default authSlice.reducer;
