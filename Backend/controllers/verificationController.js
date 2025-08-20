import mongoose from 'mongoose';
import { Degree, getListDegrees, updateDegreeStatus, verifyDegreeSignature } from '../models/degreeModel.js';
import logger from '../configs/logger.js';
import { fetchDegreeTypesByIssuer } from '../models/degreetypeModel.js';
import ExcelJS from 'exceljs';
import userModel from '../models/userModel.js';
import { deleteFromMega } from '../configs/uploadToMega.js';

const getListDegreesAPI = async (req, res) => {
  try {
    const { email } = req.user;
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      issuerId = '',
      degreeTypeId = '',
      issueYear = '',
      sort = 'desc',
    } = req.query;

    logger.debug(`Received request for degrees`, { email, query: req.query });

    const user = await userModel.getUserByEmailAPI(email);
    if (!user) {
      logger.error(`User not found with email: ${email}`);
      return res.status(400).json({
        errCode: 1,
        message: 'User not found with provided email',
      });
    }

    let effectiveIssuerId = '';
    if (user.roleid === 3) { // Admin
      if (issuerId && mongoose.isValidObjectId(issuerId)) {
        effectiveIssuerId = issuerId;
      }
    } else if (user.roleid === 1) { // Certifier
      if (!user.issuerId) {
        logger.error(`Certifier ${email} has no associated issuerId`);
        return res.status(400).json({
          errCode: 1,
          message: 'Certifier has no associated issuerId',
        });
      }
      effectiveIssuerId = user.issuerId.toString();
    } else {
      logger.error(`User ${email} does not have permission to view degrees`, { roleid: user.roleid });
      return res.status(403).json({
        errCode: 1,
        message: 'Permission denied',
      });
    }

    logger.debug(`Fetching degrees with params`, {
      userId: user._id.toString(),
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      effectiveIssuerId,
      degreeTypeId,
      issueYear,
      sort,
      role: user.roleid === 3 ? 'admin' : 'certifier',
    });

    const result = await getListDegrees(
      user._id.toString(),
      parseInt(page),
      parseInt(limit),
      search,
      status,
      effectiveIssuerId,
      degreeTypeId,
      issueYear,
      sort
    );

    logger.info(`Fetched ${result.degrees.length} degrees`, {
      query: { search, status, effectiveIssuerId, degreeTypeId, issueYear, sort },
      user: email,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    });

    if (result.degrees.length === 0) {
      logger.warn(`No degrees found for query`, {
        query: { search, status, effectiveIssuerId, degreeTypeId, issueYear, sort },
        user: email,
      });
      return res.status(200).json({
        errCode: 0,
        message: 'No degrees found matching the criteria',
        data: {
          degrees: [],
          total: 0,
          totalPages: 0,
          currentPage: parseInt(page),
        },
      });
    }

    return res.status(200).json({
      errCode: 0,
      data: {
        degrees: result.degrees,
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
      },
    });
  } catch (error) {
    logger.error('Error fetching degrees', { error, user: req.user?.email, query: req.query });
    return res.status(500).json({ errCode: 1, message: error.message || 'Error fetching degrees' });
  }
};

