import express from 'express';
import upload from '../configs/upload';
import authMiddleware from '../controllers/authMiddleware';
import loginController from '../controllers/loginController';
import forgotPasswordController from '../controllers/forgotPasswordController';
import degreeController from '../controllers/degreeController';
import userController from '../controllers/userController';
import degreetypeController from '../controllers/degreetypeController';
import issuerController from '../controllers/issuerController';
import logController from '../controllers/logController';
import cloudController from '../controllers/cloundController';
import verificationController from '../controllers/verificationController';
const router = express.Router();

const initAPIRoute = (app) => {



  // Verification routes
  router.get('/verification/by-issuer', authMiddleware.certifierMiddlewareAPI, verificationController.getDegreeTypesByIssuerAPI);
  router.get('/verification/export-excel', 
    authMiddleware.certifierMiddlewareAPI,
    verificationController.exportDegreesToExcel
  );
  router.get('/verification/list', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, verificationController.getListDegreesAPI);
  router.get('/verification/degrees/years', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, verificationController.getDistinctIssueYears);
  router.get('/verification/degree/:id', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, verificationController.getDegreeByIdAPI);
  router.put(
    '/verification/degree/:id',
    authMiddleware.userMiddlewareAPI,
    authMiddleware.certifierMiddlewareAPI,
    verificationController.updateDegreeAPI
  );
    router.get('/verification/degree/:id/verify-signature', 
    authMiddleware.userMiddlewareAPI, 
    verificationController.verifyDegreeSignatureAPI
  );

  // Login and logout
  router.post('/login', loginController.userLoginAPI);
  router.get('/logout', authMiddleware.userMiddlewareAPI, loginController.userLogoutAPI);

  // Token refresh and account info
  router.get('/refresh-token', authMiddleware.refreshTokenAPI);
  router.get('/account', authMiddleware.userMiddlewareAPI, authMiddleware.getAccountAPI);


  // cloud storage
    router.post(
  '/degree/:degreeId/upload-to-mega',
  authMiddleware.userMiddlewareAPI,
  authMiddleware.managerMiddlewareAPI,
  cloudController.uploadDegreeToMegaAPI
  );

  router.post(
    '/degree/:degreeId/sync-file',
    authMiddleware.userMiddlewareAPI,
    authMiddleware.managerMiddlewareAPI,
    cloudController.syncDegreeFileAPI
  );
  // tải lại local lên mega
  router.post('/degree/:id/reupload-file', authMiddleware.managerMiddlewareAPI, cloudController.reuploadDegreeFileAPI);

  router.put(
  '/degree/:id',
  authMiddleware.userMiddlewareAPI,
  authMiddleware.managerMiddlewareAPI,
  upload('degrees').single('fileAttachment'),
  degreeController.updateDegreeAPI
  );

  router.get('/degrees/export-excel', 
    authMiddleware.managerMiddlewareAPI,
    degreeController.exportDegreesToExcel
  );

  router.get('/degrees/years', authMiddleware.managerMiddlewareAPI, degreeController.getDistinctIssueYears);
 

  router.get('/public/degree-types/by-issuer', degreeController.getDegreeTypesByIssuerAPI); // API public lấy danh sách loại văn bằng theo issuerId
  router.get('/public/issuers', issuerController.getPublicIssuersAPI); // API public lấy danh sách đơn vị cấp

  // server log
  router.get('/logs/files', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, logController.getLogFilesAPI);
  router.get('/logs/:filename', authMiddleware.userMiddlewareAPI, authMiddleware.adminMiddlewareAPI, logController.getLogContentAPI);


  // Google login
  router.post('/google', loginController.googleLoginAPI);

  // Password reset
  router.post('/forgot-password', forgotPasswordController.requestResetPasswordAPI);
  router.get('/reset-password/:token', forgotPasswordController.getResetPasswordAPI);
  router.post('/reset-password', forgotPasswordController.resetPasswordAPI);

  // Degree management
  // Lấy thông tin văn bằng theo ID
  router.get('/public/degree/:id', degreeController.getDegreeByIdAPI);
  router.get('/degree/:id', authMiddleware.userMiddlewareAPI, authMiddleware.managerMiddlewareAPI, degreeController.getDegreeByIdAPI);
  router.get('/public/approveddegree/:id', degreeController.getApprovedDegreeByIdAPI);
  // Lấy danh sách văn bằng theo bộ lọc
  router.get('/public/degrees', degreeController.getDegreesByFilterAPI);


  // lấy thông tin người dùng
  router.get('/users/profile', authMiddleware.userMiddlewareAPI, userController.fetchUserProfile);


  // Đổi mật khẩu
  router.post('/users/change-password', authMiddleware.userMiddlewareAPI, userController.changePassword);

  // Cập nhật thông tin người dùng
  router.put(
    '/users/update-profile',
    authMiddleware.userMiddlewareAPI,
    upload('avatars').single('avatar'),
    userController.updateUserProfileAPI
  );
  
  //
  router.post('/degree-type', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, degreetypeController.createDegreeTypeAPI);
  router.put('/degree-type/:id', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, degreetypeController.updateDegreeTypeAPI);
  router.delete('/degree-type/:id', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, degreetypeController.deleteDegreeTypeAPI);
  router.get('/degree-type/:id', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, degreetypeController.getDegreeTypeByIdAPI);
  router.get('/degree-types/issuer', authMiddleware.userMiddlewareAPI, authMiddleware.certifierMiddlewareAPI, degreetypeController.getDegreeTypesByIssuerAPI);

  // Issuer management
  router.get('/issuers', authMiddleware.userMiddlewareAPI, authMiddleware.managerMiddlewareAPI, issuerController.getIssuersAPI);
  router.get('/issuers/list', authMiddleware.userMiddlewareAPI, authMiddleware.managerMiddlewareAPI, issuerController.getListIssuerAPI);
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