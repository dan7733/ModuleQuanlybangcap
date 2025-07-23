import axios from 'axios';

const getAccessToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  return user.accessToken || null;
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
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/logout') &&
      getAccessToken()
    ) {
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
        console.log('Token expired, attempting to refresh...');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/refresh-token`, {
          withCredentials: true,
        });
        console.log('Refresh token response:', response.data);
        const { accessToken } = response.data;
        if (!accessToken) {
          throw new Error('No access token returned from refresh');
        }
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        const updatedUser = { ...user, accessToken };
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(updatedUser));
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`; // Sửa token thành accessToken
        return axios(originalRequest);
      } catch (refreshError) {
        console.error('Failed to refresh token:', {
          message: refreshError.message,
          response: refreshError.response?.data,
          status: refreshError.response?.status,
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