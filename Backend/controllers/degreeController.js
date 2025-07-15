import mongoose from 'mongoose';
import { Degree, getApprovedDegreeById, getAllApprovedDegrees } from '../models/degreeModel.js';
import logger from '../configs/logger.js';

// Lấy thông tin văn bằng đã duyệt theo ID
const getDegreeByIdAPI = async (req, res) => {
  const { id } = req.params;

  try {
    const degree = await getApprovedDegreeById(id);
    if (!degree) {
      logger.warn(`Approved degree not found for id: ${id}`, { user: req.user?.email });
      return res.status(404).json({ errCode: 1, message: 'Approved degree not found' });
    }

    logger.info(`Approved degree fetched successfully`, { id, user: req.user?.email });
    return res.status(200).json({ errCode: 0, data: degree });
  } catch (error) {
    logger.error(`Error fetching approved degree by id: ${id}`, { error, user: req.user?.email });
    return res.status(500).json({ errCode: 1, message: 'Internal server error' });
  }
};

// Lấy danh sách văn bằng đã duyệt theo bộ lọc
const getDegreesByFilterAPI = async (req, res) => {
  const { serialNumber, registryNumber, issuerId, level, major } = req.query;
  const query = { status: 'Approved' }; // Chỉ lấy văn bằng đã duyệt

  // Xây dựng bộ lọc động
  if (serialNumber) query.serialNumber = serialNumber;
  if (registryNumber) query.registryNumber = registryNumber;
  if (issuerId) {
    if (!mongoose.isValidObjectId(issuerId)) {
      logger.warn(`Invalid issuerId: ${issuerId}`, { user: req.user?.email });
      return res.status(400).json({ errCode: 1, message: 'Invalid issuerId' });
    }
    query.issuerId = issuerId;
  }
  if (level) query.level = { $regex: level, $options: 'i' }; // Không phân biệt hoa thường
  if (major) query.major = { $regex: major, $options: 'i' };

  try {
    const degrees = await Degree.find(query).lean();
    if (!degrees || degrees.length === 0) {
      logger.warn(`No approved degrees found with provided filters`, { query, user: req.user?.email });
      return res.status(404).json({ errCode: 1, message: 'No approved degrees found' });
    }

    logger.info(`Approved degrees fetched successfully`, { query, count: degrees.length, user: req.user?.email });
    return res.status(200).json({ errCode: 0, data: degrees });
  } catch (error) {
    logger.error(`Error fetching approved degrees by filter`, { error, query, user: req.user?.email });
    return res.status(500).json({ errCode: 1, message: 'Internal server error' });
  }
};

export default {
  getDegreeByIdAPI,
  getDegreesByFilterAPI,
};