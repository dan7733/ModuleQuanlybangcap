import express from 'express';
import authMiddleware from '../controllers/authMiddleware';
import loginController from '../controllers/loginController';
import forgotPasswordController from '../controllers/forgotPasswordController';
import degreeController from '../controllers/degreeController';
import userController from '../controllers/userController';
const router = express.Router();

const initAPIRoute = (app) => {
  // Login and logout
  router.post('/login', loginController.userLoginAPI);
  router.get('/logout', authMiddleware.userMiddlewareAPI, loginController.userLogoutAPI);

  // Token refresh and account info
  router.get('/refresh-token', authMiddleware.refreshTokenAPI);
  router.get('/account', authMiddleware.userMiddlewareAPI, authMiddleware.getAccountAPI);

  // Google login
  router.post('/google', loginController.googleLoginAPI);

  // Password reset
  router.post('/forgot-password', forgotPasswordController.requestResetPasswordAPI);
  router.get('/reset-password/:token', forgotPasswordController.getResetPasswordAPI);
  router.post('/reset-password', forgotPasswordController.resetPasswordAPI);

  // Degree management
  // Lấy thông tin văn bằng theo ID
  router.get('/degree/:id', degreeController.getDegreeByIdAPI);

  // Lấy danh sách văn bằng theo bộ lọc
  router.get('/degrees', degreeController.getDegreesByFilterAPI);


  // lấy thông tin người dùng
  router.get('/users/profile', authMiddleware.userMiddlewareAPI, userController.fetchUserProfile);


  // Đổi mật khẩu
  router.post('/users/change-password', authMiddleware.userMiddlewareAPI, userController.changePassword);


  // Attach router to Express app
  return app.use('/api/v1', router);
};

export default initAPIRoute;