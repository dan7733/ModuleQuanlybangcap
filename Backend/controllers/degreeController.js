import mongoose from 'mongoose';
import { Degree, getApprovedDegreeById, getApprovedDegreesByFilter, createDegree, getListDegrees, deleteDegree } from '../models/degreeModel.js';
import logger from '../configs/logger.js';
import { fetchDegreeTypesByIssuer } from '../models/degreetypeModel.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ExcelJS from 'exceljs';
import userModel from '../models/userModel.js';
// Hàm xóa ảnh
const deleteImage = (filename) => {
    if (!filename) return;
    try {
        const filePath = path.resolve(`images/degrees/${filename}`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        logger.info(`Deleted image file: ${filePath}`);
    } catch (error) {
        logger.error(`Error deleting image: ${error.message}`);
    }
};


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

const getDegreesByFilterAPI = async (req, res) => {
  const { serialNumber, registryNumber, issuerId, level } = req.query;
  const query = { status: 'Approved' };

  if (serialNumber) query.serialNumber = serialNumber;
  if (registryNumber) query.registryNumber = registryNumber;
  if (issuerId) {
    if (!mongoose.isValidObjectId(issuerId)) {
      logger.warn(`Invalid issuerId: ${issuerId}`, { user: req.user?.email });
      return res.status(400).json({ errCode: 1, message: 'Invalid issuerId' });
    }
    query.issuerId = issuerId;
  }
  if (level) query.level = { $regex: level, $options: 'i' };

  try {
    const degrees = await getApprovedDegreesByFilter(query);
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

const createDegreeAPI = async (req, res) => {
  try {
    const degreeData = req.body;
    const userId = req.user.userId;
    const selectedIssuerId = req.body.issuerId;
    let fileAttachment = req.file ? req.file.filename : null;

    // Đổi tên file nếu có serialNumber và issueDate
    if (req.file && degreeData.serialNumber && degreeData.issueDate) {
      try {
        const formattedDate = new Date(degreeData.issueDate);
        if (isNaN(formattedDate)) {
          logger.warn('Invalid issueDate for renaming', { issueDate: degreeData.issueDate });
        } else {
          const dateStr = formattedDate.toISOString().slice(0, 10).replace(/-/g, '');
          const ext = path.extname(req.file.filename);
          const finalFilename = `${degreeData.serialNumber}_${dateStr}${ext}`;
          
          const oldPath = path.resolve('images/degrees', req.file.filename);
          const newPath = path.resolve('images/degrees', finalFilename);
          
          // Đổi tên file
          fs.renameSync(oldPath, newPath);
          logger.info(`Renamed file from ${req.file.filename} to ${finalFilename}`);
          fileAttachment = finalFilename; // Cập nhật tên file mới
        }
      } catch (error) {
        logger.warn(`Failed to rename file ${req.file.filename}`, { error: error.message });
        // Tiếp tục xử lý dù đổi tên thất bại
      }
    }

    const newDegree = await createDegree({ ...degreeData, fileAttachment }, userId, selectedIssuerId);
    logger.info(`Degree created successfully`, { id: newDegree._id, user: req.user?.email });
    return res.status(201).json({
      errCode: 0,
      message: 'Degree created successfully',
      data: {
        _id: newDegree._id,
        recipientName: newDegree.recipientName,
        recipientDob: newDegree.recipientDob,
        placeOfBirth: newDegree.placeOfBirth,
        level: newDegree.level,
        degreeTypeId: newDegree.degreeTypeId,
        issueDate: newDegree.issueDate,
        serialNumber: newDegree.serialNumber,
        registryNumber: newDegree.registryNumber,
        placeOfIssue: newDegree.placeOfIssue,
        signer: newDegree.signer,
        fileAttachment: newDegree.fileAttachment,
        cloudFile: newDegree.cloudFile,
      },
    });
  } catch (error) {
    if (req.file) {
      deleteImage(req.file.filename); // Xóa ảnh nếu có lỗi
    }
    logger.error(`Error creating degree`, { error, user: req.user?.email });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error creating degree',
    });
  }
};

// Prompt cho Gemini
const promptText = `
Please extract the following fields from the certificate in this image and present the results in this format (in Vietnamese):

Cấp cho: <Tên người được cấp>
Sinh ngày: <Ngày sinh>
Tại: <Nơi sinh>
Xếp loại: <Xếp loại>
Ngày cấp: <Ngày cấp>
Địa điểm cấp: <Địa điểm cấp>
Người cấp: <Người ký cấp>
Số hiệu: <Số hiệu>
Số vào sổ: <Số vào sổ nếu có>

Chỉ trả về thông tin đã điền. Nếu không có thông tin nào, ghi "Không rõ".
`;

// Hàm trích xuất thông tin từ ảnh
const extractCertificateInfo = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Image file not found at: ${filePath}`);
    }

    const imageBuffer = fs.readFileSync(filePath);
    logger.info('Read image file', { filePath, size: imageBuffer.length });

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const encodedImage = imageBuffer.toString('base64');
    logger.info('Sending request to Gemini API', { imageSize: imageBuffer.length });

    const payload = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: encodedImage
            }
          },
          {
            text: promptText.trim()
          }
        ]
      }]
    };
    // Gửi yêu cầu tới Gemini API
    const { status, data } = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000 // 30 giây
    });
    // Kiểm tra phản hồi
    if (status !== 200) {
      throw new Error(`Gemini API request failed with status ${status}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Invalid response format from Gemini API: No text found');
    }

    logger.info('Extracted text from Gemini API', { text });
    return text;
  } catch (error) {
    logger.error('Error extracting certificate info', { error: error.message, stack: error.stack });
    throw error;
  }
};

