import express from 'express';
import userModel from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../configs/logger.js';
import dotenv from 'dotenv/config';

// Check JWT_SECRET loaded
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env file');
}

// XỬ LÝ ĐĂNG NHẬP
const userLoginAPI = async (req, res) => {
  const { email, password } = req.body;

  // 1. Kiểm tra input
  if (!email || !password) {
    logger.warn('Missing email or password in login request', { email });
    return res.status(400).json({ errCode: 1, message: 'Missing email or password' });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    logger.warn('Invalid email format in login request', { email });
    return res.status(400).json({ errCode: 1, message: 'Invalid email format' });
  }

  try {
    // 2. Tìm user
    const user = await userModel.getUserByEmailAPI(email);
    if (!user) {
      logger.warn('User not found during login', { email });
      return res.status(401).json({ errCode: 1, message: 'Incorrect email or password.' });
    }

    if (user.status !== 'active') {
      logger.warn('Attempted login to inactive/locked account', { email, status: user.status });
      return res.status(403).json({ errCode: 2, message: 'Account is locked or inactive.' });
    }

    // 3. So sánh mật khẩu
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      logger.warn('Incorrect password during login', { email });
      return res.status(401).json({ errCode: 1, message: 'Incorrect email or password.' });
    }

    // 4. Tạo payload và token
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.roleid === 3 ? 'admin' : user.roleid === 2 ? 'manager' : user.roleid === 1 ? 'certifier' : 'user',
      fullname: user.fullname,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // 5. Gửi refresh token vào cookie
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    logger.info('User logged in successfully', { email, role: payload.role });
    return res.status(200).json({ errCode: 0, accessToken });
  } catch (error) {
    logger.error('Error during login', { email, error: error.message, stack: error.stack });
    return res.status(500).json({ errCode: 1, message: 'Internal server error' });
  }
};

// XỬ LÝ ĐĂNG XUẤT
const userLogoutAPI = (req, res) => {
  const email = req.user?.email || 'unknown';

  res.clearCookie('jwt', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  logger.info('User logged out successfully', { email });
  return res.status(200).json({
    errCode: 0,
    message: 'Logout successful.',
  });
};


export default {
  userLoginAPI,
  userLogoutAPI,
};
