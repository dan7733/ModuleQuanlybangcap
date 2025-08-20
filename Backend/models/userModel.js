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
      required: false,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    issuerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issuer',
      required: [true, 'Issuer ID is required'],
    },
    password: {
      type: String,
      required: true,
    },
    roleid: {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3], // 0: user, 1: certifier, 2: manager, 3: admin
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
    avatar: {
      type: String,
      required: false, // URL hoặc đường dẫn đến ảnh avatar
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

// Tạo người dùng
const createUser = async (userId, userData) => {
  try {
    logger.debug('Starting user creation', { userData });

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      logger.error('Database not connected');
      throw new Error('Database not connected');
    }

    // Validate input data (loại bỏ phonenumber khỏi danh sách bắt buộc)
    const { fullname, email, password, roleid, issuerId, creatorEmail, phonenumber, dob, status } = userData;
    if (!fullname || !email || !password || roleid === undefined || !issuerId || !creatorEmail) {
      logger.error('Missing required user fields', { userData });
      throw new Error('Missing required user fields');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      logger.error(`Email already exists: ${email}`);
      throw new Error('Email already exists');
    }

    // Check if phonenumber already exists if provided
    if (phonenumber) {
      const existingPhone = await User.findOne({ phonenumber }).lean();
      if (existingPhone) {
        logger.error(`Phone number already exists: ${phonenumber}`);
        throw new Error('Phone number already exists');
      }
    }

    // Validate issuerId
    if (!mongoose.Types.ObjectId.isValid(issuerId)) {
      logger.error(`Invalid Issuer ID: ${issuerId}`);
      throw new Error('Invalid Issuer ID');
    }

    // Validate roleid
    if (![0, 1, 2, 3].includes(Number(roleid))) {
      logger.error(`Invalid roleid: ${roleid}`);
      throw new Error('Invalid role ID');
    }

    // Validate password
    if (typeof password !== 'string') {
      logger.error(`Invalid password type: ${typeof password}`);
      throw new Error('Password must be a string');
    }

    // Validate status if provided
    if (status && !['active', 'inactive'].includes(status)) {
      logger.error(`Invalid status: ${status}`);
      throw new Error('Invalid status');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      roleid: Number(roleid),
      issuerId,
      phonenumber: phonenumber || undefined,
      dob: dob || undefined,
      status: status || undefined,
    });

    await newUser.save();
    logger.info(`User created successfully by creator ${creatorEmail}: ${newUser._id}`);
    return newUser;
  } catch (error) {
    logger.error(`Error creating user by creator ${userData.creatorEmail || 'unknown'}`, {
      error: {
        message: error.message || 'Unknown error',
        stack: error.stack,
      },
      userData,
    });
    throw error;
  }
};

// Get users with pagination, filtering, and sorting
const getUsers = async (page = 1, limit = 10, search = '', role = '', sort = 'desc') => {
  try {
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.roleid = role === 'admin' ? 3 : role === 'manager' ? 2 : role === 'certifier' ? 1 : 0;
    }

    // Define sort order
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Fetch paginated, filtered, and sorted users
    const users = await User.find(query)
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Map roleid to role name
    const mappedUsers = users.map((user) => ({
      ...user,
      role:
        user.roleid === 3 ? 'admin' :
        user.roleid === 2 ? 'manager' :
        user.roleid === 1 ? 'certifier' : 'user',
    }));

    // Count total filtered users
    const total = await User.countDocuments(query);

    logger.info(`Fetched ${users.length} users (page: ${page}, limit: ${limit}, search: ${search}, role: ${role}, sort: ${sort})`);
    return {
      users: mappedUsers,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    logger.error(`Error fetching users`, { error });
    throw error;
  }
};