// Hàm parse text thành JSON
const parseCertificateTextToJson = async (text, degreeTypeId) => {
  if (!text) {
    // Nếu không có text, trả về đối tượng rỗng
    logger.warn('No text provided to parseCertificateTextToJson');
    return {
      recipientName: null,
      recipientDob: null,
      placeOfBirth: null,
      level: null,
      issueDate: null,
      serialNumber: null,
      registryNumber: null,
      placeOfIssue: null,
      signer: null,
      fileAttachment: null
    };
  }
  // Khởi tạo đối tượng kết quả
  const result = {
    recipientName: null,
    recipientDob: null,
    placeOfBirth: null,
    level: null,
    issueDate: null,
    serialNumber: null,
    registryNumber: null,
    placeOfIssue: null,
    signer: null,
    fileAttachment: null
  };

  // Tách các dòng và loại bỏ khoảng trắng
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  for (const line of lines) {
    const parts = line.split(':').map(part => part.trim());
    if (parts.length < 2) continue;
    const [key, ...valueParts] = parts;
    const value = valueParts.join(':').trim();
    // Chuyển đổi các trường về dạng chuẩn
    switch (key) {
      case 'Cấp cho': result.recipientName = value !== 'Không rõ' ? value : null; break;
      case 'Sinh ngày': result.recipientDob = value !== 'Không rõ' ? standardizeDate(value) : null; break;
      case 'Tại': result.placeOfBirth = value !== 'Không rõ' ? value : null; break;
      case 'Xếp loại': result.level = value !== 'Không rõ' ? value : null; break;
      case 'Ngày cấp': result.issueDate = value !== 'Không rõ' ? standardizeDate(value) : null; break;
      case 'Địa điểm cấp': result.placeOfIssue = value !== 'Không rõ' ? value : null; break;
      case 'Người cấp': result.signer = value !== 'Không rõ' ? value : null; break;
      case 'Số hiệu': result.serialNumber = value !== 'Không rõ' ? value : null; break;
      case 'Số vào sổ': result.registryNumber = value !== 'Không rõ' ? value : null; break;
    }
  }

  // Nếu level là null, lấy từ DegreeType
  if (!result.level && degreeTypeId) {
    try {
      const degreeType = await getDegreeTypeById(degreeTypeId);
      if (degreeType) {
        result.level = degreeType.level || null;
      }
    } catch (error) {
      logger.warn(`Could not fetch level from DegreeType ${degreeTypeId}`, { error: error.message });
    }
  }

  logger.info('Parsed certificate data', { result });
  return result;
};

// Chuẩn hóa ngày tháng
const standardizeDate = (dateStr) => {
  // Kiểm tra nếu dateStr là null hoặc 'Không rõ'
  if (!dateStr || dateStr === 'Không rõ') return null;

  // Xử lý định dạng DD/MM/YYYY hoặc DD-MM-YYYY
  let regex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
  // Nếu khớp định dạng DD/MM/YYYY hoặc DD-MM-YYYY
  let match = dateStr.match(regex);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Xử lý định dạng "DD tháng MM năm YYYY"
  regex = /^(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})$/;
  match = dateStr.match(regex);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  // Nếu không khớp định dạng nào, trả về null và log cảnh báo
  logger.warn('Invalid date format', { dateStr });
  return null;
};

