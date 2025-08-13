import mongoose from 'mongoose';
import logger from '../configs/logger.js';
import { getDegreeTypeById } from './degreetypeModel.js';
import NodeRSA from 'node-rsa';

// Tạo cặp khóa RSA cho hệ thống (có thể lưu vào file hoặc DB trong thực tế)
const key = new NodeRSA({ b: 2048 }); // 2048-bit RSA key
const publicKey = key.exportKey('public');
const privateKey = key.exportKey('private');

const degreeSchema = new mongoose.Schema(
  {
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
    },
    recipientDob: {
      type: Date,
      required: [true, 'Recipient date of birth is required'],
    },
    placeOfBirth: {
      type: String,
      required: false,
      trim: true,
    },
    level: {
      type: String,
      required: false,
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
    registryNumber: {
      type: String,
      required: [true, 'Registry number is required'],
      unique: true,
      trim: true,
    },
    placeOfIssue: {
      type: String,
      required: false,
      trim: true,
    },
    signer: {
      type: String,
      required: false,
      trim: true,
    },
    fileAttachment: {
      type: String,
      default: null,
      trim: true,
    },
    cloudFile: {
      type: String,
      default: null,
      trim: true,
    },
    issuerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issuer',
      required: [true, 'Issuer ID is required'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Pending', 'Rejected', 'Approved'],
      default: 'Pending',
      trim: true,
    },
    digitalSignature: {
      type: String,
      default: null,
      trim: true,
    },
    signerEmail: {
      type: String,
      default: null,
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

    const degree = await Degree.findOne({ _id: id, status: 'Approved' })
      .populate('degreeTypeId', 'title level major')
      .populate('issuerId', 'name')
      .lean();

    if (!degree) {
      logger.error(`Approved degree not found with id: ${id}`);
      return null;
    }

    const enrichedDegree = {
      ...degree,
      degreeTypeName: degree.degreeTypeId?.title || 'N/A',
      major: degree.degreeTypeId?.major || degree.major || 'N/A',
      issuerName: degree.issuerId?.name || 'N/A',
      level: degree.degreeTypeId?.level || degree.level || 'N/A',
    };

    logger.info(`Fetched approved degree with id: ${id}`, { degree: enrichedDegree });
    return enrichedDegree;
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
    const degrees = await Degree.find(query)
      .populate('degreeTypeId', 'title level major')
      .populate('issuerId', 'name')
      .lean();

    if (!degrees || degrees.length === 0) {
      logger.info('No approved degrees found with provided filters', { query });
      return [];
    }

    const enrichedDegrees = degrees.map((degree) => ({
      ...degree,
      degreeTypeName: degree.degreeTypeId?.title || 'N/A',
      major: degree.degreeTypeId?.major || degree.major || 'N/A',
      issuerName: degree.issuerId?.name || 'N/A',
      level: degree.degreeTypeId?.level || degree.level || 'N/A',
    }));

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
      issuerId: selectedIssuerId, // Use selectedIssuerId instead of userId
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

const getListDegrees = async (userId, page = 1, limit = 10, search = '', status = '', issuerId = '', degreeTypeId = '', issueYear = '', sort = 'desc') => {
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
    if (degreeTypeId && mongoose.isValidObjectId(degreeTypeId)) query.degreeTypeId = degreeTypeId;
    if (issueYear) {
      const year = parseInt(issueYear);
      if (!isNaN(year)) {
        query.issueDate = {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31, 23, 59, 59, 999),
        };
      }
    }
    if (issuerId && mongoose.isValidObjectId(issuerId)) query.issuerId = issuerId;

    const sortOption = sort === 'asc' ? { issueDate: 1 } : { issueDate: -1 };
    const skip = limit > 0 ? (page - 1) * limit : 0;

    const [degrees, total] = await Promise.all([
      Degree.find(query)
        .populate('degreeTypeId', 'title level')
        .populate('issuerId', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(limit > 0 ? limit : undefined)
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
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
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

    // Delete the degree from the database
    await Degree.deleteOne({ _id: degreeId });
    logger.info(`Degree deleted successfully: ${degreeId}`);

    // Return file references for controller to handle deletion
    return {
      message: 'Degree deleted successfully',
      fileAttachment: degree.fileAttachment,
      cloudFile: degree.cloudFile
    };
  } catch (error) {
    logger.error(`Error deleting degree with id: ${degreeId}`, { error });
    throw error;
  }
};


const updateDegree = async (degreeId, degreeData, userId, selectedIssuerId) => {
  try {
    // Validate degreeId
    if (!mongoose.isValidObjectId(degreeId)) {
      logger.error(`Invalid Degree ID: ${degreeId}`);
      throw new Error('Invalid Degree ID');
    }

    // Validate userId
    if (!mongoose.isValidObjectId(userId)) {
      logger.error(`Invalid User ID: ${userId}`);
      throw new Error('Invalid User ID');
    }

    // Validate issuerId
    if (!mongoose.isValidObjectId(selectedIssuerId)) {
      logger.error(`Invalid Issuer ID: ${selectedIssuerId}`);
      throw new Error('Invalid Issuer ID');
    }

    // Check if degree exists
    const degree = await Degree.findById(degreeId);
    if (!degree) {
      logger.error(`Degree not found with id: ${degreeId}`);
      throw new Error('Degree not found');
    }

    // Fetch user to check permissions
    const user = await mongoose.model('User').findById(userId).lean();
    if (!user) {
      logger.error(`User not found with id: ${userId}`);
      throw new Error('User not found');
    }

    // Role-based permission check
    if (user.roleid !== 3 && (user.roleid === 2 && degree.issuerId.toString() !== user.issuerId.toString())) {
      logger.error(`User ${userId} does not have permission to update degree ${degreeId}`);
      throw new Error('Permission denied');
    }

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
      issuerId,
    } = degreeData;

    // Validate required fields
    if (
      !recipientName ||
      !recipientDob ||
      !degreeTypeId ||
      !issueDate ||
      !serialNumber ||
      !registryNumber ||
      !issuerId
    ) {
      logger.error('Missing required degree fields or issuerId', { degreeData });
      throw new Error('Missing required degree fields or issuerId');
    }

    // Validate degreeTypeId
    if (!mongoose.isValidObjectId(degreeTypeId)) {
      logger.error(`Invalid DegreeType ID: ${degreeTypeId}`);
      throw new Error('Invalid DegreeType ID');
    }

    // Check degreeType and issuer compatibility
    const degreeType = await getDegreeTypeById(degreeTypeId);
    if (!degreeType) {
      logger.error(`DegreeType not found for ID: ${degreeTypeId}`);
      throw new Error('DegreeType not found');
    }
    if (degreeType.issuerId.toString() !== issuerId.toString()) {
      logger.error(`DegreeType ${degreeTypeId} does not belong to issuer ${issuerId}`);
      throw new Error('Selected DegreeType does not belong to the chosen issuer');
    }

    // Check for duplicate serialNumber or registryNumber (excluding current degree)
    const existingDegree = await Degree.findOne({
      $or: [
        { serialNumber, _id: { $ne: degreeId } },
        { registryNumber, _id: { $ne: degreeId } },
      ],
    }).lean();
    if (existingDegree) {
      logger.error(`Serial number or registry number already exists: ${serialNumber}, ${registryNumber}`);
      throw new Error('Serial number or registry number already exists');
    }

    // Update degree fields
    degree.recipientName = recipientName;
    degree.recipientDob = new Date(recipientDob);
    degree.placeOfBirth = placeOfBirth || '';
    degree.level = level || degreeType.level || '';
    degree.degreeTypeId = degreeTypeId;
    degree.issueDate = new Date(issueDate);
    degree.serialNumber = serialNumber;
    degree.registryNumber = registryNumber;
    degree.placeOfIssue = placeOfIssue || '';
    degree.signer = signer || '';
    degree.fileAttachment = fileAttachment || degree.fileAttachment;
    degree.issuerId = issuerId;
    degree.status = 'Pending'; // Set status to Pending for re-approval
    degree.digitalSignature = null; // Set digitalSignature to null
    degree.signerEmail = null; // Set signerEmail to null

    await degree.save();
    logger.info(`Degree updated successfully: ${degreeId}`, { updatedFields: degreeData });
    return degree;
  } catch (error) {
    logger.error(`Error updating degree with id: ${degreeId}`, {
      error: error.message,
      stack: error.stack,
      degreeData,
      userId,
    });
    throw error; // Re-throw the error to be handled by the API
  }
};

const getDegreeById = async (id) => {
  try {
    if (!mongoose.isValidObjectId(id)) {
      logger?.error(`Invalid ObjectId: ${id}`);
      return null;
    }

    const degree = await Degree.findById(id)
      .populate('degreeTypeId', 'title level major')
      .populate('issuerId', 'name')
      .lean();

    if (!degree) {
      logger.error(`Degree not found with id: ${id}`);
      return null;
    }

    const enrichedDegree = {
      ...degree,
      degreeTypeName: degree.degreeTypeId?.title || 'N/A',
      major: degree.degreeTypeId?.major || degree.major || 'N/A',
      issuerName: degree.issuerId?.name || 'N/A',
      level: degree.degreeTypeId?.level || degree.level || 'N/A',
    };

    logger.info(`Fetched degree with id: ${id}`, { degree: enrichedDegree });
    return enrichedDegree;
  } catch (error) {
    logger.error(`Error fetching degree with id: ${id}`, { error });
    return null;
  }
};


// clound
const getDegreeByIdForSync = async (degreeId, userId) => {
  try {
    if (!mongoose.isValidObjectId(degreeId)) {
      logger.error(`Invalid Degree ID: ${degreeId}`);
      throw new Error('Invalid Degree ID');
    }

    if (!mongoose.isValidObjectId(userId)) {
      logger.error(`Invalid User ID: ${userId}`);
      throw new Error('Invalid User ID');
    }

    const degree = await mongoose.model('Degree').findOne({ _id: degreeId, status: 'Approved' }).lean();
    if (!degree) {
      logger.error(`Approved degree not found with id: ${degreeId}`);
      throw new Error('Degree not found or not approved');
    }

    const user = await mongoose.model('User').findById(userId).lean();
    if (!user || (user.roleid !== 3 && (user.roleid === 2 && degree.issuerId.toString() !== user.issuerId.toString()))) {
      logger.error(`User ${userId} does not have permission to sync degree ${degreeId}`);
      throw new Error('Permission denied');
    }

    return degree;
  } catch (error) {
    logger.error(`Error fetching degree for sync with id: ${degreeId}`, { error, userId });
    throw error;
  }
};

const updateDegreeCloudFile = async (degreeId, cloudFile) => {
  try {
    if (!mongoose.isValidObjectId(degreeId)) {
      logger.error(`Invalid Degree ID: ${degreeId}`);
      throw new Error('Invalid Degree ID');
    }

    const degree = await mongoose.model('Degree').findByIdAndUpdate(
      degreeId,
      { cloudFile },
      { new: true, runValidators: true }
    ).lean();
    if (!degree) {
      logger.error(`Degree not found with id: ${degreeId}`);
      throw new Error('Degree not found');
    }

    logger.info(`Updated cloudFile for degree ${degreeId}`, { cloudFile });
    return degree;
  } catch (error) {
    logger.error(`Error updating cloudFile for degree ${degreeId}`, { error, cloudFile });
    throw error;
  }
};

const updateDegreeFileAttachment = async (degreeId, fileAttachment) => {
  try {
    if (!mongoose.isValidObjectId(degreeId)) {
      logger.error(`Invalid Degree ID: ${degreeId}`);
      throw new Error('Invalid Degree ID');
    }

    const degree = await mongoose.model('Degree').findByIdAndUpdate(
      degreeId,
      { fileAttachment },
      { new: true, runValidators: true }
    ).lean();
    if (!degree) {
      logger.error(`Degree not found with id: ${degreeId}`);
      throw new Error('Degree not found');
    }

    logger.info(`Updated fileAttachment for degree ${degreeId}`, { fileAttachment });
    return degree;
  } catch (error) {
    logger.error(`Error updating fileAttachment for degree ${degreeId}`, { error, fileAttachment });
    throw error;
  }
};

const createDigitalSignature = (data) => {
  try {
    if (!privateKey.includes('PRIVATE KEY')) {
      logger.error('Invalid RSA private key');
      throw new Error('Invalid RSA private key');
    }
    const key = new NodeRSA();
    key.importKey(privateKey, 'private');
    const signature = key.sign(data, 'hex');
    return signature;
  } catch (error) {
    logger.error('Error creating digital signature', { error: error.message });
    throw error;
  }
};

const verifyDigitalSignature = (data, signature) => {
  try {
    if (!publicKey.includes('PUBLIC KEY')) {
      logger.error('Invalid RSA public key');
      throw new Error('Invalid RSA public key');
    }
    const key = new NodeRSA();
    key.importKey(publicKey, 'public');
    return key.verify(data, signature, 'utf8', 'hex');
  } catch (error) {
    logger.error('Error verifying digital signature', { error: error.message });
    throw error;
  }
};

const updateDegreeStatus = async (degreeId, status, userId, cloudFile) => {
  try {
    if (!mongoose.isValidObjectId(degreeId)) {
      logger.error(`Invalid degree ID: ${degreeId}`);
      throw new Error('Invalid degree ID');
    }

    if (!mongoose.isValidObjectId(userId)) {
      logger.error(`Invalid user ID: ${userId}`);
      throw new Error('Invalid user ID');
    }

    if (!['Pending', 'Rejected', 'Approved'].includes(status)) {
      logger.error(`Invalid status: ${status}`);
      throw new Error('Invalid status value');
    }

    const degree = await Degree.findById(degreeId);
    if (!degree) {
      logger.error(`Degree not found with ID: ${degreeId}`);
      throw new Error('Degree not found');
    }

    const user = await mongoose.model('User').findById(userId).lean();
    if (!user) {
      logger.error(`User not found with ID: ${userId}`);
      throw new Error('User not found');
    }

    if (user.roleid !== 3 && (user.roleid !== 1 || degree.issuerId.toString() !== user.issuerId.toString())) {
      logger.error(`User ${userId} does not have permission to update degree status ${degreeId}`);
      throw new Error('Permission denied');
    }

    // Tạo object dữ liệu
    const dataObj = {
      recipientName: degree.recipientName,
      recipientDob: degree.recipientDob ? degree.recipientDob.toISOString() : null,
      placeOfBirth: degree.placeOfBirth,
      level: degree.level,
      degreeTypeId: degree.degreeTypeId.toString(),
      issueDate: degree.issueDate ? degree.issueDate.toISOString() : null,
      serialNumber: degree.serialNumber,
      registryNumber: degree.registryNumber,
      placeOfIssue: degree.placeOfIssue,
      signer: degree.signer,
      fileAttachment: degree.fileAttachment,
      cloudFile: cloudFile || degree.cloudFile,
      issuerId: degree.issuerId.toString(),
      status: status,
      createdAt: degree.createdAt ? degree.createdAt.toISOString() : null,
      // Không có updatedAt nữa
      signerEmail: user.email,
    };

    // Sort key để đảm bảo thứ tự nhất quán
    const sortedData = Object.keys(dataObj).sort().reduce((acc, key) => { acc[key] = dataObj[key]; return acc; }, {});

    const dataToSign = JSON.stringify(sortedData);

    degree.status = status;
    degree.cloudFile = cloudFile;

    if (status === 'Approved') {
      degree.digitalSignature = createDigitalSignature(dataToSign);
      degree.signerEmail = user.email;
      logger.info(`Created digital signature for degree ${degreeId}`);
    } else {
      degree.digitalSignature = null;
      degree.signerEmail = null;
      logger.info(`Removed digital signature and signer email for degree ${degreeId}`);
    }

    await degree.save();
    logger.info(`Degree status updated successfully: ${degreeId}`, { status, userId });
    return degree;
  } catch (error) {
    logger.error(`Error updating degree status with ID: ${degreeId}`, {
      error: error.message,
      stack: error.stack,
      status,
      userId,
    });
    throw error;
  }
};

const verifyDegreeSignature = async (degreeId) => {
  try {
    if (!mongoose.isValidObjectId(degreeId)) {
      logger.error(`Invalid degree ID: ${degreeId}`);
      throw new Error('Invalid degree ID');
    }

    const degree = await Degree.findById(degreeId).lean();
    if (!degree) {
      logger.error(`Degree not found with ID: ${degreeId}`);
      throw new Error('Degree not found');
    }

    if (!degree.digitalSignature) {
      logger.warn(`No digital signature found for degree ${degreeId}`);
      return { isValid: false, message: 'No digital signature found' };
    }

    // Tạo object dữ liệu
    const dataObj = {
      recipientName: degree.recipientName,
      recipientDob: degree.recipientDob ? new Date(degree.recipientDob).toISOString() : null,
      placeOfBirth: degree.placeOfBirth,
      level: degree.level,
      degreeTypeId: degree.degreeTypeId.toString(),
      issueDate: degree.issueDate ? new Date(degree.issueDate).toISOString() : null,
      serialNumber: degree.serialNumber,
      registryNumber: degree.registryNumber,
      placeOfIssue: degree.placeOfIssue,
      signer: degree.signer,
      fileAttachment: degree.fileAttachment,
      cloudFile: degree.cloudFile,
      issuerId: degree.issuerId.toString(),
      status: degree.status,
      createdAt: degree.createdAt ? new Date(degree.createdAt).toISOString() : null,
      // Không có updatedAt nữa
      signerEmail: degree.signerEmail || null,
    };

    // Sort key để đảm bảo thứ tự nhất quán
    const sortedData = Object.keys(dataObj).sort().reduce((acc, key) => { acc[key] = dataObj[key]; return acc; }, {});

    const dataToVerify = JSON.stringify(sortedData);

    const isValid = verifyDigitalSignature(dataToVerify, degree.digitalSignature);
    logger.info(`Digital signature verification result for degree ${degreeId}: ${isValid}`);
    return { isValid, message: isValid ? 'Digital signature is valid' : 'Digital signature is invalid' };
  } catch (error) {
    logger.error(`Error verifying digital signature for degree ${degreeId}`, { error: error.message });
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
  deleteDegree,
  updateDegree,
  getDegreeById,
  getDegreeByIdForSync,
  updateDegreeCloudFile,
  updateDegreeFileAttachment,
  updateDegreeStatus,
  verifyDegreeSignature
};
export default Degree;