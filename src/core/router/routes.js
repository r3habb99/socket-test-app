import React from "react";
import { Navigate } from "react-router-dom";

// Import components from features
const Login = React.lazy(() =>
  import("../../features/auth/components/Login/Login").then((module) => ({
    default: module.default || module,
  }))
);
const Register = React.lazy(() =>
  import("../../features/auth/components/Register/Register").then((module) => ({
    default: module.default || module,
  }))
);
const Layout = React.lazy(() =>
  import("../../shared/components/Layout/Layout").then((module) => ({
    default: module.default || module,
  }))
);

// Import feature components
const Feed = React.lazy(() =>
  import("../../features/feed/components/Feed/Feed").then((module) => ({
    default: module.default || module,
  }))
);

// Import ToastTester
const ToastTester = React.lazy(() =>
  import("../../shared/components/ToastController/ToastTester").then(
    (module) => ({
      default: module.default || module,
    })
  )
);
const MessagingApp = React.lazy(() =>
  import("../../features/messaging/components/MessagingApp").then((module) => ({
    default: module.default || module,
  }))
);
const Profile = React.lazy(() =>
  import("../../features/profile/components/Profile/Profile").then(
    (module) => ({ default: module.default || module })
  )
);
const FollowersList = React.lazy(() =>
  import("../../features/profile/components/FollowersList/FollowersList").then(
    (module) => ({ default: module.default || module })
  )
);
const FollowingList = React.lazy(() =>
  import("../../features/profile/components/FollowingList/FollowingList").then(
    (module) => ({ default: module.default || module })
  )
);
const ProfileEdit = React.lazy(() =>
  import("../../features/profile/components/ProfileEdit/ProfileEdit").then(
    (module) => ({ default: module.default || module })
  )
);

/**
 * Application routes configuration
 */
export const routes = [
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <Login />,
    public: true,
  },
  {
    path: "/register",
    element: <Register />,
    public: true,
  },
  {
    path: "/*",
    element: <Layout />,
    private: true,
    children: [
      {
        path: "dashboard",
        element: <Feed />,
      },
      {
        path: "dashboard/messages",
        element: <MessagingApp />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "profile/:userId",
        element: <Profile />,
      },
      {
        path: "user/:userId/followers",
        element: <FollowersList />,
      },
      {
        path: "user/:userId/following",
        element: <FollowingList />,
      },
      {
        path: "user/edit-profile",
        element: <ProfileEdit />,
      },
      {
        path: "toast-test",
        element: <ToastTester />,
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
];
