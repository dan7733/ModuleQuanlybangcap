import express from 'express';
import userModel from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../configs/logger.js';
import dotenv from 'dotenv/config';
import { sendPasswordResetEmail } from '../configs/email.js';

// Request password reset
const requestResetPasswordAPI = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        errCode: 1,
        message: 'Please provide an email!',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        errCode: 1,
        message: 'Invalid email format!',
      });
    }

    const { user, resetPasswordToken } = await userModel.requestResetPasswordAPI(email);

    // Send password reset email
    await sendPasswordResetEmail(user.email, resetPasswordToken);

    return res.status(200).json({
      errCode: 0,
      message: 'Password reset email has been sent!',
    });
  } catch (error) {
    logger.error(`Error requesting password reset: ${error.message}`, { error });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'An error occurred while requesting password reset. Please try again later.',
    });
  }
};

// GET: Validate password reset token
const getResetPasswordAPI = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        errCode: 1,
        message: 'Invalid link. Please try again!',
      });
    }

    // Verify token using userModel function
    await userModel.verifyResetTokenAPI(token);

    return res.status(200).json({
      errCode: 0,
      message: 'Token is valid',
      token,
    });
  } catch (error) {
    logger.error(`Error validating password reset token: ${error.message}`, { error });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'An error occurred. Please try again later!',
    });
  }
};

// POST: Handle password reset submission
const resetPasswordAPI = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        errCode: 1,
        message: 'Please provide token, new password, and confirm password!',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        errCode: 1,
        message: 'New password and confirm password do not match!',
      });
    }

    const result = await userModel.resetPasswordAPI(token, newPassword);
    // logger thông tin tài khoản email đã đổi
    logger.info(`Password reset successfully for user: ${result.mail}`);
    return res.status(200).json({
      errCode: 0,
      message: result.message,
    });
  } catch (error) {
    logger.error(`Error resetting password: ${error.message}`, { error });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'An error occurred while resetting the password. Please try again!',
    });
  }
};

export default {
  requestResetPasswordAPI,
  getResetPasswordAPI,
  resetPasswordAPI,
};