// Delete user
const deleteUser = async (userId, targetUserId) => {
  try {
    // Validate targetUserId
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      logger.error(`Invalid User ID: ${targetUserId}`);
      throw new Error('Invalid User ID');
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      logger.error(`User not found for ID: ${targetUserId}`);
      throw new Error('User not found');
    }

    // Delete avatar if exists
    if (targetUser.avatar) {
      deleteImage(path.basename(targetUser.avatar));
    }

    // Delete user from database
    await User.deleteOne({ _id: targetUserId });
    logger.info(`User deleted successfully by user ${userId}: ${targetUserId}`);
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting user by user ${userId}`, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    });
    throw error;
  }
};

// Get user by ID
const getUserById = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.error(`Invalid User ID: ${id}`);
      throw new Error('Invalid User ID');
    }

    const user = await User.findById(id).lean();
    if (!user) {
      logger.error(`User not found for ID: ${id}`);
      throw new Error('User not found');
    }

    logger.info(`Fetched user with ID: ${id}`);
    return {
      ...user,
      role:
        user.roleid === 3 ? 'admin' :
        user.roleid === 2 ? 'manager' :
        user.roleid === 1 ? 'certifier' : 'user',
    };
  } catch (error) {
    logger.error(`Error fetching user with ID ${id}`, { error });
    throw error;
  }
};

// Update user
const updateUser = async (adminId, targetUserId, userData) => {
  try {
    // Validate admin
    const admin = await User.findById(adminId).lean();
    if (!admin) {
      logger.error(`Admin not found with ID: ${adminId}`);
      throw new Error('Admin not found');
    }
    if (admin.roleid !== 3) {
      logger.error(`User ${adminId} is not authorized to update user`);
      throw new Error('Only admin can update user');
    }

    // Validate targetUserId
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      logger.error(`Invalid User ID: ${targetUserId}`);
      throw new Error('Invalid User ID');
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      logger.error(`User not found for ID: ${targetUserId}`);
      throw new Error('User not found');
    }

    // Validate input data (loại bỏ phonenumber khỏi danh sách bắt buộc)
    const { fullname, dob, phonenumber, email, roleid, status, issuerId } = userData;
    if (!fullname || !email) {
      logger.error(`Missing required user fields: ${JSON.stringify(userData)}`);
      throw new Error('Missing required user fields');
    }

    // Validate issuerId if provided
    if (issuerId && !mongoose.Types.ObjectId.isValid(issuerId)) {
      logger.error(`Invalid Issuer ID: ${issuerId}`);
      throw new Error('Invalid Issuer ID');
    }
    if (issuerId) {
      const issuerExists = await mongoose.model('Issuer').findById(issuerId).lean();
      if (!issuerExists) {
        logger.error(`Issuer not found for ID: ${issuerId}`);
        throw new Error('Issuer not found');
      }
    }

    // Check for duplicate email or phonenumber
    if (email !== targetUser.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        logger.error(`Email already exists: ${email}`);
        throw new Error('Email or phone number already exists');
      }
    }
    if (phonenumber && phonenumber !== targetUser.phonenumber) {
      const existingPhone = await User.findOne({ phonenumber });
      if (existingPhone) {
        logger.error(`Phone number already exists: ${phonenumber}`);
        throw new Error('Email or phone number already exists');
      }
    }

    // Update fields
    targetUser.fullname = fullname;
    targetUser.dob = dob || null;
    targetUser.phonenumber = phonenumber || null;
    targetUser.email = email;
    targetUser.roleid = roleid !== undefined ? parseInt(roleid) : targetUser.roleid;
    targetUser.status = status || targetUser.status;
    if (issuerId) {
      targetUser.issuerId = issuerId;
    }

    await targetUser.save();
    logger.info(`User updated successfully by admin ${adminId}: ${targetUserId}`);
    return targetUser;
  } catch (error) {
    logger.error(`Error updating user by admin ${adminId}`, { error });
    throw error;
  }
};

const updateUserProfile = async (email, userData) => {
  try {
    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      logger.error(`User not found for email: ${email}`);
      throw new Error('User not found');
    }

    const { fullname, dob, phonenumber, avatar } = userData;
    if (!fullname) {
      logger.error(`Missing required field: fullname`, { email });
      throw new Error('Fullname is required');
    }

    if (phonenumber && phonenumber !== targetUser.phonenumber) {
      const existingPhone = await User.findOne({ phonenumber });
      if (existingPhone) {
        logger.error(`Phone number already exists: ${phonenumber}`, { email });
        throw new Error('Phone number already exists');
      }
    }

    targetUser.fullname = fullname;
    targetUser.dob = dob || null;
    targetUser.phonenumber = phonenumber || null;
    if (avatar) {
      targetUser.avatar = avatar;
    }

    await targetUser.save();
    logger.info(`User profile updated successfully: ${email}`);
    return targetUser;
  } catch (error) {
    logger.error(`Error updating user profile: ${email}`, { error });
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
  createUser,
  getUserById,
  updateUser,
  getUsers,
  deleteUser,
  updateUserProfile
};