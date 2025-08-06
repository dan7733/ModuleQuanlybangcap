import { Storage } from 'megajs';
import fs from 'fs';
import path from 'path';
import logger from '../configs/logger.js';
import dotenv from "dotenv/config";

const uploadToMega = async (filePath, fileName) => {
  let fileStream = null;
  try {
    // Khởi tạo Storage với thông tin đăng nhập
    const storage = new Storage({
      email: process.env.MEGA_EMAIL,
      password: process.env.MEGA_PASSWORD,
    });

    // Chờ Storage sẵn sàng
    await storage.ready;

    // Tạo stream đọc tệp
    fileStream = fs.createReadStream(filePath);
    const fileSize = fs.statSync(filePath).size;

    // Tải tệp lên Mega.nz
    const upload = storage.upload({
      name: fileName,
      size: fileSize,
    }, fileStream);

    // Chờ tải lên hoàn tất
    await new Promise((resolve, reject) => {
      upload.on('error', reject);
      upload.on('complete', resolve);
    });

    logger.info(`Uploaded file to Mega.nz: ${fileName}`);
    return fileName; // Trả về tên file
  } catch (error) {
    logger.error(`Failed to upload file to Mega.nz: ${fileName}`, { error: error.message });
    throw new Error(`Failed to upload file to Mega.nz: ${error.message}`);
  } finally {
    // Đóng stream nếu đã mở
    if (fileStream) {
      fileStream.close();
    }
  }
};

const downloadFromMega = async (fileName, destinationPath) => {
  let fileStream = null;
  let writeStream = null;
  try {
    // Khởi tạo Storage với thông tin đăng nhập
    const storage = new Storage({
      email: process.env.MEGA_EMAIL,
      password: process.env.MEGA_PASSWORD,
    });

    // Chờ Storage sẵn sàng
    await storage.ready;

    // Tìm file theo tên trong Mega.nz
    let file = null;
    for (const fileId in storage.files) {
      if (storage.files[fileId].name === fileName) {
        file = storage.files[fileId];
        break;
      }
    }

    if (!file) {
      logger.error(`File not found on Mega.nz: ${fileName}`);
      throw new Error(`File not found on Mega.nz: ${fileName}`);
    }

    // Tạo stream để tải file
    fileStream = file.download();
    writeStream = fs.createWriteStream(destinationPath);

    // Chờ tải xuống hoàn tất
    await new Promise((resolve, reject) => {
      fileStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      fileStream.on('error', reject);
    });

    logger.info(`Downloaded file from Mega.nz: ${fileName} to ${destinationPath}`);
    return fileName; // Trả về tên file
  } catch (error) {
    logger.error(`Failed to download file from Mega.nz: ${fileName}`, { error: error.message });
    throw new Error(`Failed to download file from Mega.nz: ${error.message}`);
  } finally {
    // Đóng các stream nếu đã mở
    if (fileStream) {
      fileStream.destroy();
    }
    if (writeStream) {
      writeStream.close();
    }
  }
};

const deleteFromMega = async (fileName, permanent = false) => {
  try {
    // Khởi tạo Storage với thông tin đăng nhập
    const storage = new Storage({
      email: process.env.MEGA_EMAIL,
      password: process.env.MEGA_PASSWORD,
    });

    // Chờ Storage sẵn sàng
    await storage.ready;

    // Tìm file theo tên trong Mega.nz
    const file = storage.find(fileName);
    if (!file) {
      logger.error(`File not found on Mega.nz: ${fileName}`);
      throw new Error(`File not found on Mega.nz: ${fileName}`);
    }

    // Xóa file với tùy chọn permanent
    await file.delete(permanent);

    logger.info(`Deleted file from Mega.nz: ${fileName}`, { permanent });
    return true; // Trả về true khi xóa thành công
  } catch (error) {
    logger.error(`Failed to delete file from Mega.nz: ${fileName}`, { error: error.message, permanent });
    throw new Error(`Failed to delete file from Mega.nz: ${error.message}`);
  }
};

export { uploadToMega, downloadFromMega, deleteFromMega };