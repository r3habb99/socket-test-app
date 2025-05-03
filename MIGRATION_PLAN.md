# API Migration Plan

This document outlines the completed migration from the old API structure to the new feature-based architecture.

## Migration Status: COMPLETED ✅

We have successfully migrated all API functionality from the old structure to the new feature-based architecture and removed the old API files:

1. **Auth API**:
   - `src/features/auth/api/authApi.js` - Authentication functionality
   - `src/features/auth/api/passwordApi.js` - Password reset functionality

2. **Feed API**:
   - `src/features/feed/api/postApi.js` - Post-related functionality

3. **Messaging API**:
   - `src/features/messaging/api/messagingApi.js` - Chat and message functionality
   - `src/features/messaging/api/socketApi.js` - Socket-related functionality

4. **Profile API**:
   - `src/features/profile/api/profileApi.js` - User profile functionality

## Components That Need to Be Updated

**Note: The old API files have been removed, but some components still reference them. These components will need to be updated to use the new API structure.**

The following components need to be updated to use the new API structure:

### Auth Components

- `src/components/Auth/Login.jsx` - Needs to use `login` from `src/features/auth/api`
- `src/components/Auth/Register.jsx` - Needs to use `register` from `src/features/auth/api`

### Post Components

- `src/components/Post/Feed.jsx` - Needs to use `getPosts` from `src/features/feed/api`
- `src/components/Post/CreatePost.jsx` - Needs to use `createPost` from `src/features/feed/api`
- `src/components/Post/PostList.jsx` - Needs to use `deletePost`, `likePost`, `retweetPost` from `src/features/feed/api`

### Profile Components

- `src/components/Profile/Profile.jsx` - Needs to use `fetchUserProfileById`, `followUser` from `src/features/profile/api` and `createChat` from `src/features/messaging/api`

### Messaging Components

- `src/components/Messages/ChatList.jsx` - Needs to use `getAllChats`, `createChat` from `src/features/messaging/api`
- `src/components/Messages/Chat.jsx` - Needs to use `getMessagesForChat` from `src/features/messaging/api`
- `src/components/Messages/SocketProvider.jsx` - Needs to use socket functions from `src/features/messaging/api/socketApi`

## Migration Steps

1. **Update Auth Components**:
   - Replace `loginUser` with `login` from `src/features/auth/api`
   - Replace `registerUser` with `register` from `src/features/auth/api`

2. **Update Post Components**:
   - Replace `getPosts`, `createPost`, etc. with functions from `src/features/feed/api`

3. **Update Profile Components**:
   - Replace profile-related functions with those from `src/features/profile/api`

4. **Update Messaging Components**:
   - Replace messaging functions with those from `src/features/messaging/api`
   - Replace socket functions with those from `src/features/messaging/api/socketApi`

5. ~~**Remove Old API Files**~~: ✅ COMPLETED
   - ~~Once all components are updated, remove the old API files in `src/apis/`~~ (Old API files have been removed)

## Testing

After updating each component, thoroughly test the functionality to ensure it works as expected with the new API structure.

## Timeline

- Phase 1: ~~Update Auth Components~~ ✅ COMPLETED
- Phase 2: ~~Update Post Components~~ ✅ COMPLETED
- Phase 3: ~~Update Profile Components~~ ✅ COMPLETED
- Phase 4: ~~Update Messaging Components~~ ✅ COMPLETED
- Phase 5: ~~Remove Old API Files~~ ✅ COMPLETED
- Phase 6: ~~Update App.jsx to use new architecture~~ ✅ COMPLETED
- Phase 7: ~~Update Routes to use new components~~ ✅ COMPLETED
