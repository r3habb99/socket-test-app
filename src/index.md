# Source Code Index

This document provides an index of all files in the `src/` directory, excluding the `src/apis/` and `src/components/` directories.

## Root Files

- **src/App.jsx**: Main application component that sets up routing and providers
- **src/index.js**: Entry point for the React application
- **src/index.css**: Global CSS styles
- **src/input.css**: Input styles for Tailwind CSS
- **src/output.css**: Generated CSS from Tailwind

## Core

### Providers

- **src/core/providers/AuthProvider.jsx**: Authentication context provider
- **src/core/providers/SocketProvider.jsx**: WebSocket connection provider
- **src/core/providers/index.js**: Exports all providers

### Router

- **src/core/router/index.js**: Exports router components
- **src/core/router/PrivateRoute.jsx**: Route component for authenticated routes
- **src/core/router/routes.js**: Route configuration for the application

## CSS

- **src/css/dashboard.css**: Styles for dashboard components
- **src/css/main-content.css**: Styles for main content area
- **src/css/sidebar.css**: Styles for sidebar components

## Constants

- **src/constants/index.jsx**: Application-wide constants

## Features

### Auth Feature

- **src/features/auth/index.js**: Exports auth feature components
- **src/features/auth/api/authApi.js**: Authentication API functions
- **src/features/auth/api/passwordApi.js**: Password management API functions
- **src/features/auth/api/index.js**: Exports all auth API functions
- **src/features/auth/components/index.js**: Exports auth components
- **src/features/auth/components/Login/Login.jsx**: Login form component
- **src/features/auth/components/Login/Login.css**: Login form styles
- **src/features/auth/components/Login/index.js**: Exports Login component
- **src/features/auth/components/Register/Register.jsx**: Registration form component
- **src/features/auth/components/Register/Register.css**: Registration form styles
- **src/features/auth/components/Register/index.js**: Exports Register component
- **src/features/auth/components/Logout/Logout.jsx**: Logout component
- **src/features/auth/components/Logout/Logout.css**: Logout component styles
- **src/features/auth/components/Logout/index.js**: Exports Logout component
- **src/features/auth/hooks/useAuth.js**: Custom hook for authentication
- **src/features/auth/hooks/index.js**: Exports auth hooks

### Feed Feature

- **src/features/feed/index.js**: Exports feed feature components
- **src/features/feed/api/postApi.js**: Post-related API functions
- **src/features/feed/api/index.js**: Exports feed API functions
- **src/features/feed/components/index.js**: Exports feed components
- **src/features/feed/components/Feed/Feed.jsx**: Main feed component
- **src/features/feed/components/Feed/Feed.css**: Feed component styles
- **src/features/feed/components/Feed/index.js**: Exports Feed component
- **src/features/feed/components/CreatePost/CreatePost.jsx**: Post creation component
- **src/features/feed/components/CreatePost/CreatePost.css**: Post creation styles
- **src/features/feed/components/CreatePost/index.js**: Exports CreatePost component
- **src/features/feed/components/PostList/PostList.jsx**: List of posts component
- **src/features/feed/components/PostList/PostList.css**: Post list styles
- **src/features/feed/components/PostList/index.js**: Exports PostList component

### Messaging Feature

- **src/features/messaging/index.js**: Exports messaging feature components
- **src/features/messaging/api/messagingApi.js**: Chat and message API functions
- **src/features/messaging/api/socketApi.js**: WebSocket API functions
- **src/features/messaging/api/index.js**: Exports messaging API functions
- **src/features/messaging/components/index.js**: Exports messaging components
- **src/features/messaging/components/MessagingApp/MessagingApp.jsx**: Main messaging component
- **src/features/messaging/components/MessagingApp/MessagingApp.css**: Messaging app styles
- **src/features/messaging/components/MessagingApp/index.js**: Exports MessagingApp component
- **src/features/messaging/components/Chat/Chat.jsx**: Chat conversation component
- **src/features/messaging/components/Chat/Chat.css**: Chat styles
- **src/features/messaging/components/Chat/index.js**: Exports Chat component
- **src/features/messaging/components/ChatList/ChatList.jsx**: List of chats component
- **src/features/messaging/components/ChatList/ChatList.css**: Chat list styles
- **src/features/messaging/components/ChatList/index.js**: Exports ChatList component
- **src/features/messaging/components/UserProfileModal/UserProfileModal.jsx**: User profile modal component
- **src/features/messaging/components/UserProfileModal/UserProfileModal.css**: User profile modal styles
- **src/features/messaging/components/UserProfileModal/index.js**: Exports UserProfileModal component
- **src/features/messaging/hooks/useMessaging.js**: Custom hook for messaging functionality
- **src/features/messaging/hooks/useSocket.js**: Custom hook for WebSocket functionality
- **src/features/messaging/hooks/index.js**: Exports messaging hooks

