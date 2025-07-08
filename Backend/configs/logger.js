import { createLogger, format, transports } from 'winston';
// Import trình ghi log theo từng ngày (xoay vòng file log)
import DailyRotateFile from 'winston-daily-rotate-file';

// Định nghĩa định dạng log tùy chỉnh
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Thêm timestamp
  format.json(), // Chuyển log sang dạng JSON (hữu ích khi ghi file)
  format.printf(({ timestamp, level, message, ...metadata }) => {
    // Tuỳ chỉnh định dạng đầu ra cuối cùng của log
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
  })
);

// Tạo logger (bộ ghi log chính)
const logger = createLogger({
  level: 'info', // Mức log mặc định (ghi từ info trở lên)
  format: logFormat, // Định dạng được sử dụng
  transports: [
    // Ghi log ra console (màn hình)
    new transports.Console({
      format: format.combine(
        format.colorize(), // Màu hoá các mức độ log (info, error, ...)
        format.simple()    // Hiển thị đơn giản hơn trên console
      ),
    }),

    // Ghi log vào file, xoay vòng theo ngày
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log', // Tên file log chung
      datePattern: 'YYYY-MM-DD',              // Mỗi ngày tạo file mới
      zippedArchive: true,                    // Nén file cũ lại
      maxSize: '20m',                          // Kích thước tối đa mỗi file log
      maxFiles: '14d',                         // Lưu log tối đa 14 ngày
      level: 'info',                           // Ghi từ info trở lên (info, warn, error)
    }),

    // Ghi riêng các log lỗi vào file khác
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',       // Tên file log cho lỗi
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',                          // Chỉ ghi các log ở mức error
    }),
  ],
});

// Xuất logger để dùng ở các file khác
export default logger;
