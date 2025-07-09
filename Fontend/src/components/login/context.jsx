import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { logout } from './userService';

const Context = createContext();

const ContextProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { auth: false, email: '' };
  });

  useEffect(() => {
    const currentStorage = localStorage.getItem('user') ? localStorage : sessionStorage;
    currentStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  const refreshAccessToken = useCallback(async () => {
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
      return accessToken;
    } catch (error) {
      console.error('Failed to refresh access token', error);
      await logoutContext();
      throw error;
    }
  }, []); // Không có dependency vì logoutContext không thay đổi

  // Làm mới accessToken định kỳ (mỗi 10 phút)
  useEffect(() => {
    if (user.auth && user.accessToken) {
      const interval = setInterval(async () => {
        try {
          await refreshAccessToken();
        } catch (error) {
          console.error('Periodic refresh failed', error);
        }
      }, 10 * 60 * 1000); // 10 phút
      return () => clearInterval(interval);
    }
  }, [user.auth, user.accessToken, refreshAccessToken]); // Thêm refreshAccessToken vào dependency

  const loginContext = (userData, remember = false) => {
    if (!userData || typeof userData !== 'object' || !userData.accessToken) {
      console.error('Invalid userData provided to loginContext:', userData);
      return;
    }
    const newUser = { ...userData, auth: true };
    setUser(newUser);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(newUser));
  };

const logoutContext = async () => {
  try {
    await logout(); // Gọi logout trước để gửi yêu cầu đến server
  } catch (error) {
    console.warn('Logout API failed, but proceeding with local cleanup:', error);
  }

  // Xóa thông tin người dùng sau khi gọi logout
  setUser({ email: '', auth: false });
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  localStorage.removeItem('wishlist');
  localStorage.removeItem('readingList');
};

  return (
    <Context.Provider value={{ user, loginContext, logoutContext, refreshAccessToken }}>
      {children}
    </Context.Provider>
  );
};

export { Context, ContextProvider };