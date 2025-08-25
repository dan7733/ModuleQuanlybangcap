import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './resetpassword.module.css';
import logo from '../../assets/logo/logoDHCT.png';

const ResetPassword = () => {
  const [token, setToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token: urlToken } = useParams();
  const navigate = useNavigate();

  const validateToken = useCallback(async (token) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/reset-password/${token}`);
      const data = response.data;
      if (data.errCode === 0) {
        setToken(token);
        setTokenError('');
      } else {
        setTokenError('Mã thông báo đặt lại mật khẩu không hợp lệ!');
        setTimeout(() => navigate('/'), 3000);
      }
    } catch (error) {
      setTokenError('Đã xảy ra lỗi. Vui lòng thử lại sau!');
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let timer;
    if (urlToken) {
      validateToken(urlToken);
    } else {
      setTokenError('Liên kết không hợp lệ. Vui lòng thử lại!');
      setIsLoading(false);
      timer = setTimeout(() => navigate('/'), 3000);
    }
    return () => clearTimeout(timer);
  }, [urlToken, validateToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    if (newPassword !== confirmPassword) {
      setFormError('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      setIsSubmitting(false);
      return;
    }
    if (newPassword.length <= 8) {
      setFormError('Mật khẩu phải có hơn 8 ký tự!');
      setIsSubmitting(false);
      return;
    }
    if (!/\d/.test(newPassword)) {
      setFormError('Mật khẩu phải chứa ít nhất một số!');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/reset-password`, {
        token,
        newPassword,
        confirmPassword,
      });
      const data = response.data;
      if (data.errCode === 0) {
        setSuccessMessage('Đổi mật khẩu thành công');
        setFormError('');
        setNewPassword('');
        setConfirmPassword('');
        setToken(null);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setFormError(data.message);
      }
    } catch (error) {
      setFormError('Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <h4>ĐẠI HỌC CẦN THƠ</h4>
        <h6>CAN THO UNIVERSITY</h6>
        <div className={styles.formBox}>
          <h6>ĐỔI MẬT KHẨU</h6>
          {isLoading ? (
            <div className={styles.loader}>
              <span className={styles.spinner}></span>
              <p>Đang xác thực liên kết...</p>
            </div>
          ) : tokenError ? (
            <div className={styles.errorMessage}>
              <p>{tokenError}</p>
              <p className={styles.secondaryMessage}>Đang chuyển hướng về trang chủ...</p>
            </div>
          ) : successMessage ? (
            <div className={styles.successMessage}>
              <p>{successMessage}</p>
              <p className={styles.secondaryMessage}>Đang chuyển hướng đến trang đăng nhập...</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                {formError && (
                  <div className={styles.errorMessage}>{formError}</div>
                )}
                <div className={styles.inputGroup}>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="Mật Khẩu Mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    aria-label="Mật Khẩu Mới"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="Xác Nhận Mật Khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    aria-label="Xác Nhận Mật Khẩu"
                  />
                </div>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                  aria-label="Đổi Mật Khẩu"
                >
                  {isSubmitting ? (
                    <span className={styles.spinner}>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Đang xử lý...
                    </span>
                  ) : (
                    'Đổi Mật Khẩu'
                  )}
                </button>
              </form>
              <div className={styles.linkContainer}>
                <Link to="/lookup" className={styles.link}>← Quay lại trang tra cứu</Link>
              </div>
            </>
          )}
        </div>
        {!isLoading && !tokenError && !successMessage && (
          <div className={styles.requirements}>
            <h6>YÊU CẦU MẬT KHẨU</h6>
            <ul>
              <li>Mật khẩu phải có hơn 8 ký tự</li>
              <li>Mật khẩu phải chứa ít nhất một số</li>
            </ul>
          </div>
        )}
        <div className={styles.footer}>
          <small>
            All Rights Reserved. Developed by <Link to="#" className={styles.link}>CTU Soft</Link>
          </small>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;