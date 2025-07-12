import express from 'express';
import authMiddleware from '../controllers/authMiddleware';
import loginController from '../controllers/loginController';
import forgotPasswordController from '../controllers/forgotPasswordController';
const router = express.Router();

const initAPIRoute = (app) => {
  // Login and logout
  router.post('/login', loginController.userLoginAPI);
  router.get('/logout', authMiddleware.userMiddlewareAPI, loginController.userLogoutAPI);

  // Token refresh and account info
  router.get('/refresh-token', authMiddleware.userMiddlewareAPI, authMiddleware.refreshTokenAPI);
  router.get('/account', authMiddleware.userMiddlewareAPI, authMiddleware.getAccountAPI);

  // Google login
  router.post('/google', loginController.googleLoginAPI);

  // Password reset
  router.post('/forgot-password', forgotPasswordController.requestResetPasswordAPI);
  router.get('/reset-password/:token', forgotPasswordController.getResetPasswordAPI);
  router.post('/reset-password', forgotPasswordController.resetPasswordAPI);

  // Attach router to Express app
  return app.use('/api/v1', router);
};

export default initAPIRoute;