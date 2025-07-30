import express from 'express';
import upload from '../configs/upload';
import authMiddleware from '../controllers/authMiddleware';
import loginController from '../controllers/loginController';
import forgotPasswordController from '../controllers/forgotPasswordController';
import degreeController from '../controllers/degreeController';
import userController from '../controllers/userController';
import degreetypeController from '../controllers/degreetypeController';
import issuerController from '../controllers/issuerController';
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


  //
  router.post('/degree-type', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, degreetypeController.createDegreeTypeAPI);
  router.put('/degree-type/:id', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, degreetypeController.updateDegreeTypeAPI);
  router.delete('/degree-type/:id', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, degreetypeController.deleteDegreeTypeAPI);
  router.get('/degree-type/:id', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, degreetypeController.getDegreeTypeByIdAPI);
  router.get('/degree-types/issuer', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, degreetypeController.getDegreeTypesByIssuerAPI);

  // Issuer management
  router.get('/issuers', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, issuerController.getIssuersAPI);
  router.get('/issuers/list', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, issuerController.getListIssuerAPI);
  router.post('/issuer', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, issuerController.createIssuerAPI);
  router.delete('/issuer/:id', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, issuerController.deleteIssuerAPI);
  router.put('/issuer/:id', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, issuerController.updateIssuerAPI);

  // User management
  router.post('/user', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, userController.createUserAPI);
  router.get('/users', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, userController.getUsersAPI);
  router.delete('/user/:id', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, userController.deleteUserAPI);
  router.get('/user/:id', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, userController.getUserByIdAPI); // New GET route
  router.put('/user/:id', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, userController.updateUserAPI)
  router.get('/issuer/:id', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, issuerController.getIssuerByIdAPI);

  // New routes for degree management
  router.post('/degree', authMiddleware.userMiddlewareAPI, authMiddleware.managerMiddlewareAPI, upload('degrees').single('fileAttachment'), degreeController.createDegreeAPI);
  router.get('/degree-types/by-issuer', authMiddleware.userMiddlewareAPI, degreeController.getDegreeTypesByIssuerAPI);
  router.post('/degree/extract', authMiddleware.userMiddlewareAPI, authMiddleware.userMiddlewareAPI, authMiddleware.managerMiddlewareAPI, upload('degrees').single('image'),degreeController.extractDegreeFromImageAPI);
  router.post(
    '/degree/import-excel',
    authMiddleware.userMiddlewareAPI,
    authMiddleware.managerMiddlewareAPI,
    upload('degrees').fields([{ name: 'file', maxCount: 1 }, { name: 'images', maxCount: 100 }]), // Sử dụng fields với maxCount cho images
    degreeController.importDegreesFromExcel
  );
  router.get('/degrees/list', authMiddleware.userMiddlewareAPI, authMiddleware.managerMiddlewareAPI, degreeController.getListDegreesAPI); // Thêm API danh sách
  router.delete('/degree/:id', authMiddleware.userMiddlewareAPI, authMiddleware.managerMiddlewareAPI, degreeController.deleteDegreeAPI); // Thêm API xóa

  // router.patch('/updateuser', userMiddlewareController.userMiddlewareAPI, upload('useravatar').single('avatar'), userMiddlewareController.updateUserAPI)
  // Attach router to Express app
  return app.use('/api/v1', router);
};

export default initAPIRoute;