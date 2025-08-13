import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './userprofile.module.css';
import { Context } from '../../login/context';
import DFavatar from '../../../assets/avatar/avatar.png'; // Import ảnh avatar mặc định
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

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [isBirthday, setIsBirthday] = useState(false);
  const navigate = useNavigate();
  const { user } = React.useContext(Context);

  // Kiểm tra xác thực
  useEffect(() => {
    if (!user || !user.auth) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Lấy thông tin hồ sơ người dùng
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = getAccessToken();
      if (!token) {
        setError('Không tìm thấy token. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });

        if (response.data.errCode === 0) {
          const data = response.data.data;
          // Kiểm tra trạng thái tài khoản
          if (data.status === 'locked') {
            setError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
            return;
          }
          setUserData(data);
          // Kiểm tra sinh nhật
          if (data.dateOfBirth) {
            const birthDate = new Date(data.dateOfBirth);
            const today = new Date();
            if (
              birthDate.getDate() === today.getDate() &&
              birthDate.getMonth() === today.getMonth()
            ) {
              setIsBirthday(true);
            }
          }
        } else {
          setError(response.data.message || 'Không thể tải thông tin hồ sơ.');
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          setError('Đã xảy ra lỗi khi tải thông tin. Vui lòng thử lại.');
        }
      }
    };

    if (user?.auth) {
      fetchUserProfile();
    }
  }, [user, navigate]);

  // Trạng thái đang tải hoặc lỗi
  if (error) {
    return <div className={`alert alert-danger ${styles.error}`}>{error}</div>;
  }

  if (!userData) {
    return <div className={`text-center ${styles.loading}`}>Đang tải thông tin...</div>;
  }

  // Xác định URL avatar
  const avatarUrl = userData.avatar
    ? `${process.env.REACT_APP_API_URL}/images/avatars/${userData.avatar}`
    : DFavatar;

  return (
    <div className={`card ${styles.formBox}`}>
      <div className="card-header text-center">
        <h5 className="mb-0">Thông tin tài khoản</h5>
      </div>
      <div className="card-body">
        {isBirthday && (
          <div className={`alert alert-warning ${styles.birthdayMessage}`}>
            Chúc mừng sinh nhật 🎉 Hôm nay là ngày đặc biệt của bạn!
          </div>
        )}
        <div className="text-center mb-4">
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              <img
                src={avatarUrl}
                className={`rounded-circle ${styles.avatarImage}`}
                alt="Avatar người dùng"
                onError={(e) => (e.target.src = DFavatar)} // Fallback về ảnh mặc định nếu lỗi
              />
            </div>
          </div>
        </div>
        <div className={styles.userInfo}>
          <div className={`row ${styles.infoItem}`}>
            <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
              <i className="fas fa-user"></i> Họ và tên
            </label>
            <div className="col-sm-8">
              <p className={styles.infoValue}>{userData.fullName || 'N/A'}</p>
            </div>
          </div>
          <div className={`row ${styles.infoItem}`}>
            <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
              <i className="fas fa-envelope"></i> Email
            </label>
            <div className="col-sm-8">
              <p className={styles.infoValue}>{userData.email || 'N/A'}</p>
            </div>
          </div>
          <div className={`row ${styles.infoItem}`}>
            <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
              <i className="fas fa-phone"></i> Số điện thoại
            </label>
            <div className="col-sm-8">
              <p className={styles.infoValue}>{userData.phoneNumber || 'N/A'}</p>
            </div>
          </div>
          <div className={`row ${styles.infoItem}`}>
            <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
              <i className="fas fa-birthday-cake"></i> Ngày sinh
            </label>
            <div className="col-sm-8">
              <p className={styles.infoValue}>
                {userData.dateOfBirth
                  ? new Date(userData.dateOfBirth).toLocaleDateString('vi-VN')
                  : 'N/A'}
              </p>
            </div>
          </div>
          <div className={`row ${styles.infoItem}`}>
            <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
              <i className="fas fa-building"></i> Tổ chức
            </label>
            <div className="col-sm-8">
              <p className={styles.infoValue}>{userData.organization || 'N/A'}</p>
            </div>
          </div>
          <div className={`row ${styles.infoItem}`}>
            <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
              <i className="fas fa-user-tag"></i> Vai trò
            </label>
            <div className="col-sm-8">
              <p className={styles.infoValue}>
                {userData.role === 'admin'
                  ? 'Quản trị viên'
                  : userData.role === 'manager'
                  ? 'Quản lý'
                  : userData.role === 'certifier'
                  ? 'Người chứng nhận'
                  : 'Người dùng'}
              </p>
            </div>
          </div>
          <div className={`row ${styles.infoItem}`}>
            <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
              <i className="fas fa-user-check"></i> Trạng thái
            </label>
            <div className="col-sm-8">
              <p className={styles.infoValue}>
                {userData.status === 'active'
                  ? 'Hoạt động'
                  : userData.status === 'inactive'
                  ? 'Không hoạt động'
                  : userData.status === 'locked'
                  ? 'Bị khóa'
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;