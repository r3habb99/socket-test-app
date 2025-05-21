import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ConfigProvider } from "antd";
import { AuthProvider } from "./core/providers";
import { PrivateRoute } from "./core/router";
import { SocketProviderCompat } from "./features/socket/components";

// Import transition components
import { TransitionLayout, TransitionProvider } from "./shared/components/Transitions";

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
import { GlobalModals } from "./features/ui/components";

// Import global transition styles
import "./shared/components/Transitions/Transitions.css";
import "./shared/components/Transitions/ScrollFix.css";
import "./shared/styles/global-scroll-fix.css";
import "./shared/styles/infinite-scroll-fix.css";
import "./shared/styles/root-layout-fix.css";
import "./shared/styles/user-post-list-fix.css";

const App = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6', // Tailwind blue-500
          borderRadius: 6,
          colorLink: '#3b82f6',
          colorLinkHover: '#2563eb', // Tailwind blue-600
        },
      }}
    >
      <div className="app-container">
        <AuthProvider>
          <SocketProviderCompat>
            <Router>
              <TransitionProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                  <TransitionLayout transitionType="fade">
                    <Login />
                  </TransitionLayout>
                } />
                <Route path="/register" element={
                  <TransitionLayout transitionType="fade">
                    <Register />
                  </TransitionLayout>
                } />

                {/* Private routes with children */}
                <Route
                  path="/*"
                  element={
                    <PrivateRoute>
                      <Layout />
                    </PrivateRoute>
                  }
                >
                  <Route path="dashboard" element={
                    <TransitionLayout transitionType="simpleFade">
                      <Feed />
                    </TransitionLayout>
                  } />
                  <Route path="dashboard/messages" element={
                    <TransitionLayout transitionType="simpleFade">
                      <MessagingApp />
                    </TransitionLayout>
                  } />
                  <Route path="comments/:postId" element={
                    <TransitionLayout transitionType="simpleFade">
                      <CommentsPage />
                    </TransitionLayout>
                  } />
                  <Route path="post/:postId" element={
                    <TransitionLayout transitionType="simpleFade">
                      <PostDetail />
                    </TransitionLayout>
                  } />
                  <Route path="profile" element={
                    <TransitionLayout transitionType="simpleFade">
                      <Profile />
                    </TransitionLayout>
                  } />
                  <Route path="profile/:userId" element={
                    <TransitionLayout transitionType="simpleFade">
                      <Profile />
                    </TransitionLayout>
                  } />
                  <Route path="search" element={
                    <TransitionLayout transitionType="simpleFade">
                      <Search />
                    </TransitionLayout>
                  } />
                  <Route path="notifications" element={
                    <TransitionLayout transitionType="simpleFade">
                      <NotificationList />
                    </TransitionLayout>
                  } />
                  <Route path="user/:userId/followers" element={
                    <TransitionLayout transitionType="simpleFade">
                      <FollowersList />
                    </TransitionLayout>
                  } />
                  <Route path="user/:userId/following" element={
                    <TransitionLayout transitionType="simpleFade">
                      <FollowingList />
                    </TransitionLayout>
                  } />
                  <Route path="user/edit-profile" element={
                    <TransitionLayout transitionType="simpleFade">
                      <ProfileEdit />
                    </TransitionLayout>
                  } />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>

                {/* Default route */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              <ToastController />
              <GlobalModals />
            </TransitionProvider>
          </Router>
        </SocketProviderCompat>
      </AuthProvider>
      </div>
    </ConfigProvider>
  );
};

export default App;
