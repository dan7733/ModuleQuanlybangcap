import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { logout } from './userService';
import CryptoJS from 'crypto-js';

const Context = createContext();
const SECRET_KEY = process.env.REACT_APP_STORAGE_SECRET;

const ContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (savedUser) {
      try {
        if (!SECRET_KEY) {
          console.error('SECRET_KEY is not defined', { timestamp: new Date().toISOString() });
          return { auth: false, email: '' };
        }
        const bytes = CryptoJS.AES.decrypt(savedUser, SECRET_KEY);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) || { auth: false, email: '' };
      } catch (error) {
        console.error('Error decrypting user data:', error, {
          timestamp: new Date().toISOString(),
        });
        return { auth: false, email: '' };
      }
    }
    return { auth: false, email: '' };
  });
  const [isLoading, setIsLoading] = useState(true);

  const getTokenExpiration = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token expiration:', new Date(payload.exp * 1000).toISOString(), {
        timestamp: new Date().toISOString(),
      });
      return payload.exp * 1000;
    } catch (error) {
      console.error('Error decoding token:', error, { timestamp: new Date().toISOString() });
      return 0;
    }
  };

  const refreshAccessToken = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    if (!SECRET_KEY) {
      console.error('SECRET_KEY is not defined', { timestamp: new Date().toISOString() });
      throw new Error('Encryption key missing');
    }
    setIsLoading(true);
    console.log('Attempting to refresh access token...', { timestamp: new Date().toISOString() });
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/refresh-token`, {
        withCredentials: true,
      });
      console.log('Refresh token response:', response.data, { timestamp: new Date().toISOString() });
      const { accessToken } = response.data;
      if (!accessToken) {
        throw new Error('No access token returned from refresh');
      }
      setUser((prevUser) => {
        const updatedUser = { ...prevUser, accessToken, auth: true };
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(updatedUser), SECRET_KEY).toString();
        storage.setItem('user', encryptedData);
        console.log('Access token refreshed successfully:', {
          email: updatedUser.email,
          timestamp: new Date().toISOString(),
        });
        return updatedUser;
      });
      return accessToken;
    } catch (error) {
      console.error('Failed to refresh access token:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      });
      if (retryCount < maxRetries && error.response?.status === 401) {
        console.warn(`Retry ${retryCount + 1} for token refresh`, { timestamp: new Date().toISOString() });
        return refreshAccessToken(retryCount + 1);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!user.auth || !user.accessToken) {
        console.log('No user or access token, skipping auth initialization', {
          timestamp: new Date().toISOString(),
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log('Refreshing token on app load...', { timestamp: new Date().toISOString() });
        await refreshAccessToken();

        const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
        const bytes = CryptoJS.AES.decrypt(savedUser, SECRET_KEY);
        const parsedUser = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        const token = parsedUser.accessToken;
        const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/account`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userResponse.data.errCode !== 0) {
          throw new Error('Invalid account data');
        }
        setUser((prevUser) => {
          const updatedUser = {
            ...prevUser,
            email: userResponse.data.data.user,
            fullname: userResponse.data.data.fullname,
            avatar: userResponse.data.data.avatar,
            role: userResponse.data.data.role,
            auth: true,
          };
          const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
          const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(updatedUser), SECRET_KEY).toString();
          storage.setItem('user', encryptedData);
          console.log('Account information retrieved:', {
            email: userResponse.data.data.user,
            timestamp: new Date().toISOString(),
          });
          return updatedUser;
        });
      } catch (error) {
        console.error('Failed to initialize auth:', {
          message: error.message,
          response: error.response?.data,
          timestamp: new Date().toISOString(),
        });
        await logoutContext();
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [navigate, user.auth, user.accessToken, refreshAccessToken]);

  useEffect(() => {
    if (!user.auth || !user.accessToken) return;

    const expTime = getTokenExpiration(user.accessToken);
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // Refresh 5 phút trước khi hết hạn
    const timeUntilRefresh = expTime - now - buffer;

    const attemptRefresh = async () => {
      try {
        console.log('Proactively refreshing token...', { timestamp: new Date().toISOString() });
        await refreshAccessToken();
      } catch (error) {
        console.error('Refresh failed:', error, { timestamp: new Date().toISOString() });
        await logoutContext();
        navigate('/login');
      }
    };

    if (expTime <= now) {
      attemptRefresh(); // Làm mới ngay nếu token đã hết hạn
    } else if (timeUntilRefresh > 0) {
      const timeout = setTimeout(attemptRefresh, timeUntilRefresh);
      return () => clearTimeout(timeout);
    }
  }, [user.auth, user.accessToken, refreshAccessToken, navigate]);

  const loginContext = async (userData, remember = false) => {
    if (!userData || typeof userData !== 'object' || !userData.accessToken) {
      console.error('Invalid userData provided to loginContext:', userData, {
        timestamp: new Date().toISOString(),
      });
      return;
    }
    const newUser = { ...userData, auth: true };
    setUser(newUser);
    const storage = remember ? localStorage : sessionStorage;
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(newUser), SECRET_KEY).toString();
    storage.setItem('user', encryptedData);
  };

  const logoutContext = async () => {
    try {
      await logout();
    } catch (error) {
      console.warn('Logout API failed, proceeding with local cleanup:', error, {
        timestamp: new Date().toISOString(),
      });
    }
    setUser({ email: '', auth: false });
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  };

  return (
    <Context.Provider value={{ user, loginContext, logoutContext, refreshAccessToken, isLoading }}>
      {isLoading ? (
        <div className="loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang xác thực...</span>
          </div>
        </div>
      ) : (
        children
      )}
    </Context.Provider>
  );
};

export { Context, ContextProvider };