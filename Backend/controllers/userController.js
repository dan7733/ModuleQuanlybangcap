import logger from '../configs/logger.js';
import userModel from '../models/userModel.js';

// Lấy thông tin hồ sơ người dùng
const fetchUserProfile = async (req, res) => {
  try {
    // Lấy thông tin người dùng từ req.user (được thiết lập bởi authMiddleware.userMiddlewareAPI)
    const { email } = req.user;

    // Lấy thông tin chi tiết từ cơ sở dữ liệu
    const user = await userModel.getUserByEmailAPI(email);
    if (!user) {
      logger.warn('User not found', { email });
      return res.status(404).json({
        errCode: 1,
        message: 'User not found',
      });
    }

    logger.info('User profile retrieved', { email: user.email });
    return res.status(200).json({
      errCode: 0,
      message: 'Success',
      data: {
        fullName: user.fullname,
        email: user.email,
        phoneNumber: user.phonenumber || null,
        dateOfBirth: user.dob ? new Date(user.dob).toISOString().split('T')[0] : null,
        organization: user.organization || null,
        role: user.roleid === 3 ? 'admin' : user.roleid === 2 ? 'manager' : user.roleid === 1 ? 'certifier' : 'user',
        status: user.status || 'N/A',
        avatar: null, // Để trống theo yêu cầu
      },
    });
  } catch (error) {
    logger.error('Error fetching user profile', { error: error.message, stack: error.stack });
    return res.status(500).json({
      errCode: 1,
      message: 'An error occurred while fetching user profile',
    });
  }
};


// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const { email } = req.user;

    const result = await userModel.changePassword(email, currentPassword, newPassword, confirmPassword);
    logger.info('Password changed successfully', { email });

    return res.status(200).json({
      errCode: 0,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Error changing password', { error: error.message, stack: error.stack });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error changing password',
    });
  }
};

// Tạo người dùng (chỉ dành cho admin)
const createUserAPI = async (req, res) => {
  try {
    // Validate req.user
    if (!req.user || !req.user.email) {
      logger.error('Invalid or missing req.user data', { user: req.user });
      return res.status(401).json({
        errCode: 1,
        message: 'Invalid user authentication data',
      });
    }

    const { fullname, email, password, roleid, issuerId, creatorEmail } = req.body;
    logger.debug('Received createUserAPI request', { body: req.body, creatorEmail });

    // Validate required fields
    if (!fullname || !email || !password || roleid === undefined || !issuerId || !creatorEmail) {
      logger.error('Missing required user fields', { body: req.body });
      return res.status(400).json({
        errCode: 1,
        message: 'Missing required user fields',
      });
    }

    // Check if creator email matches authenticated user
    if (creatorEmail !== req.user.email) {
      logger.error(`Creator email ${creatorEmail} does not match authenticated user ${req.user.email}`);
      return res.status(403).json({
        errCode: 1,
        message: 'Creator email does not match authenticated user',
      });
    }

    // Call model function to create user
    const newUser = await userModel.createUser(null, { fullname, email, password, roleid, issuerId, creatorEmail });
    
    logger.info(`User created successfully`, { id: newUser._id, creatorEmail });
    return res.status(201).json({
      errCode: 0,
      message: 'User created successfully',
      data: {
        _id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        roleid: newUser.roleid,
        issuerId: newUser.issuerId,
      },
    });
  } catch (error) {
    logger.error(`Error creating user`, {
      error: {
        message: error.message || 'Unknown error',
        stack: error.stack,
      },
      creatorEmail: req.body.creatorEmail,
      body: req.body,
    });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error creating user',
    });
  }
};

// Get users with pagination
const getUsersAPI = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const sort = req.query.sort || 'desc';

    const { users, total, totalPages, currentPage } = await userModel.getUsers(
      page,
      limit,
      search,
      role,
      sort
    );

    logger.info(`Fetched users for admin`, {
      userId: req.user.userId,
      user: req.user.email,
      search,
      role,
      sort,
    });
    return res.status(200).json({
      errCode: 0,
      data: {
        users,
        total,
        totalPages,
        currentPage,
      },
    });
  } catch (error) {
    logger.error(`Error fetching users`, { error, user: req.user?.email });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error fetching users',
    });
  }
};

// Delete user
const deleteUserAPI = async (req, res) => {
  try {
    console.log('Deleting user with ID:', req.params);
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await userModel.deleteUser(userId, id);
    logger.info(`User deleted successfully`, { id, user: req.user.email });
    return res.status(200).json({
      errCode: 0,
      message: result.message,
    });
  } catch (error) {
    logger.error(`Error deleting user`, { error, user: req.user?.email });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error deleting user',
    });
  }
};


// Get user by ID
const getUserByIdAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.getUserById(id);
    logger.info(`Fetched user successfully`, { id, user: req.user?.email });
    return res.status(200).json({
      errCode: 0,
      data: user,
    });
  } catch (error) {
    logger.error(`Error fetching user`, { error, user: req.user?.email });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error fetching user',
    });
  }
};

// Update user
// Update user
const updateUserAPI = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const userData = req.body;

    // Ensure admin email matches
    if (userData.adminEmail !== req.user.email) {
      logger.error(`Admin email ${userData.adminEmail} does not match authenticated user ${req.user.email}`);
      return res.status(403).json({
        errCode: 1,
        message: 'Invalid admin email',
      });
    }

    const updatedUser = await userModel.updateUser(adminId, id, userData);
    logger.info(`User updated successfully`, { id, user: req.user.email });
    return res.status(200).json({
      errCode: 0,
      message: 'User updated successfully',
      data: {
        _id: updatedUser._id,
        fullname: updatedUser.fullname,
        dob: updatedUser.dob,
        phonenumber: updatedUser.phonenumber,
        email: updatedUser.email,
        roleid: updatedUser.roleid,
        status: updatedUser.status,
        issuerId: updatedUser.issuerId, // Include issuerId in response
      },
    });
  } catch (error) {
    logger.error(`Error updating user`, { error, user: req.user?.email });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error updating user',
    });
  }
};


export default {
  fetchUserProfile,
  changePassword,
  createUserAPI,
  getUsersAPI,
  deleteUserAPI,
  getUserByIdAPI,
  updateUserAPI
};