// Endpoint trích xuất thông tin từ ảnh
const extractDegreeFromImageAPI = async (req, res) => {
  try {
    const { issuerId, degreeTypeId } = req.body;
    const userId = req.user?.userId;
    const file = req.file;
    // Kiểm tra các tham số bắt buộc
    if (!file) {
      logger.warn('No image file provided', { user: req.user?.email });
      return res.status(400).json({ errCode: 1, message: 'No image file provided' });
    }

    if (!mongoose.isValidObjectId(issuerId) || !mongoose.isValidObjectId(degreeTypeId)) {
      deleteImage(file.filename);
      logger.warn('Invalid issuerId or degreeTypeId', { issuerId, degreeTypeId, user: req.user?.email });
      return res.status(400).json({ errCode: 1, message: 'Invalid issuerId or degreeTypeId' });
    }

    if (!userId || !mongoose.isValidObjectId(userId)) {
      deleteImage(file.filename);
      logger.warn('Invalid userId', { userId, user: req.user?.email });
      return res.status(400).json({ errCode: 1, message: 'Invalid user ID' });
    }

    // Đọc file từ thư mục images/degrees
    const filePath = path.resolve('images/degrees', file.filename);
    // Trích xuất thông tin từ ảnh
    const text = await extractCertificateInfo(filePath);
    // Nếu không có text, trả về lỗi
    const extractedData = await parseCertificateTextToJson(text, degreeTypeId);

    // Đổi tên file nếu có serialNumber và issueDate
    let finalFilename = file.filename;
    if (extractedData.serialNumber && extractedData.issueDate) {
      try {
        const formattedDate = new Date(extractedData.issueDate);
        // Kiểm tra nếu ngày hợp lệ
        if (isNaN(formattedDate)) {
          // Nếu ngày không hợp lệ, log cảnh báo và giữ nguyên tên file
          logger.warn('Invalid issueDate for renaming', { issueDate: extractedData.issueDate });
        } else {
          // Đổi tên file theo định dạng serialNumber_YYYYMMDD.ext
          const dateStr = formattedDate.toISOString().slice(0, 10).replace(/-/g, '');
          const ext = path.extname(file.filename);
          finalFilename = `${extractedData.serialNumber}_${dateStr}${ext}`;
          // Đổi tên file trong hệ thống tập tin
          const oldPath = path.resolve('images/degrees', file.filename);
          const newPath = path.resolve('images/degrees', finalFilename);
          // Đổi tên file
          fs.renameSync(oldPath, newPath);
          logger.info(`Renamed file from ${file.filename} to ${finalFilename}`);
        }
      } catch (error) {
        logger.warn(`Failed to rename file ${file.filename}`, { error: error.message });
        // Tiếp tục xử lý dù đổi tên thất bại
      }
    }
    // Cập nhật tên file vào extractedData
    extractedData.fileAttachment = finalFilename;

    // Kiểm tra các trường bắt buộc
    const requiredFields = ['recipientName', 'recipientDob', 'issueDate', 'serialNumber', 'registryNumber'];
    const missingFields = requiredFields.filter(field => !extractedData[field]);

    if (missingFields.length > 0) {
      logger.info('Extracted data incomplete, returning to frontend', { missingFields, user: req.user?.email });
      return res.status(200).json({
        errCode: 1,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        data: extractedData
      });
    }
    // Tạo đối tượng degreeData
    const degreeData = {
      ...extractedData,
      degreeTypeId,
      issuerId,
      cloudFile: null
    };
    // Tạo degree mới
    const newDegree = await createDegree(degreeData, userId, issuerId);
    logger.info(`Degree created from image successfully`, { id: newDegree._id, user: req.user?.email });
    return res.status(201).json({
      errCode: 0,
      message: 'Degree created successfully from image',
      data: newDegree
    });
  } catch (error) {
    if (req.file) {
      deleteImage(req.file.filename);
    }
    logger.error('Error extracting degree from image', { error: error.message, stack: error.stack, user: req.user?.email });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error extracting degree from image'
    });
  }
};


