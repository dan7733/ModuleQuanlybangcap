import jwt from 'jsonwebtoken';
import logger from '../configs/logger.js';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js';
dotenv.config(); // Tải biến môi trường từ .env



// Giải mã token
const verifyToken = (token) => {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    logger.error('Invalid JWT format', { token });
    return null;
  }
  const key = process.env.JWT_SECRET;
  if (!key) {
    logger.error('JWT_SECRET is not defined in .env file');
    throw new Error('JWT_SECRET is not defined');
  }
  try {
    const decoded = jwt.verify(token, key);
    logger.info('Token verified successfully', { exp: decoded.exp, currentTime: Math.floor(Date.now() / 1000) });
    return decoded;
  } catch (err) {
    logger.error('Error verifying JWT', { error: err.message, stack: err.stack, token });
    return null;
  }
};

const userMiddlewareAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Access token missing or malformed');
    return res.status(401).json({
      errCode: 1,
      message: 'Access token is required',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    logger.warn('Invalid or expired access token');
    return res.status(403).json({
      errCode: 1,
      message: 'Invalid or expired access token',
    });
  }

  req.user = decoded;

  // Optional: check if accessing own data
  const emailInUrl = req.params.email || req.params.username;
  if (emailInUrl && decoded.role !== 'admin' && emailInUrl !== decoded.email) {
    logger.warn('Unauthorized access attempt', { tokenEmail: decoded.email, targetEmail: emailInUrl });
    return res.status(403).json({
      errCode: 1,
      message: 'You can only access your own data',
    });
  }
  next();
};


const certifierMiddlewareAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Kiểm tra xem token có được cung cấp không và nó có định dạng Bearer không
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Access token missing or malformed in certifierMiddlewareAPI');
    return res.status(401).json({
      errCode: 1,
      message: 'Access token is required',
    });
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    logger.warn('Invalid or expired access token in certifierMiddlewareAPI');
    return res.status(403).json({
      errCode: 1,
      message: 'Invalid or expired access token',
    });
  }

  // Kiểm tra vai trò: chỉ cho phép admin hoặc certifier
  if (!['admin', 'certifier'].includes(decoded.role)) {
    logger.warn('Unauthorized role for certifierMiddlewareAPI', { email: decoded.email, role: decoded.role });
    return res.status(403).json({
      errCode: 1,
      message: 'Access restricted to admin or certifier roles only',
    });
  }

  req.user = decoded;
  next();
};

// Làm mới access token
const refreshTokenAPI = (req, res) => {
  const token = req.cookies.jwt;
  if (!token) {
    logger.warn('No refresh token provided');
    return res.status(401).json({ errCode: 1, message: 'Please log in again.' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    logger.warn('Invalid refresh token');
    return res.status(403).json({ errCode: 1, message: 'Invalid refresh token, please log in again.' });
  }
  const payload = {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    fullname: decoded.fullname,
  };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  logger.info('Access token refreshed', { email: decoded.email });
  return res.status(200).json({ errCode: 0, accessToken });
};

// Lấy thông tin người dùng
const getAccountAPI = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Access token missing or malformed');
    return res.status(401).json({
      errCode: 1,
      message: 'Access token is required',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    logger.warn('Invalid or expired token for account info');
    return res.status(401).json({
      errCode: 1,
      message: 'Invalid token or expired',
    });
  }

  try {
    logger.info('Account information retrieved', { email: decoded.email });
    return res.status(200).json({
      errCode: 0,
      message: 'Success',
      data: {
        user: decoded.email,
        fullname: decoded.fullname,
        role: decoded.role,
        avatar: null, // Thêm avatar để khớp với frontend
      },
    });
  } catch (error) {
    logger.error('Error fetching account information', { error: error.message, stack: error.stack });
    return res.status(500).json({
      errCode: 1,
      message: 'An error occurred while fetching account information',
    });
  }
};

export default {
  userMiddlewareAPI,
  refreshTokenAPI,
  getAccountAPI,
  certifierMiddlewareAPI
};