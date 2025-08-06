import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import logger from '../configs/logger.js';
import { uploadToMega, downloadFromMega, deleteFromMega } from '../configs/uploadToMega.js';
import { getDegreeByIdForSync, updateDegreeCloudFile, updateDegreeFileAttachment } from '../models/degreeModel.js';

const deleteImage = (filename) => {
  if (!filename || typeof filename !== 'string') {
    logger.warn('No valid filename provided for deletion');
    return false;
  }

  try {
    const filePath = path.resolve('images/degrees', path.basename(filename));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Deleted image file: ${filePath}`);
      return true;
    } else {
      logger.warn(`File not found for deletion: ${filePath}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error deleting image: ${filename}`, { error: error.message });
    return false;
  }
};

const uploadDegreeToMegaAPI = async (req, res) => {
  const { degreeId } = req.params;
  const { fileAttachment } = req.body;
  const userId = req.user.userId;

  try {
    // Validate degree ID
    if (!mongoose.isValidObjectId(degreeId)) {
      logger.error(`Invalid Degree ID: ${degreeId}`);
      return res.status(400).json({ errCode: 1, message: 'Invalid Degree ID' });
    }

    // Fetch degree and check permissions
    const degree = await getDegreeByIdForSync(degreeId, userId);
    if (!degree) {
      logger.error(`Degree not found with id: ${degreeId}`);
      return res.status(404).json({ errCode: 1, message: 'Degree not found' });
    }

    const filePath = path.resolve('images/degrees', path.basename(fileAttachment));
    logger.info(`Checking file existence: ${filePath}, exists: ${fs.existsSync(filePath)}`);
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found: ${filePath}`);
      return res.status(400).json({ errCode: 1, message: 'Local file not found' });
    }

    const cloudFile = await uploadToMega(filePath, fileAttachment);
    await updateDegreeCloudFile(degreeId, cloudFile);

    logger.info(`Uploaded file to Mega.nz for degree ${degreeId}, local file retained`, { cloudFile, user: req.user?.email });
    return res.status(200).json({
      errCode: 0,
      message: 'File uploaded to Mega.nz successfully',
      data: { cloudFile },
    });
  } catch (error) {
    logger.error(`Error uploading file to Mega.nz for degree ${degreeId}: ${error.message}`, { stack: error.stack });
    return res.status(400).json({ errCode: 1, message: `Error uploading file to Mega.nz: ${error.message}` });
  }
};

const syncDegreeFileAPI = async (req, res) => {
  const { degreeId } = req.params;
  const userId = req.user.userId;

  try {
    // Validate degree ID
    if (!mongoose.isValidObjectId(degreeId)) {
      logger.error(`Invalid Degree ID: ${degreeId}`);
      return res.status(400).json({ errCode: 1, message: 'Invalid Degree ID' });
    }

    // Fetch degree and check permissions
    const degree = await getDegreeByIdForSync(degreeId, userId);
    if (!degree) {
      logger.error(`Degree not found with id: ${degreeId}`);
      return res.status(404).json({ errCode: 1, message: 'Degree not found' });
    }

    if (degree.cloudFile) {
      try {
        const filePath = path.resolve('images/degrees', path.basename(degree.cloudFile));
        logger.info(`Checking file path for sync: ${filePath}, exists: ${fs.existsSync(filePath)}`);

        // Delete existing local file if it exists
        if (degree.fileAttachment) {
          const deleted = deleteImage(degree.fileAttachment);
          if (!deleted && fs.existsSync(path.resolve('images/degrees', degree.fileAttachment))) {
            logger.error(`Failed to delete existing local file: ${degree.fileAttachment}`);
            return res.status(500).json({ errCode: 1, message: 'Failed to delete existing local file' });
          }
        }

        // Download file from Mega.nz
        await downloadFromMega(degree.cloudFile, filePath);

        // Update fileAttachment to match cloudFile
        await updateDegreeFileAttachment(degreeId, degree.cloudFile);

        logger.info(`Synced file from Mega.nz to local for degree ${degreeId}`, { cloudFile: degree.cloudFile, user: req.user?.email });
        return res.status(200).json({
          errCode: 0,
          message: 'File synced from Mega.nz to local successfully',
          data: { fileAttachment: degree.cloudFile, cloudFile: degree.cloudFile },
        });
      } catch (error) {
        logger.error(`Error syncing file from Mega.nz for degree ${degreeId}: ${error.message}`, { stack: error.stack });
        return res.status(400).json({ errCode: 1, message: `Error syncing file from Mega.nz: ${error.message}` });
      }
    } else if (degree.fileAttachment) {
      const filePath = path.resolve('images/degrees', path.basename(degree.fileAttachment));
      logger.info(`Checking file path for sync: ${filePath}, exists: ${fs.existsSync(filePath)}`);
      if (!fs.existsSync(filePath)) {
        logger.error(`File not found: ${filePath}`);
        return res.status(400).json({ errCode: 1, message: 'Local file not found' });
      }

      const cloudFile = await uploadToMega(filePath, degree.fileAttachment);
      await updateDegreeCloudFile(degreeId, cloudFile);

      logger.info(`Uploaded file to Mega.nz for degree ${degreeId}`, { cloudFile, user: req.user?.email });
      return res.status(200).json({
        errCode: 0,
        message: 'File uploaded to Mega.nz successfully',
        data: { cloudFile, fileAttachment: degree.fileAttachment },
      });
    } else {
      logger.error(`No file to sync for degree ${degreeId}`);
      return res.status(400).json({ errCode: 1, message: 'No file to sync (neither cloudFile nor fileAttachment exists)' });
    }
  } catch (error) {
    logger.error(`Error syncing file for degree ${degreeId}: ${error.message}`, { stack: error.stack });
    return res.status(400).json({ errCode: 1, message: `Error syncing file: ${error.message}` });
  }
};

