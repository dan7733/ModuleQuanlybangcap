import axios from 'axios';

const getAccessToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  return user.accessToken || null;
};

// Biến trạng thái để quản lý làm mới token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Interceptor để xử lý lỗi 401
// Nếu token hết hạn, sẽ gọi API để làm mới token một lần duy nhất
// Nếu thành công, sẽ cập nhật token trong localStorage hoặc sessionStorage
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Chỉ xử lý lỗi 401 nếu có accessToken và không phải yêu cầu /logout
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/logout') &&
      getAccessToken()
    ) {
      if (isRefreshing) {
        // Nếu đang làm mới token, thêm yêu cầu vào hàng đợi
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Token expired, trying to refresh...');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/refresh-token`, {
          withCredentials: true,
        });
        const { accessToken } = response.data;
        if (!accessToken) {
          throw new Error('No access token returned from refresh');
        }
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        const updatedUser = { ...user, accessToken };
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(updatedUser));
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error('Failed to refresh token', refreshError);
        processQueue(refreshError, null);
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

const login = async (email, password) => {
  return await axios.post(
    `${process.env.REACT_APP_API_URL}/api/v1/login`,
    { email, password },
    { withCredentials: true }
  );
};

const logout = async () => {
  const token = getAccessToken();
  return await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/logout`, {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

const account = async () => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No access token available');
  }
  return await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/account`, {
    withCredentials: true,
    headers: { Authorization: `Bearer ${token}` },
  });
};

const loginWithGoogleAPI = async (googleId, email, fullname) => {
  return await axios.post(
    `${process.env.REACT_APP_API_URL}/api/v1/google`,
    { googleId, email, fullname },
    { withCredentials: true }
  );
};

export { login, logout, account, loginWithGoogleAPI };