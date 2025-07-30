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
    const uniqueName = `${uuidv4()}-${Date.now()}${ext}`;
    logger.info(`Generated temporary filename: ${uniqueName}`);
    cb(null, uniqueName);
  },
});

// Kiểm tra loại file dựa trên route
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const allowedExcelTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  const isExcelRoute = req.path.includes('/degree/import-excel');
  const isImageRoute = req.path.includes('/degree/extract');

  if (isExcelRoute && allowedExcelTypes.includes(file.mimetype)) {
    cb(null, true); // Chấp nhận file Excel
  } else if (isImageRoute && allowedImageTypes.includes(file.mimetype)) {
    cb(null, true); // Chấp nhận file ảnh
  } else if (isExcelRoute && allowedImageTypes.includes(file.mimetype)) {
    cb(null, true); // Chấp nhận ảnh cho route import-excel
  } else {
    logger.warn(`Invalid file type: ${file.mimetype} for route ${req.path}`);
    cb(new Error(`Only ${isExcelRoute ? 'Excel (.xlsx, .xls) or image' : 'image'} files are allowed.`), false);
  }
};

// Hàm khởi tạo multer với giới hạn dung lượng và kiểm tra file
const upload = (folder) => multer({
  storage: storage(folder),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn dung lượng: 5MB
});

export default upload;