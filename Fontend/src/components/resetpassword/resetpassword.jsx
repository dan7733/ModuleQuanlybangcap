import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './resetpassword.module.css';

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
        setTimeout(() => navigate('/login'), 3000); // Redirect to login after 3 seconds
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
    <div className={styles.background}>
      <div className={styles.overlay}></div>
      <div className={`${styles.container} ${tokenError ? styles['has-error'] : ''}`}>
        <div className={styles.card}>
          <h2>Đổi Mật Khẩu</h2>
          {isLoading ? (
            <div className={styles.loader}>
              <div className={styles.spinner}></div>
              <p>Đang xác thực liên kết...</p>
            </div>
          ) : tokenError ? (
            <>
              <p className={styles.error}>
                {tokenError} <br />
                <span>Đang chuyển hướng về trang chủ...</span>
              </p>
              <p className={styles.secondaryMessage}>
                Vui lòng kiểm tra lại liên kết hoặc liên hệ hỗ trợ nếu vấn đề tiếp diễn.
              </p>
            </>
          ) : successMessage ? (
            <p className={styles.success}>
              Đổi mật khẩu thành công <br />
              <span>Đang chuyển hướng đến trang đăng nhập...</span>
            </p>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                {formError && (
                  <p className={styles.formError}>
                    {formError}
                  </p>
                )}
                <input
                  type="password"
                  placeholder="Mật Khẩu Mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  aria-label="Mật Khẩu Mới"
                />
                <input
                  type="password"
                  placeholder="Xác Nhận Mật Khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  aria-label="Xác Nhận Mật Khẩu"
                />
                <button type="submit" disabled={isSubmitting} aria-label="Đổi Mật Khẩu">
                  {isSubmitting ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
                </button>
              </form>
              <Link to="/lookup" className={styles.backLink}>
                Quay lại trang tra cứu
              </Link>
            </>
          )}
        </div>
        {isLoading ? (
          <div className={styles.alternativeMessage}>
            <div className={styles.spinner}></div>
            <p>Đang tải yêu cầu mật khẩu...</p>
          </div>
        ) : tokenError ? (
          <div className={styles.alternativeMessage}>
            <p>Hệ thống đang xử lý, vui lòng chờ trong giây lát hoặc thử lại sau.</p>
          </div>
        ) : (
          <div className={styles.requirements}>
            <h3>
              Yêu Cầu <span>Mật Khẩu</span>
            </h3>
            <ul>
              <li>Mật khẩu phải có hơn 8 ký tự</li>
              <li>Mật khẩu phải chứa ít nhất một số</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;