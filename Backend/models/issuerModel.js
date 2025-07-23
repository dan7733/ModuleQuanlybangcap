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

// Create issuer (for admin or certifier)
const createIssuer = async (userId, issuerData) => {
  try {
    // Check if user is certifier or admin (roleid = 1 or 3)
    const user = await mongoose.model('User').findById(userId).lean();
    if (!user || ![1, 3].includes(user.roleid)) {
      logger.error(`User ${userId} is not authorized to create issuer`);
      throw new Error('Only certifier or admin can create issuer');
    }

    // Validate input data
    const { name, address, contactEmail } = issuerData;
    if (!name) {
      throw new Error('Missing required issuer fields');
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

export { Issuer, createIssuer };
export default Issuer;