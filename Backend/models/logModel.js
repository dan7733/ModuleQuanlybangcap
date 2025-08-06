import fs from 'fs/promises';
import path from 'path';
import logger from '../configs/logger.js';

const LOG_DIR = path.join(__dirname, '../logs');

// Lấy danh sách file log
const getLogFiles = async () => {
  try {
    logger.debug('Attempting to read log directory', { directory: LOG_DIR });
    const files = await fs.readdir(LOG_DIR);
    logger.debug('Directory contents', { files });
    const logFiles = files.filter(file => file.startsWith('application-') || file.startsWith('error-'));
    if (logFiles.length === 0) {
      logger.warn('No log files found in directory', { directory: LOG_DIR });
    }
    return logFiles;
  } catch (error) {
    logger.error('Error reading log directory', { error, directory: LOG_DIR });
    throw new Error(`Error reading log files: ${error.message}`);
  }
};

// Đọc nội dung file log
const getLogContent = async (filename) => {
  try {
    logger.debug(`Attempting to read log file ${filename}`, { filePath: path.join(LOG_DIR, filename) });
    const filePath = path.join(LOG_DIR, filename);
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    logger.debug(`Successfully read ${lines.length} lines from ${filename}`);
    return lines;
  } catch (error) {
    logger.error(`Error reading log file ${filename}`, { error, filePath: path.join(LOG_DIR, filename) });
    throw new Error(`Error reading log file ${filename}: ${error.message}`);
  }
};

export { getLogFiles, getLogContent };