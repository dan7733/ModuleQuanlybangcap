// Nhập thư viện mongoose để kết nối MongoDB
import mongoose from 'mongoose';

// Tự động tải biến môi trường từ file .env
import dotenv from 'dotenv/config';

// Lấy URI kết nối MongoDB từ biến môi trường
const mongoURI = process.env.MONGODB_URI;

// Kiểm tra nếu biến môi trường chưa được cấu hình thì báo lỗi
if (!mongoURI) {
  throw new Error('MONGODB_URI is not defined in .env file');
}

// Hàm kết nối đến MongoDB, có hỗ trợ tự động thử lại khi thất bại
const connectDB = async (retries = 5, delay = 5000) => {
  try {
    // Thực hiện kết nối MongoDB bằng mongoose
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');

    // Sự kiện khi MongoDB bị ngắt kết nối
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Sự kiện khi có lỗi trong kết nối MongoDB sau khi đã kết nối thành công
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err);
    });
  } catch (err) {
    // Xử lý khi kết nối thất bại
    console.error('MongoDB connection error:', err);

    // Nếu còn số lần thử lại thì thực hiện kết nối lại sau một khoảng thời gian
    if (retries > 0) {
      console.log(`Retrying connection in ${delay / 1000} seconds... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(retries - 1, delay);
    }

    // Nếu thử lại quá số lần cho phép thì ném lỗi
    throw new Error('Failed to connect to MongoDB after multiple attempts');
  }
};

// Xuất hàm connectDB để sử dụng ở các file khác (ví dụ app.js)
export default connectDB;