const importDegreesFromExcel = async (req, res) => {
  try {
    const { issuerId, degreeTypeId } = req.body;
    const userId = req.user.userId;
    const excelFile = req.files["file"]; // Excel file
    const imageFiles = req.files["images"] || []; // Array of uploaded images

    if (!excelFile || !issuerId || !degreeTypeId) {
      if (excelFile) deleteImage(excelFile[0].filename);
      imageFiles.forEach(file => deleteImage(file.filename));
      logger.warn("Missing excel file, issuerId, or degreeTypeId", { user: req.user?.email });
      return res.status(400).json({ errCode: 1, message: "Missing excel file, issuerId, or degreeTypeId" });
    }

    if (!mongoose.isValidObjectId(issuerId) || !mongoose.isValidObjectId(degreeTypeId)) {
      deleteImage(excelFile[0].filename);
      imageFiles.forEach(file => deleteImage(file.filename));
      logger.warn("Invalid issuerId or degreeTypeId", { issuerId, degreeTypeId, user: req.user?.email });
      return res.status(400).json({ errCode: 1, message: "Invalid issuerId or degreeTypeId" });
    }

    const excelPath = path.resolve("images/degrees", excelFile[0].filename);
    logger.info(`Attempting to read Excel file: ${excelPath}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      deleteImage(excelFile[0].filename);
      imageFiles.forEach(file => deleteImage(file.filename));
      logger.warn("Invalid Excel file: No worksheet found", { excelPath });
      return res.status(400).json({ errCode: 1, message: "Invalid Excel file: No worksheet found" });
    }

    // Extract data
    const degrees = [];
    const errors = [];
    const validRows = [];
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber <= 7) {
        logger.debug(`Skipping header row ${rowNumber}`);
        return; // Skip first 7 rows
      }

      // Log raw data from Excel
      logger.debug(`Processing row ${rowNumber}: Raw values = ${JSON.stringify(row.values)}`);
      const degreeData = {
        recipientName: row.getCell(2)?.value?.toString()?.trim() || null,
        placeOfBirth: row.getCell(3)?.value?.toString()?.trim() || "",
        level: row.getCell(4)?.value?.toString()?.trim() || "",
        serialNumber: row.getCell(5)?.value?.toString()?.trim() || null,
        registryNumber: row.getCell(6)?.value?.toString()?.trim() || null,
        placeOfIssue: row.getCell(7)?.value?.toString()?.trim() || "",
        signer: row.getCell(8)?.value?.toString()?.trim() || "",
        recipientDob: row.getCell(9)?.value, // Updated column 9 for Date of Birth
        issueDate: row.getCell(10)?.value,   // Updated column 10 for Issue Date
        fileAttachment: null,                // Will be updated from imageFiles
      };

      // Convert dates with intermediate logging
      const originalRecipientDob = degreeData.recipientDob;
      if (typeof degreeData.recipientDob === 'number') {
        degreeData.recipientDob = convertExcelSerialToDate(degreeData.recipientDob);
        console.log(`Converted recipientDob for row ${rowNumber} from ${originalRecipientDob}:`, degreeData.recipientDob);
      } else if (degreeData.recipientDob instanceof Date && !isNaN(degreeData.recipientDob.getTime())) {
        console.log(`Kept recipientDob for row ${rowNumber} as Date from ${originalRecipientDob}:`, degreeData.recipientDob);
      } else if (degreeData.recipientDob && typeof degreeData.recipientDob === 'string') {
        degreeData.recipientDob = new Date(degreeData.recipientDob);
        console.log(`Converted recipientDob (string) for row ${rowNumber} from ${originalRecipientDob}:`, degreeData.recipientDob);
      } else {
        degreeData.recipientDob = null;
        console.log(`recipientDob set to null for row ${rowNumber} from ${originalRecipientDob}`);
      }

      const originalIssueDate = degreeData.issueDate;
      if (typeof degreeData.issueDate === 'number') {
        degreeData.issueDate = convertExcelSerialToDate(degreeData.issueDate);
        console.log(`Converted issueDate for row ${rowNumber} from ${originalIssueDate}:`, degreeData.issueDate);
      } else if (degreeData.issueDate instanceof Date && !isNaN(degreeData.issueDate.getTime())) {
        console.log(`Kept issueDate for row ${rowNumber} as Date from ${originalIssueDate}:`, degreeData.issueDate);
      } else if (degreeData.issueDate && typeof degreeData.issueDate === 'string') {
        degreeData.issueDate = new Date(degreeData.issueDate);
        console.log(`Converted issueDate (string) for row ${rowNumber} from ${originalIssueDate}:`, degreeData.issueDate);
      } else {
        degreeData.issueDate = null;
        console.log(`issueDate set to null for row ${rowNumber} from ${originalIssueDate}`);
      }

      // Log processed data
      logger.debug(`Processed degreeData for row ${rowNumber}: ${JSON.stringify(degreeData)}`);
      const requiredFields = ["recipientName", "recipientDob", "serialNumber", "registryNumber", "issueDate"];
      const missingFields = requiredFields.filter(
        (field) => !degreeData[field] || (degreeData[field] instanceof Date && isNaN(degreeData[field].getTime()))
      );

      if (missingFields.length > 0 || row.values.every(v => v === null || v === undefined || v === "")) {
        if (missingFields.length > 0) {
          logger.debug(`Row ${rowNumber} invalid: Missing fields = ${missingFields.join(", ")}`);
          errors.push(`Row ${rowNumber}: Missing or invalid: ${missingFields.join(", ")}`);
        }
      } else {
        degrees.push({ ...degreeData, degreeTypeId, issuerId });
        validRows.push({ rowNumber, serialNumber: degreeData.serialNumber || degreeData.registryNumber });
        logger.debug(`Row ${rowNumber} added to degrees array`, { degreeData });
      }
    });

    // Log number of valid rows
    console.log(`Valid rows before image check:`, validRows);
    logger.debug(`Valid rows: ${JSON.stringify(validRows)}`);
    if (imageFiles.length > 0) {
      if (imageFiles.length !== validRows.length) {
        deleteImage(excelFile[0].filename);
        imageFiles.forEach(file => deleteImage(file.filename));
        logger.warn("Number of images does not match the number of valid rows in the Excel file", {
          imageCount: imageFiles.length,
          rowCount: validRows.length,
          user: req.user?.email,
        });
        return res.status(400).json({
          errCode: 1,
          message: `Number of images (${imageFiles.length}) does not match the number of valid rows in Excel (${validRows.length}). Please check again.`,
        });
      }

      // Assign and rename fileAttachment from imageFiles
      validRows.forEach((row, index) => {
        const degree = degrees.find(d => d.serialNumber === row.serialNumber || d.registryNumber === row.serialNumber);
        if (degree && imageFiles[index]) {
          const newFilename = renameImageFile(imageFiles[index].filename, degree.serialNumber, degree.issueDate);
          degree.fileAttachment = newFilename;
          logger.info(`Assigned and renamed image ${newFilename} to row ${row.rowNumber}`);
        }
      });
    }

    // Delete Excel file after reading
    deleteImage(excelFile[0].filename);
    // Do not delete imageFiles as they have been renamed and saved

    if (degrees.length === 0) {
      logger.warn("No valid data found in Excel file", { errors });
      return res.status(400).json({
        errCode: 1,
        message: "No valid data found in Excel file",
        data: { errors },
      });
    }

    // Create degrees
    let successCount = 0;
    for (const degree of degrees) {
      try {
        logger.debug(`Attempting to create degree`, { degreeData: degree });
        await createDegree(degree, userId, issuerId);
        successCount++;
        logger.info(`Successfully created degree for row ${degrees.indexOf(degree) + 8}`);
      } catch (error) {
        logger.error(`Failed to create degree for row ${degrees.indexOf(degree) + 8}`, { error: error.message });
        errors.push(`Row ${degrees.indexOf(degree) + 8}: ${error.message}`);
      }
    }

    logger.info(`Imported ${successCount} degrees from Excel`, { user: req.user?.email });
    return res.status(201).json({
      errCode: 0,
      message: "Import completed",
      data: { successCount, errors },
    });
  } catch (error) {
    if (req.files["file"]) deleteImage(req.files["file"][0].filename);
    if (req.files["images"]) req.files["images"].forEach(file => deleteImage(file.filename));
    logger.error("Error importing degrees from Excel", { error: error.message, stack: error.stack, user: req.user?.email });
    return res.status(400).json({
      errCode: 1,
      message: error.message || "Error importing degrees from Excel",
    });
  }
};

// Function to convert Excel serial number to date
const convertExcelSerialToDate = (serial) => {
  if (!serial || isNaN(serial)) return null;
  const excelEpoch = new Date(1899, 11, 30); // Excel's epoch date
  const date = new Date(excelEpoch.getTime() + (serial - 1) * 86400000); // Convert to milliseconds
  return isNaN(date.getTime()) ? null : date;
};

// Function to rename image file
const renameImageFile = (oldFilename, serialNumber, issueDate) => {
    try {
        const formattedDate = new Date(issueDate);
        if (isNaN(formattedDate.getTime())) {
            logger.warn('Invalid issueDate for renaming', { issueDate });
            return oldFilename; // Keep original name if date is invalid
        }
        const dateStr = formattedDate.toISOString().slice(0, 10).replace(/-/g, '');
        const ext = path.extname(oldFilename);
        const finalFilename = `${serialNumber}_${dateStr}${ext}`;
        const oldPath = path.resolve('images/degrees', oldFilename);
        const newPath = path.resolve('images/degrees', finalFilename);

        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            logger.info(`Renamed file from ${oldFilename} to ${finalFilename}`);
            return finalFilename;
        } else {
            logger.warn(`Original file not found for renaming: ${oldPath}`);
            return oldFilename;
        }
    } catch (error) {
        logger.warn(`Failed to rename file ${oldFilename}`, { error: error.message });
        return oldFilename; // Keep original name if error occurs
    }
};

const getListDegreesAPI = async (req, res) => {
  try {
    const { email } = req.user;
    const { page = 1, limit = 10, search = '', status = '', issuerId = '', sort = 'desc' } = req.query;

    // Log incoming request for debugging
    logger.debug(`Received request for degrees`, { email, query: req.query });

    // Fetch user information by email
    const user = await userModel.getUserByEmailAPI(email);
    if (!user) {
      logger.error(`User not found with email: ${email}`);
      return res.status(400).json({
        errCode: 1,
        message: 'User not found with provided email',
      });
    }

    // Prepare issuerId based on role
    let effectiveIssuerId = '';
    if (user.roleid === 3) { // Admin
      if (issuerId && mongoose.isValidObjectId(issuerId)) {
        effectiveIssuerId = issuerId; // Use issuerId from query if valid
      }
    } else if (user.roleid === 2) { // Manager
      if (!user.issuerId) {
        logger.error(`Manager ${email} has no associated issuerId`);
        return res.status(400).json({
          errCode: 1,
          message: 'Manager has no associated issuerId',
        });
      }
      effectiveIssuerId = user.issuerId.toString(); // Force use manager's issuerId
    } else {
      logger.error(`User ${email} does not have permission to view degrees`, { roleid: user.roleid });
      return res.status(403).json({
        errCode: 1,
        message: 'Permission denied',
      });
    }

    // Log effective query parameters
    logger.debug(`Fetching degrees with params`, {
      userId: user._id.toString(),
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      effectiveIssuerId,
      sort,
      role: user.roleid === 3 ? 'admin' : 'manager',
    });

    // Fetch degrees with role-based filtering
    const result = await getListDegrees(
      user._id.toString(),
      parseInt(page),
      parseInt(limit),
      search,
      status,
      effectiveIssuerId,
      sort
    );

    // Log result details
    logger.info(`Fetched ${result.degrees.length} degrees`, {
      query: { search, status, effectiveIssuerId, sort },
      user: email,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    });

    // If no degrees found, include a warning in the response
    if (result.degrees.length === 0) {
      logger.warn(`No degrees found for query`, {
        query: { search, status, effectiveIssuerId, sort },
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


// hàm cần cập nhật trong tương lai
const deleteDegreeAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await deleteDegree(id, userId);
    logger.info(`Degree deleted successfully`, { id, user: req.user?.email });
    return res.status(200).json({ errCode: 0, message: result.message });
  } catch (error) {
    logger.error(`Error deleting degree`, { error, user: req.user?.email });
    return res.status(400).json({ errCode: 1, message: error.message || 'Error deleting degree' });
  }
};


export default {
  getDegreeByIdAPI,
  getDegreesByFilterAPI,
  createDegreeAPI,
  getDegreeTypesByIssuerAPI,
  extractDegreeFromImageAPI,
  importDegreesFromExcel,
  getListDegreesAPI,
  deleteDegreeAPI
};