import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { logout } from './userService';

const Context = createContext();

const ContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { auth: false, email: '' };
  });

  useEffect(() => {
    const currentStorage = localStorage.getItem('user') ? localStorage : sessionStorage;
    currentStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  const refreshAccessToken = useCallback(async () => {
    console.log('Attempting to refresh access token...');
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/refresh-token`, {
        withCredentials: true,
      });
      const { accessToken } = response.data;
      if (!accessToken) {
        throw new Error('No access token returned from refresh');
      }
      setUser((prevUser) => {
        const updatedUser = { ...prevUser, accessToken, auth: true };
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      });
      console.log('Access token refreshed successfully:', accessToken);
      return accessToken;
    } catch (error) {
      console.error('Failed to refresh access token:', error.response?.data || error.message);
      await logoutContext();
      navigate('/login');
      throw error;
    }
  }, [navigate]);

  // Kiểm tra token hợp lệ khi ứng dụng tải lại
  useEffect(() => {
    const checkTokenValidity = async () => {
      if (user.auth && user.accessToken) {
        try {
          const decoded = JSON.parse(atob(user.accessToken.split('.')[1]));
          if (Date.now() >= decoded.exp * 1000) {
            console.log('Access token expired on load, refreshing...');
            await refreshAccessToken();
          }
        } catch (error) {
          console.error('Error checking token validity:', error);
          await logoutContext();
          navigate('/login');
        }
      }
    };
    checkTokenValidity();
  }, [user.auth, user.accessToken, refreshAccessToken, navigate]);

  // Làm mới accessToken định kỳ (mỗi 5 phút)
  useEffect(() => {
    if (user.auth && user.accessToken) {
      const interval = setInterval(async () => {
        try {
          await refreshAccessToken();
        } catch (error) {
          console.error('Periodic refresh failed:', error);
        }
      }, 5 * 60 * 1000); // 5 phút
      return () => clearInterval(interval);
    }
  }, [user.auth, user.accessToken, refreshAccessToken]);

  const loginContext = (userData, remember = false) => {
    if (!userData || typeof userData !== 'object' || !userData.accessToken) {
      console.error('Invalid userData provided to loginContext:', userData);
      return;
    }
    const newUser = { ...userData, auth: true };
    setUser(newUser);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(newUser));
    // Kiểm tra token ngay sau khi đăng nhập
    try {
      const decoded = JSON.parse(atob(userData.accessToken.split('.')[1]));
      if (Date.now() >= decoded.exp * 1000) {
        console.log('Access token expired after login, refreshing...');
        refreshAccessToken();
      }
    } catch (error) {
      console.error('Error checking token after login:', error);
      logoutContext();
      navigate('/login');
    }
  };

  const logoutContext = async () => {
    try {
      await logout();
    } catch (error) {
      console.warn('Logout API failed, but proceeding with local cleanup:', error);
    }
    setUser({ email: '', auth: false });
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  };

  return (
    <Context.Provider value={{ user, loginContext, logoutContext, refreshAccessToken }}>
      {children}
    </Context.Provider>
  );
};

export { Context, ContextProvider };