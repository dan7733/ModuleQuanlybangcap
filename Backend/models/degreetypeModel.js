import mongoose from 'mongoose';
import logger from '../configs/logger.js';

// Define schema for degree type
const degreeTypeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Degree type title is required'],
      trim: true, // e.g., "Certificate A"
    },
    level: {
      type: String,
      required: [true, 'Degree level is required'],
      trim: true, // e.g., "Certificate", "Bachelor"
    },
    major: {
      type: String,
      required: [true, 'Major is required'],
      trim: true, // e.g., "Web Programming"
    },
    issuerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issuer',
      required: [true, 'Issuer ID is required'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Create model
const DegreeType = mongoose.model('DegreeType', degreeTypeSchema);

// Get degree type by ID
const getDegreeTypeById = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.error(`Invalid DegreeType ID: ${id}`);
      throw new Error('Invalid DegreeType ID');
    }

    const degreeType = await DegreeType.findById(id).lean();
    if (!degreeType) {
      logger.error(`DegreeType not found for ID: ${id}`);
      throw new Error('DegreeType not found');
    }

    logger.info(`Fetched DegreeType with ID: ${id}`, { degreeType });
    return degreeType;
  } catch (error) {
    logger.error(`Error fetching DegreeType with ID ${id}`, { error });
    throw error;
  }
};
// Create degree type (for certifier or admin)
const createDegreeType = async (userId, degreeTypeData) => {
  try {
    // Check if user is certifier (roleid = 1) or admin (roleid = 3)
    const user = await mongoose.model('User').findById(userId).lean();
    if (!user) {
      logger.error(`User not found with ID: ${userId}`);
      throw new Error('User not found');
    }
    if (![1, 3].includes(user.roleid)) {
      logger.error(`User ${userId} is not authorized to create degree type`);
      throw new Error('Only certifier or admin can create degree type');
    }

    // Validate input data
    const { title, level, major, issuerId } = degreeTypeData;
    if (!title || !level || !major || !issuerId) {
      logger.error(`Missing required degree type fields: ${JSON.stringify(degreeTypeData)}`);
      throw new Error('Missing required degree type fields');
    }

    // Validate issuerId
    if (!mongoose.Types.ObjectId.isValid(issuerId)) {
      logger.error(`Invalid Issuer ID: ${issuerId}`);
      throw new Error('Invalid Issuer ID');
    }

    // Create new degree type
    const newDegreeType = new DegreeType({
      title,
      level,
      major,
      issuerId,
    });

    await newDegreeType.save();
    logger.info(`Degree type created successfully by user ${userId}: ${newDegreeType._id}`);
    return newDegreeType;
  } catch (error){
    logger.error(`Error creating degree type by user ${userId}`, { error });
    throw error;
  }
};
// Update degree type (for certifier or admin)
const updateDegreeType = async (userId, degreeTypeId, degreeTypeData) => {
  try {
    // Check if user is certifier (roleid = 1) or admin (roleid = 3)
    const user = await mongoose.model('User').findById(userId).lean();
    if (!user) {
      logger.error(`User not found with ID: ${userId}`);
      throw new Error('User not found');
    }
    if (![1, 3].includes(user.roleid)) {
      logger.error(`User ${userId} is not authorized to update degree type`);
      throw new Error('Only certifier or admin can update degree type');
    }

    // Validate degreeTypeId
    if (!mongoose.Types.ObjectId.isValid(degreeTypeId)) {
      logger.error(`Invalid DegreeType ID: ${degreeTypeId}`);
      throw new Error('Invalid DegreeType ID');
    }

    // Check if degree type exists
    const degreeType = await DegreeType.findById(degreeTypeId);
    if (!degreeType) {
      logger.error(`DegreeType not found for ID: ${degreeTypeId}`);
      throw new Error('DegreeType not found');
    }

    // Check if issuerId matches user's issuerId
    if (user.issuerId.toString() !== degreeType.issuerId.toString()) {
      logger.error(`User ${userId} does not belong to issuer ${degreeType.issuerId}`);
      throw new Error('User does not belong to this issuer');
    }

    // Update fields
    const { title, level, major } = degreeTypeData;
    if (title) degreeType.title = title;
    if (level) degreeType.level = level;
    if (major) degreeType.major = major;

    await degreeType.save();
    logger.info(`Degree type updated successfully by user ${userId}: ${degreeTypeId}`);
    return degreeType;
  } catch (error) {
    logger.error(`Error updating degree type by user ${userId}`, { error });
    throw error;
  }
};

// Delete degree type (for admin only)
const deleteDegreeType = async (userId, degreeTypeId) => {
  try {
    // Check if user is admin (roleid = 3)
    const user = await mongoose.model('User').findById(userId).lean();
    if (!user) {
      logger.error(`User not found with ID: ${userId}`);
      throw new Error('User not found');
    }
    if (user.roleid !== 3) {
      logger.error(`User ${userId} is not authorized to delete degree type`);
      throw new Error('Only admin can delete degree type');
    }

    // Validate degreeTypeId
    if (!mongoose.Types.ObjectId.isValid(degreeTypeId)) {
      logger.error(`Invalid DegreeType ID: ${degreeTypeId}`);
      throw new Error('Invalid DegreeType ID');
    }

    // Check if degree type exists
    const degreeType = await DegreeType.findById(degreeTypeId);
    if (!degreeType) {
      logger.error(`DegreeType not found for ID: ${degreeTypeId}`);
      throw new Error('DegreeType not found');
    }

    // Check if degree type is used in any Degree
    const degreeInUse = await mongoose.model('Degree').findOne({ degreeTypeId });
    if (degreeInUse) {
      logger.error(`DegreeType ${degreeTypeId} is in use and cannot be deleted`);
      throw new Error('DegreeType is in use and cannot be deleted');
    }

    await DegreeType.deleteOne({ _id: degreeTypeId });
    logger.info(`Degree type deleted successfully by user ${userId}: ${degreeTypeId}`);
    return { success: true, message: 'Degree type deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting degree type by user ${userId}`, { error });
    throw error;
  }
};

const getDegreeTypesByIssuer = async (issuerId, page = 1, limit = 10, search = '', level = '', sort = 'desc') => {
  try {
    if (!mongoose.Types.ObjectId.isValid(issuerId)) {
      logger.error(`Invalid Issuer ID: ${issuerId}`);
      throw new Error('Invalid Issuer ID');
    }

    const skip = (page - 1) * limit;

    // Build query
    const query = { issuerId };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { major: { $regex: search, $options: 'i' } },
      ];
    }
    if (level) {
      query.level = level;
    }

    // Define sort order
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Fetch paginated, filtered, and sorted degree types
    const degreeTypes = await DegreeType.find(query)
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count total filtered degree types
    const total = await DegreeType.countDocuments(query);

    logger.info(`Fetched ${degreeTypes.length} degree types for issuer ${issuerId} (page: ${page}, limit: ${limit}, search: ${search}, level: ${level}, sort: ${sort})`);
    return {
      degreeTypes,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    logger.error(`Error fetching degree types for issuer ${issuerId}`, { error });
    throw error;
  }
};

export { DegreeType, createDegreeType, getDegreeTypeById, updateDegreeType, deleteDegreeType, getDegreeTypesByIssuer };
export default DegreeType;