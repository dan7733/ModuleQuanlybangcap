import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './changpassword.module.css'; // Sửa đường dẫn CSS
import { Context } from '../../login/context';
import CryptoJS from 'crypto-js';

const getAccessToken = () => {
  const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userData) return null;
  try {
    const user = JSON.parse(CryptoJS.AES.decrypt(userData, process.env.REACT_APP_STORAGE_SECRET).toString(CryptoJS.enc.Utf8));
    return user?.accessToken || null;
  } catch {
    return null;
  }
};

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(Context);

  // Kiểm tra xác thực
  useEffect(() => {
    if (!user || !user.auth) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  // Ánh xạ thông báo lỗi từ tiếng Anh sang tiếng Việt
  const mapErrorMessage = (message) => {
    switch (message) {
      case 'Please provide current password, new password, and confirm password!':
        return 'Vui lòng cung cấp đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu.';
      case 'New password and confirm password do not match!':
        return 'Mật khẩu mới và xác nhận mật khẩu không khớp.';
      case 'Password must be more than 8 characters long!':
        return 'Mật khẩu mới phải dài hơn 8 ký tự.';
      case 'Password must contain at least one number!':
        return 'Mật khẩu mới phải chứa ít nhất một số.';
      case 'User not found!':
        return 'Không tìm thấy người dùng.';
      case 'Current password is incorrect!':
        return 'Mật khẩu hiện tại không đúng.';
      default:
        return 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại.';
    }
  };

  // Xử lý gửi form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const token = getAccessToken();
    if (!token) {
      setError('Không tìm thấy token. Vui lòng đăng nhập lại.');
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/users/change-password`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.errCode === 0) {
        setSuccess('Đổi mật khẩu thành công');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => navigate('/account'), 2000);
      } else {
        setError(mapErrorMessage(response.data.message));
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setError(mapErrorMessage(err.response?.data?.message || 'Error changing password'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`card ${styles.formBox}`}>
      <div className="card-header text-center">
        <h5 className="mb-0">Đổi mật khẩu</h5>
      </div>
      <div className="card-body">
        {success && (
          <div className={`alert alert-success ${styles.birthdayMessage}`}>
            {success}
          </div>
        )}
        {error && (
          <div className={`alert alert-danger ${styles.error}`}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className={styles.userInfo}>
            <div className={`row ${styles.infoItem}`}>
              <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
                <i className="fas fa-lock"></i> Mật khẩu hiện tại
              </label>
              <div className="col-sm-8">
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
              </div>
            </div>
            <div className={`row ${styles.infoItem}`}>
              <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
                <i className="fas fa-key"></i> Mật khẩu mới
              </label>
              <div className="col-sm-8">
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Nhập mật khẩu mới"
                  required
                />
              </div>
            </div>
            <div className={`row ${styles.infoItem}`}>
              <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
                <i className="fas fa-key"></i> Xác nhận mật khẩu
              </label>
              <div className="col-sm-8">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Xác nhận mật khẩu mới"
                  required
                />
              </div>
            </div>
            <div className="text-center mt-4">
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#007bff', borderColor: '#007bff' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Đang xử lý...
                  </>
                ) : (
                  'Đổi mật khẩu'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;