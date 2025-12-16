import { Suspense, lazy } from "react";
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
import { LoadingFallback, ErrorBoundary } from "./shared/components";

// Eagerly loaded components (needed for initial render)
import Layout from "./shared/components/Layout/Layout";
import ToastController from "./shared/components/ToastController/ToastController";

// Lazy loaded components for code splitting
const Login = lazy(() => import("./features/auth/components/Login/Login"));
const Register = lazy(() => import("./features/auth/components/Register/Register"));
const Feed = lazy(() => import("./features/feed/components/Feed"));
const MessagingApp = lazy(() => import("./features/messaging/components/MessagingApp"));
const Profile = lazy(() =>
  import("./features/profile/components/Profile/Profile").then(module => ({ default: module.Profile }))
);
const FollowersList = lazy(() =>
  import("./features/profile/components/FollowersList/FollowersList").then(module => ({ default: module.FollowersList }))
);
const FollowingList = lazy(() =>
  import("./features/profile/components/FollowingList/FollowingList").then(module => ({ default: module.FollowingList }))
);
const ProfileEdit = lazy(() => import("./features/profile/components/ProfileEdit"));
const CommentsPage = lazy(() =>
  import("./features/feed/components/Comment").then(module => ({ default: module.CommentsPage }))
);
const PostDetail = lazy(() =>
  import("./features/feed/components/PostDetail").then(module => ({ default: module.PostDetail }))
);
const Search = lazy(() =>
  import("./shared/components").then(module => ({ default: module.Search }))
);
const NotificationList = lazy(() =>
  import("./features/notification/components").then(module => ({ default: module.NotificationList }))
);

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
            <Suspense fallback={<LoadingFallback fullScreen message="Loading..." />}>
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
            </Suspense>
            <ToastController />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

const App = () => {
  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
