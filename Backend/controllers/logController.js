import { getLogFiles, getLogContent } from '../models/logModel.js';
import logger from '../configs/logger.js';

const getLogFilesAPI = async (req, res) => {
  try {
    logger.debug('Received request for log files', { url: req.url, method: req.method });
    const files = await getLogFiles();
    logger.info('Fetched log files successfully', { count: files.length });
    return res.status(200).json({
      errCode: 0,
      data: files,
    });
  } catch (error) {
    logger.error('Error fetching log files', { error, url: req.url });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error fetching log files',
    });
  }
};

const getLogContentAPI = async (req, res) => {
  try {
    logger.debug('Received request for log content', { url: req.url, params: req.params });
    const { filename } = req.params;
    const content = await getLogContent(filename);
    logger.info(`Fetched log content for ${filename}`, { lines: content.length });
    return res.status(200).json({
      errCode: 0,
      data: content,
    });
  } catch (error) {
    logger.error(`Error fetching log content for ${req.params.filename}`, { error, url: req.url });
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Error fetching log content',
    });
  }
};


export default {
  getLogFilesAPI,
  getLogContentAPI
}