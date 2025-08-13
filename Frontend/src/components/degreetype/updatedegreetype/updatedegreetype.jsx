import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './updatedegreetype.module.css';
import CryptoJS from 'crypto-js';

const UpdateDegreetype = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(Context);
  const [formData, setFormData] = useState({
    title: '',
    level: '',
    major: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Hàm để lấy accessToken từ localStorage hoặc sessionStorage
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

  // Kiểm tra xác thực và vai trò
  useEffect(() => {
    if (!user || !user.auth || !['admin', 'certifier'].includes(user.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  // Lấy thông tin degree type theo ID
  useEffect(() => {
    const fetchDegreeType = async () => {
      setLoading(true);
      setError('');
      const token = getAccessToken();
      if (!token) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/degree-type/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });

        if (response.data.errCode === 0) {
          setFormData({
            title: response.data.data.title,
            level: response.data.data.level,
            major: response.data.data.major,
          });
        } else {
          setError('Không thể tải thông tin loại bằng cấp.');
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          setError('Lỗi khi tải thông tin loại bằng cấp. Vui lòng thử lại.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDegreeType();
  }, [id, navigate]);

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Ánh xạ lỗi server
  const mapServerErrorToMessage = (serverMessage) => {
    if (serverMessage === 'Missing required degree type fields') {
      return 'Vui lòng điền đầy đủ các trường bắt buộc (tiêu đề, cấp độ, chuyên ngành).';
    }
    if (serverMessage === 'DegreeType not found') {
      return 'Loại bằng cấp không tồn tại.';
    }
    if (serverMessage === 'User does not belong to this issuer') {
      return 'Bạn không có quyền cập nhật loại bằng cấp này.';
    }
    return 'Cập nhật loại bằng cấp thất bại. Vui lòng thử lại.';
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const token = getAccessToken();
    if (!token) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/v1/degree-type/${id}`,
        {
          title: formData.title,
          level: formData.level,
          major: formData.major,
          email: user.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (response.data.errCode === 0) {
        setSuccess('Cập nhật loại bằng cấp thành công!');
      } else {
        setError(mapServerErrorToMessage(response.data.message));
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setError(mapServerErrorToMessage(err.response?.data?.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý trở lại
  const handleBack = () => {
    setFormData({
      title: '',
      level: '',
      major: '',
    });
    setError('');
    setSuccess('');
    navigate('/listdegreetype');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <div className={styles.borderBox}>
          <h4 className={styles.formTitle}>Cập nhật loại bằng cấp</h4>

          {error && <div className={styles.alertDanger}>{error}</div>}
          {success && <div className={styles.alertSuccess}>{success}</div>}
          {loading && (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tiêu đề</label>
              <input
                type="text"
                name="title"
                className={styles.formInput}
                placeholder="Nhập tiêu đề loại bằng (VD: Chứng chỉ A)"
                value={formData.title}
                onChange={handleInputChange}
                required
                aria-label="Tiêu đề loại bằng cấp"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cấp độ</label>
              <input
                type="text"
                name="level"
                className={styles.formInput}
                placeholder="Nhập cấp độ (VD: Chứng chỉ, Cử nhân)"
                value={formData.level}
                onChange={handleInputChange}
                required
                aria-label="Cấp độ loại bằng cấp"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Chuyên ngành</label>
              <input
                type="text"
                name="major"
                className={styles.formInput}
                placeholder="Nhập chuyên ngành (VD: Lập trình Web)"
                value={formData.major}
                onChange={handleInputChange}
                required
                aria-label="Chuyên ngành loại bằng cấp"
              />
            </div>
            <div className={styles.buttonGroup}>
              <button
                className={styles.btnPrimary}
                type="submit"
                disabled={loading}
              >
                Cập nhật
              </button>
              <button
                className={styles.btnSecondary}
                type="button"
                onClick={handleBack}
                disabled={loading}
              >
                Trở lại
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateDegreetype;