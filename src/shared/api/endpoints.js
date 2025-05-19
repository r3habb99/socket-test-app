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
    stats: (id, options = {}) => {
      const {
        contentType = 'posts',
        limit = 10,
        maxId,
        sinceId,
        includeComments = true
      } = options;

      let url = `/user/${id}/stats?content_type=${contentType}&limit=${limit}`;

      if (maxId) url += `&max_id=${maxId}`;
      if (sinceId) url += `&since_id=${sinceId}`;
      if (includeComments !== undefined) url += `&include_comments=${includeComments}`;

      return url;
    },
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
  comment: {
    create: "/comment",
    getById: (id) => `/comment/${id}`,
    update: (id) => `/comment/${id}`,
    delete: (id) => `/comment/${id}`,
    like: (id) => `/comment/${id}/like`, // Used for both like and unlike
    reply: (id) => `/comment/${id}/reply`,
    getForPost: (postId) => `/comment/post/${postId}`,
    getReplies: (commentId) => `/comment/replies/${commentId}`,
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
  notification: {
    getAll: (unreadOnly) => `/notification${unreadOnly ? '?unreadOnly=true' : ''}`,
    latest: "/notification/latest",
    markAsOpened: (id) => `/notification/${id}/markAsOpened`,
    markAllAsOpened: "/notification/markAsOpened",
  },
};

export default endpoints;
