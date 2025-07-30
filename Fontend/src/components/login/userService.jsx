import axios from 'axios';

const getAccessToken = () => {
  const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userData) {
    console.warn('Không tìm thấy dữ liệu người dùng trong localStorage hoặc sessionStorage', {
      timestamp: new Date().toISOString(),
    });
    return null;
  }
  try {
    const user = JSON.parse(userData);
    if (!user || !user.accessToken) {
      console.warn('Dữ liệu người dùng không hợp lệ hoặc thiếu accessToken', {
        timestamp: new Date().toISOString(),
      });
      return null;
    }
    return user.accessToken;
  } catch (error) {
    console.error('Lỗi khi parse dữ liệu người dùng từ storage:', error, {
      timestamp: new Date().toISOString(),
    });
    return null;
  }
};

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

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Không điều hướng nếu yêu cầu là đăng nhập
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/login') && // Bỏ qua endpoint /login
      !originalRequest.url.includes('/logout')
    ) {
      const accessToken = getAccessToken();
      if (!accessToken) {
        console.warn('Không có access token, chuyển hướng đến trang đăng nhập', {
          timestamp: new Date().toISOString(),
        });
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
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
        console.log('Access token hết hạn, đang cố gắng làm mới...', {
          timestamp: new Date().toISOString(),
        });
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/refresh-token`, {
          withCredentials: true,
        });
        console.log('Phản hồi từ refresh token:', response.data, {
          timestamp: new Date().toISOString(),
        });
        const { accessToken } = response.data;
        if (!accessToken) {
          throw new Error('Không nhận được access token từ refresh');
        }
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        const updatedUser = { ...user, accessToken };
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(updatedUser));
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error('Lỗi khi làm mới token:', {
          message: refreshError.message,
          response: refreshError.response?.data,
          status: refreshError.response?.status,
          timestamp: new Date().toISOString(),
        });
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
  if (!token) {
    console.warn('No access token available for logout');
    return { data: { errCode: 0, message: 'No token to logout' } };
  }
  return await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/logout`, {
    withCredentials: true,
    headers: { Authorization: `Bearer ${token}` },
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