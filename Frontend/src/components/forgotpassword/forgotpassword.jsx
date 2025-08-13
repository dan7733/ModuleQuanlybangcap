import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './forgotpassword.module.css';
import logo from '../../assets/logo/logoDHCT.png';
import bgImage from '../../assets/background/TruongDHCT.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Hàm ánh xạ thông báo từ server sang tiếng Việt (lỗi và thành công)
  const translateServerMessage = (englishMessage) => {
    const messageTranslations = {
      'Please provide an email!': 'Vui lòng cung cấp email!',
      'Email not found!': 'Email không tồn tại trong hệ thống!',
      'Invalid email format!': 'Định dạng email không hợp lệ!',
      'User not found!': 'Người dùng không tồn tại!',
      'Account not activated!': 'Tài khoản chưa được kích hoạt!',
      'Password reset email has been sent!': 'Email đặt lại mật khẩu đã được gửi!',
      'Server error': 'Lỗi máy chủ, vui lòng thử lại sau!',
      // Thêm các thông báo khác nếu cần
    };
    return messageTranslations[englishMessage] || 'Có lỗi xảy ra. Vui lòng thử lại sau!';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Kiểm tra email cục bộ
    if (!email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    setErrors(newErrors);
    setSuccessMessage('');
    setErrorMessage('');

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/v1/forgot-password`,
          { email },
          { headers: { 'Content-Type': 'application/json' } }
        );

        // Ghi log phản hồi từ server để debug
        console.log('Server response:', response.data);

        if (response.data.errCode === 0) {
          setSuccessMessage(translateServerMessage(response.data.message));
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setErrorMessage(translateServerMessage(response.data.message));
        }
      } catch (error) {
        // Ghi log lỗi để debug
        console.error('Error response:', error.response?.data || error.message);

        setErrorMessage(
          translateServerMessage(error.response?.data?.message || 'Server error')
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`container-fluid ${styles.loginContainer}`}>
      <div className="row g-0">
        {/* Hình nền bên trái */}
        <div
          className={`col-md-8 ${styles.leftImage}`}
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>

        {/* Form bên phải */}
        <div className={`col-md-4 ${styles.rightPanel}`}>
          <div className="w-100 px-3 text-center">
            <img src={logo} alt="Logo" className={styles.logo} />
            <h4 className="fw-bold mb-1">ĐẠI HỌC CẦN THƠ</h4>
            <h6 className="mb-4">CAN THO UNIVERSITY</h6>

            <div className={`${styles.loginBox} mx-auto`}>
              <h6 className="fw-bold mb-3">QUÊN MẬT KHẨU</h6>
              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="mb-2 text-start">
                  <input
                    type="email"
                    className={`form-control ${styles.input} ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="Nhập email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                </div>

                {/* Nút gửi yêu cầu */}
                <button
                  type="submit"
                  className={`btn ${styles.btnLogin} w-100 mb-2`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className={styles.spinner}>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Đang gửi...
                    </span>
                  ) : (
                    'Gửi yêu cầu'
                  )}
                </button>

                {/* Hiển thị thông báo thành công */}
                {successMessage && (
                  <div className="alert alert-success mt-2 py-2 small" role="alert">
                    {successMessage}
                  </div>
                )}

                {/* Hiển thị thông báo lỗi */}
                {errorMessage && (
                  <div className="alert alert-danger mt-2 py-2 small" role="alert">
                    {errorMessage}
                  </div>
                )}

                <div className="small mt-3">
                  <Link to="/login" className={styles.link}>← Quay lại đăng nhập</Link>
                </div>
              </form>
            </div>

            <div className="text-center mt-4">
              <small>
                All Rights Reserved. Developed by <Link to="#" className={styles.link}>CTU Soft</Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;