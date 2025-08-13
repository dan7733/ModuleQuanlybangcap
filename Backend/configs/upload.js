import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

// Cấu hình lưu file linh hoạt
const storage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(`images/${folder}`);
    cb(null, uploadPath); // Lưu vào folder tương ứng
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}-${Date.now()}${ext}`; // Unique filename
    logger.info(`Generated temporary filename: ${uniqueName}`);
    cb(null, uniqueName); // Only the filename is passed to multer
  },
});

// Kiểm tra loại file dựa trên route
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  const allowedExcelTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  const isExcelRoute = req.path.includes('/degree/import-excel');
  const isImageRoute = req.path.includes('/degree/extract') || req.path.match(/\/degree\/[0-9a-fA-F]{24}$/);
  const isProfileRoute = req.path.includes('/users/update-profile'); // Add profile route check

  logger.info(`Processing file upload: MIME type=${file.mimetype}, Route=${req.path}`);

  if (isExcelRoute && (allowedExcelTypes.includes(file.mimetype) || allowedImageTypes.includes(file.mimetype))) {
    cb(null, true); // Accept Excel or image files for import-excel
  } else if ((isImageRoute || isProfileRoute) && allowedImageTypes.includes(file.mimetype)) {
    cb(null, true); // Accept image files for extract, update degree, and update profile
  } else {
    logger.warn(`Invalid file type: ${file.mimetype} for route ${req.path}`);
    cb(new Error(`Only ${isExcelRoute ? 'Excel (.xlsx, .xls) or image files' : 'image files (JPEG, PNG, GIF, WebP, BMP)'} are allowed.`), false);
  }
};

// Hàm khởi tạo multer với giới hạn dung lượng và kiểm tra file
const upload = (folder) => multer({
  storage: storage(folder),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn dung lượng: 5MB
});

export default upload;