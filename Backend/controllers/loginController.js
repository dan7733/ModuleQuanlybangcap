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


// đăng nhập google và đăng ký google luôn
const addGoogleUserAPI = async (req, res) => {
  try {
    const { googleId, email, fullname } = req.body;
    console.log('Request body:', req.body);

    if (!googleId || !email) {
      return res.status(400).json({
        errCode: 1,
        message: 'Google ID và email là bắt buộc!',
        detailuser: null,
      });
    }

    const result = await userModel.addGoogleUserAPI(googleId, email, fullname);
    if (!result) {
      return res.status(400).json({
        errCode: 1,
        message: 'Thêm/cập nhật người dùng thất bại, vui lòng thử lại.',
        detailuser: null,
      });
    }

    // Tạo payload cho JWT
    const payload = {
      userId: result.user_id,
      username: result.username,
      role: result.role || 0,
      fullname: result.fullname,
      avatar: result.avatar,
    };

    // Tạo refresh token
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Thiết lập cookie jwt
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Tạo access token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

    return res.status(200).json({
      errCode: 0,
      message: 'Thêm/cập nhật người dùng thành công!',
      detailuser: result,
      accessToken,
    });
  } catch (error) {
    console.error('Lỗi khi thêm/cập nhật người dùng:', error);
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Có lỗi xảy ra khi xử lý người dùng. Vui lòng thử lại sau.',
      detailuser: null,
    });
  }
};

// XỬ LÝ ĐĂNG NHẬP GOOGLE
const googleLoginAPI = async (req, res) => {
  try {
    const { googleId, email, fullname } = req.body;

    // 1. Kiểm tra input
    if (!googleId || !email) {
      logger.warn('Missing googleId or email in Google login request', { email });
      return res.status(400).json({
        errCode: 1,
        message: 'Google ID and email are required!',
        userDetails: null,
      });
    }

    // 2. Tìm user theo email
    const existingUser = await userModel.getUserByEmailAPI(email);
    if (!existingUser) {
      logger.warn('User not found for Google login', { email });
      return res.status(401).json({
        errCode: 1,
        message: 'Tài khoản không tồn tại trong hệ thống. Vui lòng đăng ký trước!',
        userDetails: null,
      });
    }

    // 3. Kiểm tra trạng thái tài khoản
    if (existingUser.status !== 'active') {
      logger.warn('Attempted Google login to inactive/locked account', { email, status: existingUser.status });
      return res.status(403).json({
        errCode: 2,
        message: 'Tài khoản đã bị khóa hoặc không hoạt động.',
        userDetails: null,
      });
    }

    // 4. Cập nhật googleId nếu chưa có
    if (!existingUser.googleid) {
      await userModel.updateGoogleId(existingUser._id, googleId);
      logger.info('Google ID updated for user', { email, googleId });
    }

    // 5. Tạo payload cho JWT
    const payload = {
      userId: existingUser._id.toString(),
      email: existingUser.email,
      role: existingUser.roleid === 3 ? 'admin' : existingUser.roleid === 2 ? 'manager' : existingUser.roleid === 1 ? 'certifier' : 'user',
      fullname: existingUser.fullname,
    };

    // 6. Tạo access và refresh token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // 7. Gửi refresh token vào cookie
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    logger.info('Google login successful', { email, role: payload.role });
    return res.status(200).json({
      errCode: 0,
      message: 'Google login successful!',
      userDetails: {
        userId: existingUser._id.toString(),
        email: existingUser.email,
        fullname: existingUser.fullname,
        avatar: existingUser.avatar || null,
      },
      accessToken,
    });
  } catch (error) {
    logger.error('Error during Google login', { email: req.body.email, error: error.message, stack: error.stack });
    return res.status(500).json({
      errCode: 1,
      message: error.message || 'Có lỗi xảy ra khi xử lý đăng nhập Google. Vui lòng thử lại.',
      userDetails: null,
    });
  }
};

export default {
  userLoginAPI,
  userLogoutAPI,
  googleLoginAPI
};
