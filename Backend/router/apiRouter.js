import express from 'express';
import authMiddleware from '../controllers/authMiddleware'; // Import authController
import loginController from '../controllers/loginController'; // Import loginController

const router = express.Router();

const initAPIRoute = (app) => {
  // Đăng nhập và đăng xuất
  router.post('/login', loginController.userLoginAPI);
  router.get('/logout', authMiddleware.userMiddlewareAPI, loginController.userLogoutAPI);

  // Xác thực và làm mới token
  router.get('/refresh-token', authMiddleware.userMiddlewareAPI, authMiddleware.refreshTokenAPI);
  router.get('/account', authMiddleware.userMiddlewareAPI, authMiddleware.getAccountAPI);
  

  // // Lấy thông tin chi tiết người dùng (using email instead of username)
  // router.get('/detailuserbyemail/:email', authMiddleware.userMiddlewareAPI, authMiddleware.getdetailUserbyUsernameAPI);

  // Gắn router vào ứng dụng Express
  return app.use('/api/v1', router);
};

export default initAPIRoute;