import mongoose from 'mongoose';
import logger from '../configs/logger.js';
import { getDegreeTypeById } from './degreetypeModel.js';

// Định nghĩa schema cho văn bằng (degree)
const degreeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: false, // Made optional since we prefer DegreeType data
      trim: true,
    },
    level: {
      type: String,
      required: false, // Made optional since we prefer DegreeType data
      trim: true,
    },
    major: {
      type: String,
      required: false, // Made optional since we prefer DegreeType data
      trim: true,
    },
    degreeTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DegreeType',
      required: [true, 'Degree type ID is required'],
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
    timestamps: true,
    versionKey: false,
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

    // Fetch degree type data
    try {
      const degreeType = await getDegreeTypeById(degree.degreeTypeId);
      if (degreeType) {
        // Merge degree and degree type data, prioritizing DegreeType fields
        const enrichedDegree = {
          ...degree,
          title: degreeType.title || degree.title || 'N/A',
          level: degreeType.level || degree.level || 'N/A',
          major: degreeType.major || degree.major || 'N/A',
        };
        logger.info(`Fetched approved degree with id: ${id}`, { degree: enrichedDegree });
        return enrichedDegree;
      }
    } catch (error) {
      logger.warn(`Degree type not found for degree id: ${id}, using fallback data`, { error });
    }

    // Fallback if degreeType is not found
    const fallbackDegree = {
      ...degree,
      title: degree.title || 'N/A',
      level: degree.level || 'N/A',
      major: degree.major || 'N/A',
    };
    logger.info(`Fetched approved degree with id: ${id} (fallback)`, { degree: fallbackDegree });
    return fallbackDegree;
  } catch (error) {
    logger.error(`Error fetching approved degree with id: ${id}`, { error });
    return null;
  }
};

// Hàm lấy tất cả văn bằng đã duyệt
const getAllApprovedDegrees = async () => {
  try {
    const degrees = await Degree.find({ status: 'Approved' }).lean();
    if (!degrees || degrees.length === 0) {
      logger.info('No approved degrees found');
      return [];
    }

    // Enrich degrees with degree type data
    const enrichedDegrees = await Promise.all(
      degrees.map(async (degree) => {
        try {
          const degreeType = await getDegreeTypeById(degree.degreeTypeId);
          return {
            ...degree,
            title: degreeType?.title || degree.title || 'N/A',
            level: degreeType?.level || degree.level || 'N/A',
            major: degreeType?.major || degree.major || 'N/A',
          };
        } catch (error) {
          logger.warn(`Degree type not found for degree id: ${degree._id}, using fallback data`, { error });
          return {
            ...degree,
            title: degree.title || 'N/A',
            level: degree.level || 'N/A',
            major: degree.major || 'N/A',
          };
        }
      })
    );

    logger.info(`Fetched ${enrichedDegrees.length} approved degrees`);
    return enrichedDegrees;
  } catch (error) {
    logger.error('Error fetching all approved degrees', { error });
    return [];
  }
};

// Hàm lấy văn bằng đã duyệt theo bộ lọc
const getApprovedDegreesByFilter = async (query) => {
  try {
    const degrees = await Degree.find(query).lean();
    if (!degrees || degrees.length === 0) {
      logger.info('No approved degrees found with provided filters', { query });
      return [];
    }

    // Enrich degrees with degree type data
    const enrichedDegrees = await Promise.all(
      degrees.map(async (degree) => {
        try {
          const degreeType = await getDegreeTypeById(degree.degreeTypeId);
          return {
            ...degree,
            title: degreeType?.title || degree.title || 'N/A',
            level: degreeType?.level || degree.level || 'N/A',
            major: degreeType?.major || degree.major || 'N/A',
          };
        } catch (error) {
          logger.warn(`Degree type not found for degree id: ${degree._id}, using fallback data`, { error });
          return {
            ...degree,
            title: degree.title || 'N/A',
            level: degree.level || 'N/A',
            major: degree.major || 'N/A',
          };
        }
      })
    );

    logger.info(`Fetched ${enrichedDegrees.length} approved degrees with filters`, { query });
    return enrichedDegrees;
  } catch (error) {
    logger.error('Error fetching approved degrees by filter', { error, query });
    return [];
  }
};

export { getApprovedDegreeById, getAllApprovedDegrees, getApprovedDegreesByFilter, Degree };
export default Degree;