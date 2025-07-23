import mongoose from 'mongoose';
import logger from '../configs/logger.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Define schema for user
const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
    },
    phonenumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    issuerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issuer',
      required: [true, 'Issuer ID is required'], // Linked to Issuer collection
    },
    password: {
      type: String,
      required: true,
    },
    roleid: {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3], // 3 admin, 2 manager, 1 certifier, 0 user
    },
    googleid: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      required: false,
    },
    resetPasswordToken: {
      type: String,
      required: false,
    },
    resetPasswordTokenExpiresAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Create model
const User = mongoose.model('User', userSchema);

// Function to get user by email
const getUserByEmailAPI = async (email) => {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    logger.error(`Error fetching user with email: ${email}`, { error });
    return null;
  }
};

// Function to update googleId
const updateGoogleId = async (userId, googleId) => {
  try {
    const user = await User.findByIdAndUpdate(userId, { googleid: googleId }, { new: true });
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    return user;
  } catch (error) {
    logger.error(`Error updating googleId for user: ${userId}`, { error });
    throw error;
  }
};

// Function to request password reset
const requestResetPasswordAPI = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found with this email!');
    }
    const resetPasswordToken = uuidv4();
    const resetPasswordTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await User.findByIdAndUpdate(
      user._id,
      { resetPasswordToken, resetPasswordTokenExpiresAt },
      { new: true }
    );
    return { user, resetPasswordToken };
  } catch (error) {
    logger.error(`Error requesting password reset for email: ${email}`, { error });
    throw error;
  }
};

// Function to reset password
const resetPasswordAPI = async (resetToken, newPassword) => {
  try {
    const user = await User.findOne({ resetPasswordToken: resetToken });
    if (!user) {
      throw new Error('Invalid password reset token!');
    }
    if (new Date() > user.resetPasswordTokenExpiresAt) {
      throw new Error('Password reset token has expired!');
    }
    if (newPassword.length <= 8) {
      throw new Error('Password must be longer than 8 characters!');
    }
    if (!/\d/.test(newPassword)) {
      throw new Error('Password must contain at least one number!');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiresAt: null,
      },
      { new: true }
    );
    return { success: true, message: 'Password reset successfully!', mail: user.email };
  } catch (error) {
    logger.error(`Error resetting password: ${error.message}`, { error });
    throw error;
  }
};

// Function to verify password reset token
const verifyResetTokenAPI = async (resetToken) => {
  try {
    const user = await User.findOne({ resetPasswordToken: resetToken });
    if (!user) {
      throw new Error('Invalid password reset token!');
    }
    if (new Date() > user.resetPasswordTokenExpiresAt) {
      throw new Error('Password reset token has expired!');
    }
    return user;
  } catch (error) {
    logger.error(`Error verifying password reset token: ${error.message}`, { error });
    throw error;
  }
};

// Function to change password
const changePassword = async (email, currentPassword, newPassword, confirmPassword) => {
  try {
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error('Please provide current password, new password, and confirm password!');
    }
    if (newPassword !== confirmPassword) {
      throw new Error('New password and confirm password do not match!');
    }
    if (newPassword.length <= 8) {
      throw new Error('Password must be longer than 8 characters!');
    }
    if (!/\d/.test(newPassword)) {
      throw new Error('Password must contain at least one number!');
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found!');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect!');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );
    return { success: true, message: 'Password changed successfully!' };
  } catch (error) {
    logger.error(`Error changing password for email: ${email}`, { error });
    throw error;
  }
};

export { User };
export default {
  User,
  getUserByEmailAPI,
  updateGoogleId,
  requestResetPasswordAPI,
  resetPasswordAPI,
  verifyResetTokenAPI,
  changePassword,
};