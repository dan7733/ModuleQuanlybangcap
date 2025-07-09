import mongoose from 'mongoose';
import logger from '../configs/logger.js';

// Định nghĩa schema cho user
const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
    },
    phonenumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    organization: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    roleid: {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3], // 3 admin, 2 manager, 1 certifier, 0 user
    },
    googleid: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Tạo model từ schema
const User = mongoose.model('User', userSchema);

// Hàm lấy user theo email
const getUserByEmailAPI = async (email) => {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    logger.error(`Lỗi khi lấy user với email: ${email}`, { error });
    return null;
  }
};

// Hàm cập nhật googleId cho user
const updateGoogleId = async (userId, googleId) => {
  try {
    const user = await User.findByIdAndUpdate(userId, { googleid: googleId }, { new: true });
    if (!user) {
      throw new Error(`Không tìm thấy user với ID: ${userId}`);
    }
    return user;
  } catch (error) {
    logger.error(`Lỗi khi cập nhật googleId cho user: ${userId}`, { error });
    throw error;
  }
};

export { User };
export default {
  User,
  getUserByEmailAPI,
  updateGoogleId,
};