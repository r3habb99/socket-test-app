// Define all API endpoints in one place
const endpoints = {
  auth: {
    login: "/user/login",
    register: "/user/register",
    logout: "/user/logout",
  },
  user: {
    profile: "/user/profile",
    updateProfile: "/user/profile",
    getById: (id) => `/user/${id}`,
    followers: (id) => `/user/${id}/followers`,
    following: (id) => `/user/${id}/following`,
    follow: (id) => `/user/${id}/follow`,
    changePassword: "/user/change-password",
    search: "/user/search",
  },
  post: {
    create: "/post",
    getAll: "/post",
    getById: (id) => `/post/${id}`,
    update: (id) => `/post/${id}`,
    delete: (id) => `/post/${id}`,
    like: (id) => `/post/${id}/like`,
    unlike: (id) => `/post/${id}/unlike`,
    comment: (id) => `/post/${id}/comment`,
  },
  chat: {
    getAll: "/chat",
    create: "/chat",
    getById: (id) => `/chat/${id}`,
    update: (id) => `/chat/${id}`,
    delete: (id) => `/chat/${id}`,
  },
  message: {
    getAll: (chatId) => `/message/${chatId}`,
    create: "/message",
    update: (id) => `/message/${id}`,
    delete: (id) => `/message/${id}`,
  },
};

export default endpoints;