const reuploadDegreeFileAPI = async (req, res) => {
  try {
    const { id: degreeId } = req.params; // Match route parameter
    const userId = req.user.userId;
    const { fileAttachment } = req.body; // Accept fileAttachment from request body
    logger.info(`Reuploading file for degree: ${degreeId}, user: ${userId}, provided fileAttachment: ${fileAttachment}`);

    // Validate degree ID
    if (!mongoose.isValidObjectId(degreeId)) {
      logger.error(`Invalid Degree ID: ${degreeId}`);
      return res.status(400).json({ errCode: 1, message: 'Invalid Degree ID' });
    }

    // Fetch degree and check permissions
    const degree = await getDegreeByIdForSync(degreeId, userId);
    if (!degree) {
      logger.error(`Degree not found with id: ${degreeId}`);
      return res.status(404).json({ errCode: 1, message: 'Degree not found' });
    }
    if (degree.status !== 'Approved') {
      logger.error(`Degree not approved with id: ${degreeId}`);
      return res.status(400).json({ errCode: 1, message: 'Degree not approved' });
    }

    // Use provided fileAttachment or fall back to degree.fileAttachment
    const targetFileAttachment = fileAttachment || degree.fileAttachment;
    if (!targetFileAttachment) {
      logger.error(`No local file to reupload for degree: ${degreeId}`);
      return res.status(400).json({ errCode: 1, message: 'No local file to reupload' });
    }

    // Delete existing cloud file if it exists
    if (degree.cloudFile) {
      try {
        logger.info(`Attempting to delete cloud file: ${degree.cloudFile}`);
        await deleteFromMega(degree.cloudFile);
        await updateDegreeCloudFile(degreeId, null);
        logger.info(`Deleted existing cloud file for degree ${degreeId}`, { cloudFile: degree.cloudFile });
      } catch (err) {
        logger.error(`Failed to delete cloud file ${degree.cloudFile}: ${err.message}`, { stack: err.stack });
        return res.status(500).json({ errCode: 1, message: `Error deleting file from Mega.nz: ${err.message}` });
      }
    }

    // Upload local file to Mega.nz
    try {
      const filePath = path.resolve('images/degrees', path.basename(targetFileAttachment));
      logger.info(`Checking file existence for reupload: ${filePath}, exists: ${fs.existsSync(filePath)}`);
      if (!fs.existsSync(filePath)) {
        logger.error(`Local file not found: ${filePath}`);
        return res.status(400).json({ errCode: 1, message: 'Local file not found' });
      }

      const cloudFile = await uploadToMega(filePath, targetFileAttachment);
      await updateDegreeCloudFile(degreeId, cloudFile);
      logger.info(`Reuploaded file to Mega.nz for degree ${degreeId}`, { cloudFile });

      return res.status(200).json({
        errCode: 0,
        message: 'File reuploaded to Mega.nz successfully',
        data: { ...degree, cloudFile, fileAttachment: targetFileAttachment }, // Remove toObject
      });
    } catch (err) {
      logger.error(`Error uploading file to Mega.nz for degree ${degreeId}: ${err.message}`, { stack: err.stack });
      return res.status(500).json({ errCode: 1, message: `Error uploading file to Mega.nz: ${err.message}` });
    }
  } catch (err) {
    logger.error(`Error reuploading file for degree ${degreeId}: ${err.message}`, { stack: err.stack });
    return res.status(500).json({ errCode: 1, message: `Error reuploading file: ${err.message}` });
  }
};

export default {
  uploadDegreeToMegaAPI,
  syncDegreeFileAPI,
  reuploadDegreeFileAPI,
};