### Profile Feature

- **src/features/profile/index.js**: Exports profile feature components
- **src/features/profile/api/profileApi.js**: Profile-related API functions
- **src/features/profile/api/index.js**: Exports profile API functions
- **src/features/profile/components/index.js**: Exports profile components
- **src/features/profile/components/Profile/Profile.jsx**: User profile component
- **src/features/profile/components/Profile/Profile.css**: Profile styles
- **src/features/profile/components/Profile/index.js**: Exports Profile component
- **src/features/profile/components/ProfileEdit/ProfileEdit.jsx**: Profile editing component
- **src/features/profile/components/ProfileEdit/ProfileEdit.css**: Profile editing styles
- **src/features/profile/components/ProfileEdit/index.js**: Exports ProfileEdit component
- **src/features/profile/components/ProfilePicUploader/ProfilePicUploader.jsx**: Profile picture upload component
- **src/features/profile/components/ProfilePicUploader/ProfilePicUploader.css**: Profile picture upload styles
- **src/features/profile/components/ProfilePicUploader/index.js**: Exports ProfilePicUploader component
- **src/features/profile/components/CoverPhotoUploader/CoverPhotoUploader.jsx**: Cover photo upload component
- **src/features/profile/components/CoverPhotoUploader/CoverPhotoUploader.css**: Cover photo upload styles
- **src/features/profile/components/CoverPhotoUploader/index.js**: Exports CoverPhotoUploader component
- **src/features/profile/components/FollowButton/FollowButton.jsx**: Follow/unfollow button component
- **src/features/profile/components/FollowButton/FollowButton.css**: Follow button styles
- **src/features/profile/components/FollowButton/index.js**: Exports FollowButton component
- **src/features/profile/components/FollowersList/FollowersList.jsx**: List of followers component
- **src/features/profile/components/FollowersList/FollowersList.css**: Followers list styles
- **src/features/profile/components/FollowersList/index.js**: Exports FollowersList component
- **src/features/profile/components/FollowingList/FollowingList.jsx**: List of following users component
- **src/features/profile/components/FollowingList/FollowingList.css**: Following list styles
- **src/features/profile/components/FollowingList/index.js**: Exports FollowingList component

## Shared

- **src/shared/index.js**: Exports shared components and utilities

### Shared API

- **src/shared/api/client.js**: Axios client configuration
- **src/shared/api/endpoints.js**: API endpoint definitions
- **src/shared/api/index.js**: Exports API utilities

### Shared Components

- **src/shared/components/index.js**: Exports shared components
- **src/shared/components/Input/Input.jsx**: Reusable input component
- **src/shared/components/Input/Input.css**: Input component styles
- **src/shared/components/Input/index.js**: Exports Input component
- **src/shared/components/Layout/Layout.jsx**: Main application layout
- **src/shared/components/Layout/Layout.css**: Layout styles
- **src/shared/components/Layout/index.js**: Exports Layout component
- **src/shared/components/Sidebar/Sidebar.jsx**: Sidebar navigation component
- **src/shared/components/Sidebar/Sidebar.css**: Sidebar styles
- **src/shared/components/Sidebar/index.js**: Exports Sidebar component
- **src/shared/components/ToastController/ToastController.jsx**: Toast notification component
- **src/shared/components/ToastController/ToastController.css**: Toast styles
- **src/shared/components/ToastController/index.js**: Exports ToastController component

### Shared Utils

- **src/shared/utils/dateUtils.js**: Date formatting utilities
- **src/shared/utils/index.js**: Exports utility functions

## Utils

- **src/utils/css/toastController.css**: Additional toast controller styles
