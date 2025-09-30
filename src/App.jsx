import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import { AuthProvider, SocketProvider, ThemeProvider } from "./core/providers";
import { PrivateRoute } from "./core/router";
import { useTheme } from "./shared/hooks";

// Import components directly
import Login from "./features/auth/components/Login/Login";
import Register from "./features/auth/components/Register/Register";
import Layout from "./shared/components/Layout/Layout";
import Feed from "./features/feed/components/Feed";
import MessagingApp from "./features/messaging/components/MessagingApp";
import { Profile } from "./features/profile/components/Profile/Profile";
import { FollowersList } from "./features/profile/components/FollowersList/FollowersList";
import { FollowingList } from "./features/profile/components/FollowingList/FollowingList";
import ProfileEdit from "./features/profile/components/ProfileEdit";
import { CommentsPage } from "./features/feed/components/Comment";
import { PostDetail } from "./features/feed/components/PostDetail";
import ToastController from "./shared/components/ToastController/ToastController";
import { Search } from "./shared/components";
import { NotificationList } from "./features/notification/components";

/**
 * ThemedApp component - Wraps the app with theme-aware ConfigProvider
 */
const ThemedApp = () => {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: isDark ? '#60a5fa' : '#3b82f6', // Tailwind blue-400/500
          borderRadius: 6,
          colorLink: isDark ? '#60a5fa' : '#3b82f6',
          colorLinkHover: isDark ? '#93c5fd' : '#2563eb', // Tailwind blue-300/600
          colorBgContainer: isDark ? '#262626' : '#ffffff',
          colorBgElevated: isDark ? '#1a1a1a' : '#ffffff',
          colorBorder: isDark ? '#2f3336' : '#eff3f4',
          colorText: isDark ? '#e7e9ea' : '#0f1419',
          colorTextSecondary: isDark ? '#8b98a5' : '#536471',
        },
      }}
    >
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Private routes with children */}
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route path="dashboard" element={<Feed />} />
                <Route path="dashboard/messages" element={<MessagingApp />} />
                <Route path="comments/:postId" element={<CommentsPage />} />
                <Route path="post/:postId" element={<PostDetail />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:userId" element={<Profile />} />
                <Route path="search" element={<Search />} />
                <Route path="notifications" element={<NotificationList />} />
                <Route
                  path="user/:userId/followers"
                  element={<FollowersList />}
                />
                <Route
                  path="user/:userId/following"
                  element={<FollowingList />}
                />
                <Route path="user/edit-profile" element={<ProfileEdit />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>

              {/* Default route */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <ToastController />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
};

export default App;
