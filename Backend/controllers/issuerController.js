import logger from '../configs/logger.js';
import Issuermodel from '../models/issuerModel';


const createIssuerAPI = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, address, contactEmail } = req.body;

    // Validate required fields
    if (!name) {
      logger.error('Missing required issuer fields', { body: req.body, user: req.user?.email });
      return res.status(400).json({
        errCode: 1,
        message: 'Missing required issuer fields',
      });
    }

    // Create issuer
    const newIssuer = await Issuermodel.createIssuer(userId, { name, address, contactEmail });

    logger.info(`Issuer created successfully by user ${req.user.email}: ${newIssuer._id}`);
    return res.status(201).json({
      errCode: 0,
      message: 'Issuer created successfully',
      data: {
        _id: newIssuer._id,
        name: newIssuer.name,
        address: newIssuer.address,
        contactEmail: newIssuer.contactEmail,
      },
    });
  } catch (error) {
    logger.error(`Error creating issuer by user ${req.user?.email}`, {
      error: {
        message: error.message,
        stack: error.stack,
      },
      body: req.body,
    });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error creating issuer',
    });
  }
};

const getIssuersAPI = async (req, res) => {
  try {
    const issuers = await Issuermodel.getIssuers();
    logger.info(`Fetched ${issuers.length} issuers by user ${req.user.email}`);
    return res.status(200).json({
      errCode: 0,
      data: issuers,
    });
  } catch (error) {
    logger.error(`Error fetching issuers`, {
      error: {
        message: error.message,
        stack: error.stack,
      },
      user: req.user?.email,
    });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error fetching issuers',
    });
  }
};

const deleteIssuerAPI = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Delete issuer
    const result = await Issuermodel.deleteIssuer(userId, id);
    logger.info(`Issuer deleted successfully by user ${req.user.email}: ${id}`);
    return res.status(200).json({
      errCode: 0,
      message: result.message,
    });
  } catch (error) {
    logger.error(`Error deleting issuer by user ${req.user?.email}`, {
      error: {
        message: error.message,
        stack: error.stack,
      },
      id: req.params.id,
    });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error deleting issuer',
    });
  }
};

const getListIssuerAPI = async (req, res) => {
  // Declare variables outside try block to ensure they are defined in catch
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const sort = req.query.sort || 'desc';

  try {
    const { issuers, total, totalPages, currentPage } = await Issuermodel.getListIssuer(page, limit, search, sort);

    logger.info(`Fetched issuers for admin`, {
      userId: req.user.userId,
      user: req.user.email,
      search,
      sort,
      page,
      limit,
    });
    return res.status(200).json({
      errCode: 0,
      data: {
        issuers,
        total,
        totalPages,
        currentPage,
      },
    });
  } catch (error) {
    logger.error(`Error fetching issuers`, {
      error: {
        message: error.message,
        stack: error.stack,
      },
      user: req.user?.email,
      query: { page, limit, search, sort },
    });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error fetching issuers',
    });
  }
};

const updateIssuerAPI = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const issuerData = req.body;

    // Validate required fields
    if (!issuerData.name) {
      logger.error('Missing required issuer fields', { body: req.body, user: req.user?.email });
      return res.status(400).json({
        errCode: 1,
        message: 'Missing required issuer fields',
      });
    }

    // Update issuer
    const updatedIssuer = await Issuermodel.updateIssuer(userId, id, issuerData);

    logger.info(`Issuer updated successfully by user ${req.user.email}: ${id}`);
    return res.status(200).json({
      errCode: 0,
      message: 'Issuer updated successfully',
      data: {
        _id: updatedIssuer._id,
        name: updatedIssuer.name,
        address: updatedIssuer.address,
        contactEmail: updatedIssuer.contactEmail,
      },
    });
  } catch (error) {
    logger.error(`Error updating issuer by user ${req.user?.email}`, {
      error: {
        message: error.message,
        stack: error.stack,
      },
      id: req.params.id,
      body: req.body,
    });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error updating issuer',
    });
  }
};

const getIssuerByIdAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const issuer = await Issuermodel.getIssuerById(id);

    logger.info(`Fetched issuer by ID: ${id} by user ${req.user.email}`);
    return res.status(200).json({
      errCode: 0,
      message: 'Issuer fetched successfully',
      data: {
        _id: issuer._id,
        name: issuer.name,
        address: issuer.address,
        contactEmail: issuer.contactEmail,
      },
    });
  } catch (error) {
    logger.error(`Error fetching issuer by ID: ${id}`, {
      error: {
        message: error.message,
        stack: error.stack,
      },
      user: req.user?.email,
    });
    return res.status(error.message === 'Invalid Issuer ID' || error.message === 'Issuer not found' ? 400 : 500).json({
      errCode: 1,
      message: error.message || 'Error fetching issuer',
    });
  }
};

const getPublicIssuersAPI = async (req, res) => {
  try {
    const issuers = await Issuermodel.getIssuers();
    logger.info(`Fetched ${issuers.length} issuers by anonymous user`);
    return res.status(200).json({
      errCode: 0,
      message: 'Lấy danh sách đơn vị cấp thành công',
      data: issuers,
    });
  } catch (error) {
    logger.error(`Error fetching issuers`, {
      error: {
        message: error.message,
        stack: error.stack,
      },
      user: 'anonymous',
    });
    return res.status(500).json({
      errCode: 1,
      message: error.message || 'Lỗi khi lấy danh sách đơn vị cấp',
      data: [],
    });
  }
};

export default {
  createIssuerAPI,
  getIssuersAPI,
  deleteIssuerAPI,
  getListIssuerAPI,
  updateIssuerAPI,
  getIssuerByIdAPI,
  getPublicIssuersAPI
};