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
    organization: {
      type: String,
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

// Create model from schema
const User = mongoose.model('User', userSchema);

// Get user by email
const getUserByEmailAPI = async (email) => {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    logger.error(`Error retrieving user with email: ${email}`, { error });
    return null;
  }
};

// Update googleId for user
const updateGoogleId = async (userId, googleId) => {
  try {
    const user = await User.findByIdAndUpdate(userId, { googleid: googleId }, { new: true });
    if (!user) {
      throw new Error(`User with ID: ${userId} not found`);
    }
    return user;
  } catch (error) {
    logger.error(`Error updating googleId for user: ${userId}`, { error });
    throw error;
  }
};

// Request password reset
const requestResetPasswordAPI = async (email) => {
  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('User with this email not found!');
    }

    // Generate password reset token
    const resetPasswordToken = uuidv4();
    const resetPasswordTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // Expires in 1 hour

    // Update token and expiration time in database
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

// Verify and reset password
// Verify and reset password
const resetPasswordAPI = async (resetToken, newPassword) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: resetToken,
    });

    if (!user) {
      throw new Error('Invalid password reset token!');
    }

    // Check expiration time
    if (new Date() > user.resetPasswordTokenExpiresAt) {
      throw new Error('Password reset token has expired!');
    }

    // Validate password requirements
    if (newPassword.length <= 8) {
      throw new Error('Password must be more than 8 characters long!');
    }
    if (!/\d/.test(newPassword)) {
      throw new Error('Password must contain at least one number!');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear token
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

// Verify password reset token
const verifyResetTokenAPI = async (resetToken) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: resetToken,
    });

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

export { User };
export default {
  User,
  getUserByEmailAPI,
  updateGoogleId,
  requestResetPasswordAPI,
  resetPasswordAPI,
  verifyResetTokenAPI,
};