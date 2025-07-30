import mongoose from 'mongoose';
import logger from '../configs/logger.js';

// Define schema for issuer
const issuerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Issuer name is required'],
      trim: true, // e.g., "XYZ University"
    },
    address: {
      type: String,
      trim: true,
      default: null, // Optional issuer address
    },
    contactEmail: {
      type: String,
      trim: true,
      default: null, // Optional contact email
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Create model
const Issuer = mongoose.model('Issuer', issuerSchema);

// Create issuer
const createIssuer = async (userId, issuerData) => {
  try {
    // Validate input data
    const { name, address, contactEmail } = issuerData;
    if (!name) {
      logger.error('Missing required issuer fields', { issuerData });
      throw new Error('Missing required issuer fields');
    }

    // Check for duplicate issuer name
    const existingIssuer = await Issuer.findOne({ name }).lean();
    if (existingIssuer) {
      logger.error(`Issuer name already exists: ${name}`);
      throw new Error('Issuer name already exists');
    }

    // Create new issuer
    const newIssuer = new Issuer({
      name,
      address: address || null,
      contactEmail: contactEmail || null,
    });

    await newIssuer.save();
    logger.info(`Issuer created successfully by user ${userId}: ${newIssuer._id}`);
    return newIssuer;
  } catch (error) {
    logger.error(`Error creating issuer by user ${userId}`, { error });
    throw error;
  }
};

// Get all issuers
const getIssuers = async () => {
  try {
    const issuers = await Issuer.find().lean();
    logger.info(`Fetched ${issuers.length} issuers`);
    return issuers;
  } catch (error) {
    logger.error(`Error fetching issuers`, { error });
    throw error;
  }
};

// Delete issuer
const deleteIssuer = async (userId, issuerId) => {
  try {
    // Validate issuerId
    if (!mongoose.Types.ObjectId.isValid(issuerId)) {
      logger.error(`Invalid Issuer ID: ${issuerId}`);
      throw new Error('Invalid Issuer ID');
    }

    // Check if issuer exists
    const issuer = await Issuer.findById(issuerId).lean();
    if (!issuer) {
      logger.error(`Issuer not found for ID: ${issuerId}`);
      throw new Error('Issuer not found');
    }

    // Check if issuer is linked to any users
    const linkedUsers = await mongoose.model('User').find({ issuerId }).lean();
    if (linkedUsers.length > 0) {
      logger.error(`Cannot delete issuer ${issuerId} as it is linked to ${linkedUsers.length} users`);
      throw new Error('Cannot delete issuer as it is linked to existing users');
    }

    // Delete issuer
    await Issuer.deleteOne({ _id: issuerId });
    logger.info(`Issuer deleted successfully by user ${userId}: ${issuerId}`);
    return { success: true, message: 'Issuer deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting issuer by user ${userId}`, { error });
    throw error;
  }
};

// Get issuers with pagination, filtering, and sorting
const getListIssuer = async (page = 1, limit = 10, search = '', sort = 'desc') => {
  try {
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } },
      ];
    }

    // Define sort order
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Fetch paginated, filtered, and sorted issuers
    const issuers = await Issuer.find(query)
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count total filtered issuers
    const total = await Issuer.countDocuments(query);

    logger.info(`Fetched ${issuers.length} issuers (page: ${page}, limit: ${limit}, search: ${search}, sort: ${sort})`);
    return {
      issuers,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    logger.error(`Error fetching issuers`, { error });
    throw error;
  }
};

// Update issuer
const updateIssuer = async (userId, issuerId, issuerData) => {
  try {
    // Validate issuerId
    if (!mongoose.Types.ObjectId.isValid(issuerId)) {
      logger.error(`Invalid Issuer ID: ${issuerId}`);
      throw new Error('Invalid Issuer ID');
    }

    // Check if issuer exists
    const issuer = await Issuer.findById(issuerId);
    if (!issuer) {
      logger.error(`Issuer not found for ID: ${issuerId}`);
      throw new Error('Issuer not found');
    }

    // Validate input data
    const { name, address, contactEmail } = issuerData;
    if (!name) {
      logger.error('Missing required issuer fields', { issuerData });
      throw new Error('Missing required issuer fields');
    }

    // Check for duplicate issuer name (excluding current issuer)
    if (name !== issuer.name) {
      const existingIssuer = await Issuer.findOne({ name }).lean();
      if (existingIssuer) {
        logger.error(`Issuer name already exists: ${name}`);
        throw new Error('Issuer name already exists');
      }
    }

    // Update fields
    issuer.name = name;
    issuer.address = address || null;
    issuer.contactEmail = contactEmail || null;

    await issuer.save();
    logger.info(`Issuer updated successfully by user ${userId}: ${issuerId}`);
    return issuer;
  } catch (error) {
    logger.error(`Error updating issuer by user ${userId}`, { error });
    throw error;
  }
};

// Get issuer by ID
const getIssuerById = async (issuerId) => {
  try {
    // Validate issuerId
    if (!mongoose.Types.ObjectId.isValid(issuerId)) {
      logger.error(`Invalid Issuer ID: ${issuerId}`);
      throw new Error('Invalid Issuer ID');
    }

    // Fetch issuer
    const issuer = await Issuer.findById(issuerId).lean();
    if (!issuer) {
      logger.error(`Issuer not found for ID: ${issuerId}`);
      throw new Error('Issuer not found');
    }

    logger.info(`Fetched issuer by ID: ${issuerId}`);
    return issuer;
  } catch (error) {
    logger.error(`Error fetching issuer by ID: ${issuerId}`, { error });
    throw error;
  }
};

export default { Issuer, createIssuer, getIssuers, deleteIssuer, getListIssuer, updateIssuer, getIssuerById };
export { Issuer };