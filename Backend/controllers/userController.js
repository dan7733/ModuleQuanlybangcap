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

export default {
  fetchUserProfile,
  changePassword
};