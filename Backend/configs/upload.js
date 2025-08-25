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

// Kiểm tra loại file dựa trên route và fieldname
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  const allowedExcelTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];
  const allowedDegreeTypes = [...allowedImageTypes, 'application/pdf']; // Allow PDFs for degree routes

  const isExcelRoute = req.path.includes('/degree/import-excel');
  const isImageRoute = req.path.includes('/users/update-profile');
  const isDegreeRoute = req.path === '/degree' || req.path.match(/\/degree\/[0-9a-fA-F]{24}$/) || req.path.includes('/degree/extract');

  logger.info(`Processing file upload: MIME type=${file.mimetype}, Route=${req.path}, Field=${file.fieldname}`);

  if (isExcelRoute) {
    if (file.fieldname === 'file' && allowedExcelTypes.includes(file.mimetype)) {
      cb(null, true); // Accept Excel files for 'file' field
    } else if (file.fieldname === 'images' && allowedDegreeTypes.includes(file.mimetype)) {
      cb(null, true); // Accept images or PDFs for 'images' field
    } else {
      logger.warn(`Invalid file type: ${file.mimetype} for field ${file.fieldname} in route ${req.path}`);
      cb(
        new Error(
          `Only ${
            file.fieldname === 'file'
              ? 'Excel (.xlsx, .xls)'
              : 'image files (JPEG, PNG, GIF, WebP, BMP) or PDF'
          } are allowed for ${file.fieldname} field.`
        ),
        false
      );
    }
  } else if (isImageRoute && allowedImageTypes.includes(file.mimetype)) {
    cb(null, true); // Accept image files for update profile
  } else if (isDegreeRoute && allowedDegreeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept image or PDF files for degree creation/update/extract
  } else {
    logger.warn(`Invalid file type: ${file.mimetype} for route ${req.path}`);
    cb(
      new Error(
        `Only ${
          isDegreeRoute
            ? 'image files (JPEG, PNG, GIF, WebP, BMP) or PDF'
            : 'image files (JPEG, PNG, GIF, WebP, BMP)'
        } are allowed.`
      ),
      false
    );
  }
};

// Hàm khởi tạo multer với giới hạn dung lượng và kiểm tra file
const upload = (folder) => multer({
  storage: storage(folder),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn dung lượng: 5MB
});

export default upload;