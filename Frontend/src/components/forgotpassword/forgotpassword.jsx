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

  // Hàm ánh xạ thông báo từ server sang tiếng Việt
  const translateServerMessage = (englishMessage) => {
    const messageTranslations = {
      'Please provide an email!': 'Vui lòng cung cấp email!',
      'Email not found!': 'Email không tồn tại trong hệ thống!',
      'Invalid email format!': 'Định dạng email không hợp lệ!',
      'User not found!': 'Người dùng không tồn tại!',
      'Account not activated!': 'Tài khoản chưa được kích hoạt!',
      'Password reset email has been sent!': 'Email đặt lại mật khẩu đã được gửi!',
      'Server error': 'Lỗi máy chủ, vui lòng thử lại sau!',
    };
    return messageTranslations[englishMessage] || 'Có lỗi xảy ra. Vui lòng thử lại sau!';
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setIsLoading(true);

    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/forgot-password`,
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('Server response:', response.data, { timestamp: new Date().toISOString() });

      if (response.data.errCode === 0) {
        setSuccessMessage(translateServerMessage(response.data.message));
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setErrorMessage(translateServerMessage(response.data.message));
      }
    } catch (error) {
      console.error('Error response:', error.response?.data || error.message, {
        timestamp: new Date().toISOString(),
      });
      setErrorMessage(
        translateServerMessage(error.response?.data?.message || 'Server error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.loginContainer}`}>
      <div className="row g-0 min-vh-100">
        <div
          className={`col-md-8 ${styles.leftImage}`}
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
        <div className="col-md-4 d-flex align-items-center justify-content-center">
          <div className="w-100 px-3 text-center">
            <img src={logo} alt="Logo" className={styles.logo} />
            <h4 className="fw-bold mb-1">ĐẠI HỌC CẦN THƠ</h4>
            <h6 className="mb-4">CAN THO UNIVERSITY</h6>
            <div className={`${styles.loginBox} mx-auto`}>
              <h6 className="fw-bold mb-3">QUÊN MẬT KHẨU</h6>
              {successMessage && (
                <div className="alert alert-success mt-2 py-2 small" role="alert">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="alert alert-danger mt-2 py-2 small" role="alert">
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3 text-start">
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
                <button
                  type="submit"
                  className={`btn ${styles.btnLogin} w-100 mb-2`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    'Gửi yêu cầu'
                  )}
                </button>
                <div className="small mt-3">
                  <Link to="/login" className={styles.link}>
                    ← Quay lại đăng nhập
                  </Link>
                </div>
              </form>
            </div>
            <div className="text-center mt-4">
              <small>
                All Rights Reserved. Developed by{' '}
                <Link to="/" className={styles.link}>
                  CUSC
                </Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;