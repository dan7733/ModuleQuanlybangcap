import axios from 'axios';

const getAccessToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  return user.accessToken || null; // Trả về null nếu không có accessToken
};

// Interceptor để xử lý lỗi 401
// Nếu token hết hạn, sẽ gọi API để làm mới token
// Nếu thành công, sẽ cập nhật token trong localStorage hoặc sessionStorage
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
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
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error('Failed to refresh token', refreshError);
        return Promise.reject(refreshError);
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
    throw new Error('No access token available');
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

export { login, logout, account };