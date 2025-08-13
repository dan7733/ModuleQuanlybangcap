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
    // Kiểm tra dữ liệu người dùng từ localStorage hoặc sessionStorage
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (savedUser) {
      try {
        // Giải mã dữ liệu người dùng bằng CryptoJS với khóa SECRET_KEY
        const bytes = CryptoJS.AES.decrypt(savedUser, SECRET_KEY);
        // Parse chuỗi giải mã thành object JSON
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) || { auth: false, email: '' };
      } catch (error) {
        console.error('Error decrypting user data:', error, {
          timestamp: new Date().toISOString(),
        });
        // Nếu giải mã thất bại (khóa sai, dữ liệu hỏng), trả về trạng thái mặc định
        return { auth: false, email: '' };
      }
    }
    // Nếu không có dữ liệu, trả về trạng thái mặc định
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

  const refreshAccessToken = useCallback(async () => {
    setIsLoading(true);
    console.log('Attempting to refresh access token...', { timestamp: new Date().toISOString() });
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/refresh-token`, {
        withCredentials: true,
      });
      const { accessToken } = response.data;
      if (!accessToken) {
        throw new Error('No access token returned from refresh');
      }
      setUser((prevUser) => {
        // Cập nhật user state với accessToken mới
        const updatedUser = { ...prevUser, accessToken, auth: true };
        // Chọn storage (localStorage hoặc sessionStorage) dựa trên nơi lưu dữ liệu trước đó
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        // Mã hóa dữ liệu người dùng bằng CryptoJS trước khi lưu vào storage
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(updatedUser), SECRET_KEY).toString();
        storage.setItem('user', encryptedData);
        console.log('Access token refreshed successfully:', {
          timestamp: new Date().toISOString(),
        });
        return updatedUser;
      });
      return accessToken;
    } catch (error) {
      console.error('Failed to refresh access token:', {
        message: error.message,
        response: error.response?.data,
        timestamp: new Date().toISOString(),
      });
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

        const token = user.accessToken;
        const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/account`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userResponse.data.errCode !== 0) {
          throw new Error('Invalid account data');
        }
        setUser((prevUser) => {
          // Cập nhật user state với thông tin từ API
          const updatedUser = {
            ...prevUser,
            email: userResponse.data.data.user,
            fullname: userResponse.data.data.fullname,
            avatar: userResponse.data.data.avatar,
            role: userResponse.data.data.role,
            auth: true,
          };
          // Chọn storage (localStorage hoặc sessionStorage)
          const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
          // Mã hóa dữ liệu người dùng bằng CryptoJS trước khi lưu
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
    const buffer = 5 * 60 * 1000; // Refresh 5 minutes before expiration
    const timeUntilRefresh = expTime - now - buffer;

    if (timeUntilRefresh > 0) {
      const timeout = setTimeout(async () => {
        try {
          console.log('Proactively refreshing token...', { timestamp: new Date().toISOString() });
          await refreshAccessToken();
        } catch (error) {
          console.error('Proactive refresh failed:', error, { timestamp: new Date().toISOString() });
          await logoutContext();
          navigate('/login');
        }
      }, timeUntilRefresh);
      return () => clearTimeout(timeout);
    } else if (expTime > now) {
      refreshAccessToken().catch(async (error) => {
        console.error('Immediate refresh failed:', error, { timestamp: new Date().toISOString() });
        await logoutContext();
        navigate('/login');
      });
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
    // Chọn storage dựa trên tùy chọn remember (localStorage nếu remember=true, sessionStorage nếu false)
    const storage = remember ? localStorage : sessionStorage;
    // Mã hóa dữ liệu người dùng bằng CryptoJS trước khi lưu vào storage
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
    // Xóa dữ liệu người dùng khỏi localStorage và sessionStorage khi đăng xuất
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