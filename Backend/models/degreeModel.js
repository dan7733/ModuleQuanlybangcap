import mongoose from 'mongoose';
import logger from '../configs/logger.js';

// Định nghĩa schema cho văn bằng (degree)
const degreeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Degree title is required'],
      trim: true,
    },
    level: {
      type: String,
      required: [true, 'Degree level is required'],
      trim: true,
    },
    major: {
      type: String,
      required: [true, 'Major is required'],
      trim: true,
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
    },
    fileAttachment: {
      type: String,
      default: null,
      trim: true,
    },
    registryNumber: {
      type: String,
      required: [true, 'Registry number is required'],
      unique: true,
      trim: true,
    },
    issuerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Issuer ID is required'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Pending', 'Rejected', 'Approved'],
      default: 'Pending',
      trim: true,
    },
  },
  {
    timestamps: true,     // Tự tạo createdAt và updatedAt
    versionKey: false,    // Tắt __v
  }
);

// Tạo model
const Degree = mongoose.model('Degree', degreeSchema);

// Hàm lấy văn bằng đã duyệt theo ID
const getApprovedDegreeById = async (id) => {
  try {
    if (!mongoose.isValidObjectId(id)) {
      logger?.error(`Invalid ObjectId: ${id}`);
      return null;
    }

    const degree = await Degree.findOne({ _id: id, status: 'Approved' }).lean();
    if (!degree) {
      logger.error(`Approved degree not found with id: ${id}`);
      return null;
    }

    return degree;
  } catch (error) {
    logger.error(`Error fetching approved degree with id: ${id}`, { error });
    return null;
  }
};

// Hàm lấy tất cả văn bằng đã duyệt
const getAllApprovedDegrees = async () => {
  try {
    const degrees = await Degree.find({ status: 'Approved' }).lean();
    return degrees;
  } catch (error) {
    logger.error('Error fetching all approved degrees', { error });
    return [];
  }
};

export { getApprovedDegreeById, getAllApprovedDegrees, Degree };
export default Degree;