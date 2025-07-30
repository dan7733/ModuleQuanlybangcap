import mongoose from 'mongoose';
import logger from '../configs/logger.js';
import { getDegreeTypeById } from './degreetypeModel.js';

const degreeSchema = new mongoose.Schema(
  {
    recipientName: { // tên người nhận
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
    },
    recipientDob: { // ngày sinh
      type: Date,
      required: [true, 'Recipient date of birth is required'],
    },
    placeOfBirth: { // nơi sinh
      type: String,
      required: false,
      trim: true,
    },
    level: { // xếp loại: giỏi, khá...
      type: String,
      required: false,
      trim: true,
    },
    degreeTypeId: { // loại văn bằng
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DegreeType',
      required: [true, 'Degree type ID is required'],
    },
    issueDate: { // ngày cấp
      type: Date,
      required: [true, 'Issue date is required'],
    },
    serialNumber: { // số hiệu văn bằng
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
    },
    registryNumber: { // số vào sổ cấp chứng chỉ
      type: String,
      required: [true, 'Registry number is required'],
      unique: true,
      trim: true,
    },
    placeOfIssue: { // nơi cấp văn bằng
      type: String,
      required: false,
      trim: true,
    },
    signer: { // người ký văn bằng
      type: String,
      required: false,
      trim: true,
    },
    fileAttachment: { // tên file upload lên hệ thống
      type: String,
      default: null,
      trim: true,
    },
    cloudFile: { // link lưu trữ trên cloud nếu có
      type: String,
      default: null,
      trim: true,
    },
    issuerId: { // người cấp (liên kết với bảng User)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Issuer ID is required'],
    },
    status: { // trạng thái duyệt
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

const Degree = mongoose.model('Degree', degreeSchema);

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

    try {
      const degreeType = await getDegreeTypeById(degree.degreeTypeId);
      if (degreeType) {
        const enrichedDegree = {
          ...degree,
          level: degreeType.level || degree.level || 'N/A',
        };
        logger.info(`Fetched approved degree with id: ${id}`, { degree: enrichedDegree });
        return enrichedDegree;
      }
    } catch (error) {
      logger.warn(`Degree type not found for degree id: ${id}, using fallback data`, { error });
    }

    const fallbackDegree = {
      ...degree,
      level: degree.level || 'N/A',
    };
    logger.info(`Fetched approved degree with id: ${id} (fallback)`, { degree: fallbackDegree });
    return fallbackDegree;
  } catch (error) {
    logger.error(`Error fetching approved degree with id: ${id}`, { error });
    return null;
  }
};

const getAllApprovedDegrees = async () => {
  try {
    const degrees = await Degree.find({ status: 'Approved' }).lean();
    if (!degrees || degrees.length === 0) {
      logger.info('No approved degrees found');
      return [];
    }

    const enrichedDegrees = await Promise.all(
      degrees.map(async (degree) => {
        try {
          const degreeType = await getDegreeTypeById(degree.degreeTypeId);
          return {
            ...degree,
            level: degreeType?.level || degree.level || 'N/A',
          };
        } catch (error) {
          logger.warn(`Degree type not found for degree id: ${degree._id}, using fallback data`, { error });
          return {
            ...degree,
            level: degree.level || 'N/A',
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

const getApprovedDegreesByFilter = async (query) => {
  try {
    const degrees = await Degree.find(query).lean();
    if (!degrees || degrees.length === 0) {
      logger.info('No approved degrees found with provided filters', { query });
      return [];
    }

    const enrichedDegrees = await Promise.all(
      degrees.map(async (degree) => {
        try {
          const degreeType = await getDegreeTypeById(degree.degreeTypeId);
          return {
            ...degree,
            level: degreeType?.level || degree.level || 'N/A',
          };
        } catch (error) {
          logger.warn(`Degree type not found for degree id: ${degree._id}, using fallback data`, { error });
          return {
            ...degree,
            level: degree.level || 'N/A',
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

const createDegree = async (degreeData, userId, selectedIssuerId) => {
    try {
        const {
            recipientName,
            recipientDob,
            placeOfBirth,
            level,
            degreeTypeId,
            issueDate,
            serialNumber,
            registryNumber,
            placeOfIssue,
            signer,
            fileAttachment,
            cloudFile,
        } = degreeData;

        if (
            !recipientName ||
            !recipientDob ||
            !degreeTypeId ||
            !issueDate ||
            !serialNumber ||
            !registryNumber ||
            !selectedIssuerId
        ) {
            logger.error('Missing required degree fields or issuerId', { degreeData, selectedIssuerId });
            throw new Error('Missing required degree fields or issuerId');
        }

        if (!mongoose.isValidObjectId(degreeTypeId)) {
            logger.error(`Invalid DegreeType ID: ${degreeTypeId}`);
            throw new Error('Invalid DegreeType ID');
        }

        if (!mongoose.isValidObjectId(selectedIssuerId)) {
            logger.error(`Invalid Issuer ID: ${selectedIssuerId}`);
            throw new Error('Invalid Issuer ID');
        }

        if (!mongoose.isValidObjectId(userId)) {
            logger.error(`Invalid User ID: ${userId}`);
            throw new Error('Invalid User ID');
        }

        const degreeType = await getDegreeTypeById(degreeTypeId);
        if (!degreeType) {
            logger.error(`DegreeType not found for ID: ${degreeTypeId}`);
            throw new Error('DegreeType not found');
        }

        if (degreeType.issuerId.toString() !== selectedIssuerId.toString()) {
            logger.error(`DegreeType ${degreeTypeId} does not belong to issuer ${selectedIssuerId}`);
            throw new Error('Selected DegreeType does not belong to the chosen issuer');
        }

        const existingDegree = await Degree.findOne({
            $or: [{ serialNumber }, { registryNumber }],
        }).lean();
        if (existingDegree) {
            logger.error(`Serial number or registry number already exists: ${serialNumber}, ${registryNumber}`);
            throw new Error('Serial number or registry number already exists');
        }

        const newDegree = new Degree({
            recipientName,
            recipientDob,
            placeOfBirth: placeOfBirth || '',
            level: level || degreeType.level || '',
            degreeTypeId,
            issueDate,
            serialNumber,
            registryNumber,
            placeOfIssue: placeOfIssue || '',
            signer: signer || '',
            fileAttachment: fileAttachment || null,
            cloudFile: cloudFile || null,
            issuerId: userId,
            status: 'Pending',
        });

        await newDegree.save();
        logger.info(`Degree created successfully: ${newDegree._id}`);
        return newDegree;
    } catch (error) {
        logger.error(`Error creating degree`, { error, degreeData });
        throw error;
    }
};

const getListDegrees = async (userId, page = 1, limit = 10, search = '', status = '', issuerId = '', sort = 'desc') => {
  try {
    const user = await mongoose.model('User').findById(userId).lean();
    if (!user) {
      logger.error(`User not found with id: ${userId}`);
      throw new Error('User not found');
    }

    const query = {};
    if (search) {
      query.$or = [
        { recipientName: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { registryNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;

    // Role-based filtering
    if (user.roleid === 3) { // Admin (roleid 3)
      if (issuerId && mongoose.isValidObjectId(issuerId)) query.issuerId = issuerId;
    } else if (user.roleid === 2) { // Manager (roleid 2, assuming manager role)
      if (!user.issuerId) {
        logger.error(`Manager ${userId} has no associated issuerId`);
        throw new Error('Manager has no associated issuerId');
      }
      query.issuerId = user.issuerId; // Filter by manager's issuerId
    } else {
      logger.error(`User ${userId} does not have permission to view degrees`);
      throw new Error('Permission denied');
    }

    const sortOption = sort === 'asc' ? { issueDate: 1 } : { issueDate: -1 };
    const skip = (page - 1) * limit;

    const [degrees, total] = await Promise.all([
      Degree.find(query)
        .populate('degreeTypeId', 'title level')
        .populate('issuerId', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Degree.countDocuments(query),
    ]);

    const enrichedDegrees = degrees.map((degree) => ({
      ...degree,
      level: degree.degreeTypeId?.level || degree.level || 'N/A',
      degreeType: degree.degreeTypeId,
      issuer: degree.issuerId,
    }));

    return {
      degrees: enrichedDegrees,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    logger.error('Error fetching degrees', { error, query });
    throw error;
  }
};

const deleteDegree = async (degreeId, userId) => {
  try {
    if (!mongoose.isValidObjectId(degreeId)) {
      logger.error(`Invalid Degree ID: ${degreeId}`);
      throw new Error('Invalid Degree ID');
    }
    if (!mongoose.isValidObjectId(userId)) {
      logger.error(`Invalid User ID: ${userId}`);
      throw new Error('Invalid User ID');
    }
    const degree = await Degree.findById(degreeId).lean();
    if (!degree) {
      logger.error(`Degree not found with id: ${degreeId}`);
      throw new Error('Degree not found');
    }
    const user = await mongoose.model('User').findById(userId).lean();
    if (!user || (user.roleid !== 3 && (user.roleid === 2 && degree.issuerId.toString() !== user.issuerId.toString()))) {
      logger.error(`User ${userId} does not have permission to delete degree`);
      throw new Error('Permission denied');
    }
    await Degree.deleteOne({ _id: degreeId });
    logger.info(`Degree deleted successfully: ${degreeId}`);
    return { message: 'Degree deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting degree with id: ${degreeId}`, { error });
    throw error;
  }
};

export { 
  getApprovedDegreeById, 
  getAllApprovedDegrees, 
  getApprovedDegreesByFilter, 
  Degree, 
  createDegree, 
  getListDegrees, 
  deleteDegree };
export default Degree;