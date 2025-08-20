import mongoose from 'mongoose';
import logger from '../configs/logger.js';
import { createDegreeType, updateDegreeType, deleteDegreeType, getDegreeTypeById, getDegreeTypesByIssuer } from '../models/degreetypeModel.js';
import userModel from '../models/userModel.js';

// Create degree type
const createDegreeTypeAPI = async (req, res) => {
    try {
        const { title, level, major, email } = req.body;
        if (!title || !level || !major) {
            logger.error(`Missing required degree type fields: ${JSON.stringify({ title, level, major })}`);
            return res.status(400).json({
                errCode: 1,
                message: 'Missing required degree type fields',
            });
        }
        if (!email) {
            logger.error('Email is required in request body');
            return res.status(400).json({
                errCode: 1,
                message: 'Email is required',
            });
        }

        // Check if email matches authenticated user
        if (email !== req.user.email) {
            logger.error(`Email ${email} does not match authenticated user ${req.user.email}`);
            return res.status(403).json({
                errCode: 1,
                message: 'Email does not match authenticated user',
            });
        }
        // Fetch user information by email
        const user = await userModel.getUserByEmailAPI(email);
        if (!user) {
            logger.error(`User not found with email: ${email}`);
            return res.status(400).json({
                errCode: 1,
                message: 'User not found with provided email',
            });
        }

        // Check permissions (roleid = 1 or 3)
        if (![1, 3].includes(user.roleid)) {
            logger.error(`User ${email} does not have permission to create degree type`);
            return res.status(403).json({
                errCode: 1,
                message: 'Only certifier or admin can create degree type',
            });
        }

        // Validate issuerId
        const issuerId = user.issuerId;
        if (!mongoose.Types.ObjectId.isValid(issuerId)) {
            logger.error(`Invalid Issuer ID for user ${email}: ${issuerId}`);
            return res.status(400).json({
                errCode: 1,
                message: 'Invalid issuer ID',
            });
        }

        // Data to create DegreeType
        const degreeTypeData = { title, level, major, issuerId };
        const newDegreeType = await createDegreeType(user._id, degreeTypeData);
        logger.info(`Degree type created successfully`, { id: newDegreeType._id, user: email });
        return res.status(201).json({
            errCode: 0,
            message: 'Degree type created successfully',
            data: newDegreeType,
        });
    } catch (error) {
        logger.error(`Error creating degree type`, { error, user: req.body.email });
        return res.status(400).json({
            errCode: 1,
            message: error.message || 'Error creating degree type',
        });
    }
};

// Other functions remain unchanged
const updateDegreeTypeAPI = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const degreeTypeData = req.body;
        const updatedDegreeType = await updateDegreeType(userId, id, degreeTypeData);
        logger.info(`Degree type updated successfully`, { id, user: req.user.email });
        return res.status(200).json({
            errCode: 0,
            message: 'Degree type updated successfully',
            data: updatedDegreeType,
        });
    } catch (error) {
        logger.error(`Error updating degree type`, { error, user: req.user?.email });
        return res.status(400).json({
            errCode: 1,
            message: error.message || 'Error updating degree type',
        });
    }
};

const deleteDegreeTypeAPI = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await deleteDegreeType(userId, id);
    logger.info(`Degree type deleted successfully`, { id, user: req.user.email });
    return res.status(200).json({
      errCode: 0,
      message: result.message,
    });
  } catch (error) {
    logger.error(`Error deleting degree type`, { error, user: req.user?.email });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error deleting degree type',
    });
  }
};

const getDegreeTypeByIdAPI = async (req, res) => {
    try {
        const { id } = req.params;
        const degreeType = await getDegreeTypeById(id);
        logger.info(`Fetched degree type successfully`, { id, user: req.user?.email });
        return res.status(200).json({
            errCode: 0,
            data: degreeType,
        });
    } catch (error) {
        logger.error(`Error fetching degree type`, { error, user: req.user?.email });
        return res.status(400).json({
            errCode: 1,
            message: error.message || 'Error fetching degree type',
        });
    }
};

// Get degree types by issuer with pagination
const getDegreeTypesByIssuerAPI = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await mongoose.model('User').findById(userId).lean();
    if (!user) {
      throw new Error('User not found');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const level = req.query.level || '';
    const sort = req.query.sort || 'desc'; // Default to descending (newest first)

    const { degreeTypes, total, totalPages, currentPage } = await getDegreeTypesByIssuer(
      user.issuerId,
      page,
      limit,
      search,
      level,
      sort
    );

    logger.info(`Fetched degree types for issuer`, {
      issuerId: user.issuerId,
      user: req.user.email,
      search,
      level,
      sort,
    });
    return res.status(200).json({
      errCode: 0,
      data: {
        degreeTypes,
        total,
        totalPages,
        currentPage,
      },
    });
  } catch (error) {
    logger.error(`Error fetching degree types`, { error, user: req.user?.email });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error fetching degree types',
    });
  }
};

export default {
    createDegreeTypeAPI,
    updateDegreeTypeAPI,
    deleteDegreeTypeAPI,
    getDegreeTypeByIdAPI,
    getDegreeTypesByIssuerAPI,
};