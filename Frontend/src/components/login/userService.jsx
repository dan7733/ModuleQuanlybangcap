import axios from 'axios';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_STORAGE_SECRET;

const getAccessToken = () => {
  const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userData) {
    console.warn('No user data found in localStorage or sessionStorage', {
      timestamp: new Date().toISOString(),
    });
    return null;
  }
  try {
    if (!SECRET_KEY) {
      console.error('SECRET_KEY is not defined', { timestamp: new Date().toISOString() });
      return null;
    }
    const bytes = CryptoJS.AES.decrypt(userData, SECRET_KEY);
    const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    if (!user || !user.accessToken) {
      console.warn('Invalid user data or missing accessToken', {
        timestamp: new Date().toISOString(),
      });
      return null;
    }
    return user.accessToken;
  } catch (error) {
    console.error('Error decrypting or parsing user data from storage:', error, {
      timestamp: new Date().toISOString(),
    });
    return null;
  }
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  console.log('Processing failed queue:', { queueLength: failedQueue.length, timestamp: new Date().toISOString() });
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

const setupAxiosInterceptors = (navigate) => {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (
        error.response &&
        error.response.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url.includes('/login') &&
        !originalRequest.url.includes('/logout') &&
        !originalRequest.url.includes('/refresh-token')
      ) {
        originalRequest._retry = true;

        if (isRefreshing) {
          console.log('Token refresh in progress, queuing request:', originalRequest.url, {
            timestamp: new Date().toISOString(),
          });
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              console.log('Retrying request with new token:', originalRequest.url, {
                timestamp: new Date().toISOString(),
              });
              return axios(originalRequest);
            })
            .catch((err) => {
              console.error('Failed to retry request:', err, { timestamp: new Date().toISOString() });
              return Promise.reject(err);
            });
        }

        isRefreshing = true;
        try {
          console.log('Access token expired, attempting to refresh...', {
            timestamp: new Date().toISOString(),
          });
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/refresh-token`, {
            withCredentials: true,
          });
          if (response.data.errCode !== 0 || !response.data.accessToken) {
            throw new Error(response.data.message || 'No access token returned from refresh');
          }
          const { accessToken } = response.data;
          const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
          if (!userData) {
            throw new Error('No user data found in storage');
          }
          if (!SECRET_KEY) {
            throw new Error('Encryption key missing');
          }
          const bytes = CryptoJS.AES.decrypt(userData, SECRET_KEY);
          const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
          const updatedUser = { ...user, accessToken, auth: true };
          const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
          const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(updatedUser), SECRET_KEY).toString();
          storage.setItem('user', encryptedData);
          console.log('Access token refreshed:', { email: updatedUser.email, timestamp: new Date().toISOString() });
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          console.log('Retrying original request with new token:', originalRequest.url, {
            timestamp: new Date().toISOString(),
          });
          return axios(originalRequest);
        } catch (refreshError) {
          console.error('Error refreshing token:', {
            message: refreshError.message,
            response: refreshError.response?.data,
            status: refreshError.response?.status,
            timestamp: new Date().toISOString(),
          });
          processQueue(refreshError, null);
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          navigate('/login');
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      console.error('Request failed:', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return Promise.reject(error);
    }
  );
};

const login = async (email, password) => {
  return await axios.post(
    `${process.env.REACT_APP_API_URL}/api/v1/login`,
    { email, password },
    { withCredentials: true }
  );
};

const logout = async () => {
  const token = getAccessToken();
  try {
    if (!token) {
      console.warn('No access token available for logout', { timestamp: new Date().toISOString() });
      return { data: { errCode: 0, message: 'No token to logout' } };
    }
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/logout`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Logout response:', response.data, { timestamp: new Date().toISOString() });
    return response;
  } catch (error) {
    console.warn('Logout API failed:', {
      message: error.message,
      response: error.response?.data,
      timestamp: new Date().toISOString(),
    });
    return { data: { errCode: 0, message: 'Local logout succeeded' } };
  }
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

export { login, logout, account, loginWithGoogleAPI, setupAxiosInterceptors };