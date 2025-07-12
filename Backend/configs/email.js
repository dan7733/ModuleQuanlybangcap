import nodemailer from 'nodemailer';
import dotenv from 'dotenv/config';
import logger from './logger.js';
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for port 465, false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.REACT_URL}/reset-password/${resetToken}`;
    const mailOptions = {
      from: `"CUSC Degree Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Yêu Cầu Đặt Lại Mật Khẩu - Hệ Thống Quản Lý Bằng Cấp CUSC',
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background-color: #005B99;
              color: #ffffff;
              padding: 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 20px;
              color: #333333;
            }
            .content h3 {
              color: #005B99;
              font-size: 20px;
              margin-top: 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #005B99;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .button:hover {
              background-color: #00477a;
            }
            .footer {
              background-color: #f4f4f4;
              padding: 10px;
              text-align: center;
              font-size: 12px;
              color: #666666;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Hệ Thống Quản Lý Bằng Cấp CUSC</h1>
            </div>
            <div class="content">
              <h3>Đặt Lại Mật Khẩu</h3>
              <p>Xin chào,</p>
              <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình trên Hệ Thống Quản Lý Bằng Cấp CUSC (Trung Tâm Công Nghệ Phần Mềm - Trường Đại Học Cần Thơ). Vui lòng nhấp vào nút dưới đây để đặt lại mật khẩu. Liên kết này sẽ hết hạn sau 1 giờ:</p>
              <a href="${resetUrl}" class="button">Đặt Lại Mật Khẩu</a>
              <p>Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
              <p>Trân trọng,<br>Trung Tâm Công Nghệ Phần Mềm CUSC</p>
            </div>
            <div class="footer">
              <p>Trường Đại Học Cần Thơ - Trung Tâm Công Nghệ Phần Mềm</p>
              <p>Email hỗ trợ: <a href="mailto:support@cusc.ctu.edu.vn">support@cusc.ctu.edu.vn</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw error;
  }
};

export { sendPasswordResetEmail };