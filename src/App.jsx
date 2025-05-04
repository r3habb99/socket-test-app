import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, SocketProvider } from "./core/providers";
import { PrivateRoute } from "./core/router";

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
import ToastController from "./shared/components/ToastController/ToastController";
import ToastTester from "./shared/components/ToastController/ToastTester";

const App = () => {
  return (
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
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:userId" element={<Profile />} />
              <Route
                path="profile/:userId/followers"
                element={<FollowersList />}
              />
              <Route
                path="profile/:userId/following"
                element={<FollowingList />}
              />
              <Route path="user/edit-profile" element={<ProfileEdit />} />
              <Route path="toast-test" element={<ToastTester />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Default route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <ToastController />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