const exportDegreesToExcel = async (req, res) => {
  try {
    const { email } = req.user;
    const {
      search = '',
      status = '',
      issuerId = '',
      degreeTypeId = '',
      issueYear = '',
      sort = 'desc',
    } = req.query;

    const user = await userModel.getUserByEmailAPI(email);
    if (!user) {
      logger.error(`User not found with email: ${email}`);
      return res.status(400).json({
        errCode: 1,
        message: 'User not found with provided email',
      });
    }

    let effectiveIssuerId = '';
    if (user.roleid === 3) { // Admin
      if (issuerId && mongoose.isValidObjectId(issuerId)) {
        effectiveIssuerId = issuerId;
      }
    } else if (user.roleid === 1) { // Certifier
      if (!user.issuerId) {
        logger.error(`Certifier ${email} has no associated issuerId`);
        return res.status(400).json({
          errCode: 1,
          message: 'Certifier has no associated issuerId',
        });
      }
      effectiveIssuerId = user.issuerId.toString();
    } else {
      logger.error(`User ${email} does not have permission to export degrees`, { roleid: user.roleid });
      return res.status(403).json({
        errCode: 1,
        message: 'Permission denied',
      });
    }

    const result = await getListDegrees(
      user._id.toString(),
      1,
      0,
      search,
      status,
      effectiveIssuerId,
      degreeTypeId,
      issueYear,
      sort
    );

    const degrees = result.degrees;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Degrees');

    // Add header row explicitly with centered alignment
    const headerRow = worksheet.addRow([
      'Loại văn bằng',
      'Đơn vị cấp',
      'Tên người nhận',
      'Xếp loại',
      'Số hiệu',
      'Số vào sổ',
      'Ngày cấp',
      'Trạng thái',
    ]);

    // Apply styling to header row (only columns A to H)
    headerRow.eachCell((cell, colNumber) => {
      if (colNumber <= 8) {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B619D' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

    // Define columns with widths
    worksheet.columns = [
      { header: 'Loại văn bằng', key: 'degreeType', width: 30 },
      { header: 'Đơn vị cấp', key: 'issuer', width: 30 },
      { header: 'Tên người nhận', key: 'recipientName', width: 30 },
      { header: 'Xếp loại', key: 'level', width: 15 },
      { header: 'Số hiệu', key: 'serialNumber', width: 20 },
      { header: 'Số vào sổ', key: 'registryNumber', width: 20 },
      { header: 'Ngày cấp', key: 'issueDate', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 15 },
    ];

    // Add data rows
    degrees.forEach((degree) => {
      worksheet.addRow({
        degreeType: degree.degreeType?.title || 'N/A',
        issuer: degree.issuer?.name || 'N/A',
        recipientName: degree.recipientName,
        level: degree.level || 'N/A',
        serialNumber: degree.serialNumber,
        registryNumber: degree.registryNumber,
        issueDate: new Date(degree.issueDate).toLocaleDateString('vi-VN'),
        status: degree.status === 'Pending' ? 'Chờ duyệt' : degree.status === 'Approved' ? 'Đã duyệt' : 'Đã từ chối',
      });
    });

    // Ensure column alignment for data
    worksheet.columns.forEach((column) => {
      column.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    });

    // Insert title rows at the beginning
    worksheet.spliceRows(1, 0, ['']); // Create space for titles
    worksheet.spliceRows(1, 0, ['']); // Create space for titles
    const newTitleRow1 = worksheet.getRow(1);
    newTitleRow1.values = ['Trung Tâm Công Nghệ Phần Mềm Đại Học Cần Thơ'];
    newTitleRow1.font = { bold: true, size: 16 };
    newTitleRow1.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.mergeCells('A1:H1');

    const newTitleRow2 = worksheet.getRow(2);
    newTitleRow2.values = ['Can Tho University Software Center'];
    newTitleRow2.font = { bold: true, size: 13 };
    newTitleRow2.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.mergeCells('A2:H2');

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=degrees_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    logger.error('Error exporting degrees to Excel', { error, user: req.user?.email, query: req.query });
    return res.status(500).json({ errCode: 1, message: error.message || 'Error exporting degrees to Excel' });
  }
};

const getDistinctIssueYears = async (req, res) => {
  try {
    const { email } = req.user;
    const { issuerId = '' } = req.query;

    const user = await userModel.getUserByEmailAPI(email);
    if (!user) {
      logger.error(`User not found with email: ${email}`);
      return res.status(400).json({
        errCode: 1,
        message: 'User not found with provided email',
      });
    }

    let effectiveIssuerId = '';
    if (user.roleid === 3) { // Admin
      if (issuerId && mongoose.isValidObjectId(issuerId)) {
        effectiveIssuerId = issuerId;
      }
    } else if (user.roleid === 1) { // Certifier
      if (!user.issuerId) {
        logger.error(`Certifier ${email} has no associated issuerId`);
        return res.status(400).json({
          errCode: 1,
          message: 'Certifier has no associated issuerId',
        });
      }
      effectiveIssuerId = user.issuerId.toString();
    } else {
      logger.error(`User ${email} does not have permission to fetch issue years`, { roleid: user.roleid });
      return res.status(403).json({
        errCode: 1,
        message: 'Permission denied',
      });
    }

    const query = {};
    if (effectiveIssuerId) {
      query.issuerId = effectiveIssuerId;
    }

    const years = await Degree.distinct('issueDate', query)
      .then(dates => dates.map(date => new Date(date).getFullYear()))
      .then(years => [...new Set(years)].sort((a, b) => b - a));

    logger.info(`Fetched ${years.length} distinct issue years`, { user: email, issuerId: effectiveIssuerId });

    return res.status(200).json({
      errCode: 0,
      data: { years },
    });
  } catch (error) {
    logger.error('Error fetching distinct issue years', { error, user: req.user?.email, query: req.query });
    return res.status(500).json({ errCode: 1, message: error.message || 'Error fetching issue years' });
  }
};

const getDegreeTypesByIssuerAPI = async (req, res) => {
  try {
    const { issuerId } = req.query;
    if (!mongoose.isValidObjectId(issuerId)) {
      logger.error(`Invalid Issuer ID: ${issuerId}`);
      return res.status(400).json({
        errCode: 1,
        message: 'Invalid Issuer ID',
        data: [],
      });
    }
    const degreeTypes = await fetchDegreeTypesByIssuer(issuerId);
    logger.info(`Fetched ${degreeTypes.length} degree types for issuer ${issuerId}`);
    return res.status(200).json({
      errCode: 0,
      message: 'Success',
      data: degreeTypes || [],
    });
  } catch (error) {
    logger.error(`Error fetching degree types`, { error, user: req.user?.email });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error fetching degree types',
      data: [],
    });
  }
};

const getDegreeByIdAPI = async (req, res) => {
  const { id } = req.params;

  try {
    const degree = await Degree.findById(id)
      .populate('degreeTypeId', 'title level major')
      .populate('issuerId', 'name')
      .lean();

    if (!degree) {
      logger.warn(`Degree not found for id: ${id}`, { user: req.user?.email });
      return res.status(404).json({ errCode: 1, message: 'Degree not found' });
    }

    logger.info(`Degree fetched successfully`, { id, user: req.user?.email });
    return res.status(200).json({ errCode: 0, data: degree });
  } catch (error) {
    logger.error(`Error fetching degree by id: ${id}`, { error, user: req.user?.email });
    return res.status(500).json({ errCode: 1, message: 'Internal server error' });
  }
};

const updateDegreeAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, email } = req.body;
    const userId = req.user.userId;

    if (!id) {
      logger.error('Degree ID not provided in request parameters', { user: req.user?.email });
      return res.status(400).json({
        errCode: 1,
        message: 'Degree ID not provided in request parameters',
      });
    }

    if (!email || email !== req.user.email) {
      logger.error(`Email ${email} does not match authenticated user ${req.user.email}`, { userId, degreeId: id });
      return res.status(403).json({
        errCode: 1,
        message: 'Email does not match authenticated user',
      });
    }

    const user = await userModel.getUserByEmailAPI(email);
    if (!user) {
      logger.error(`User not found with email: ${email}`, { userId, degreeId: id });
      return res.status(400).json({
        errCode: 1,
        message: 'User not found with provided email',
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      logger.error(`Invalid degree ID: ${id}`, { userId, email });
      return res.status(400).json({
        errCode: 1,
        message: 'Invalid degree ID',
      });
    }

    const degree = await Degree.findById(id);
    if (!degree) {
      logger.error(`Degree not found with ID: ${id}`, { userId, email });
      return res.status(404).json({
        errCode: 1,
        message: 'Degree not found',
      });
    }

    if (degree.status === 'Approved' && (status === 'Rejected' || status === 'Pending') && degree.cloudFile) {
      try {
        await deleteFromMega(degree.cloudFile);
        logger.info(`Deleted cloud file from Mega.nz for degree ${id}`, { cloudFile: degree.cloudFile });
        degree.cloudFile = null;
      } catch (error) {
        logger.warn(`Failed to delete cloud file for degree ${id}: ${error.message}`, {
          cloudFile: degree.cloudFile,
          stack: error.stack,
        });
      }
    }

    const updatedDegree = await updateDegreeStatus(id, status, userId, degree.cloudFile);
    if (!updatedDegree) {
      logger.error(`Failed to update degree status with ID: ${id}`, { userId, email, status });
      return res.status(404).json({
        errCode: 1,
        message: 'Degree not found or update failed',
      });
    }

    logger.info(`Degree status updated successfully`, { degreeId: id, user: req.user.email, status });
    return res.status(200).json({
      errCode: 0,
      message: 'Degree status updated successfully',
      data: updatedDegree,
    });
  } catch (error) {
    logger.error(`Error updating degree with ID: ${req.params.id || 'unknown'}`, {
      error: error.message,
      stack: error.stack,
      user: req.user?.email,
      status: req.body.status,
    });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error updating degree status',
    });
  }
};

const verifyDegreeSignatureAPI = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      logger.error(`Invalid degree ID: ${id}`);
      return res.status(400).json({
        errCode: 1,
        message: 'Invalid degree ID',
      });
    }

    const result = await verifyDegreeSignature(id);
    return res.status(200).json({
      errCode: 0,
      message: result.message,
      data: { isValid: result.isValid },
    });
  } catch (error) {
    logger.error(`Error verifying digital signature for degree ${req.params.id}`, { error: error.message });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error verifying digital signature',
    });
  }
};

export default {
  getListDegreesAPI,
  exportDegreesToExcel,
  getDistinctIssueYears,
  getDegreeTypesByIssuerAPI,
  getDegreeByIdAPI,
  updateDegreeAPI,
  verifyDegreeSignatureAPI
};