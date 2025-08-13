import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './adddegreetype.module.css';
import CryptoJS from 'crypto-js';

const AddDegreetype = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [formData, setFormData] = useState({
    title: '',
    level: '',
    major: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL;

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Ánh xạ lỗi server thành thông báo tiếng Việt
  const mapServerErrorToMessage = (serverMessage) => {
    if (serverMessage === 'Missing required degree type fields') {
      return 'Vui lòng điền đầy đủ các trường bắt buộc (tiêu đề, cấp độ, chuyên ngành).';
    }
    return 'Thêm loại bằng cấp thất bại. Vui lòng thử lại.';
  };

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
      const response = await axios.post(
        `${API_URL}/api/v1/degree-type`,
        {
          title: formData.title,
          level: formData.level,
          major: formData.major,
          email: user.email, // Gửi email từ Context
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
        setSuccess('Thêm loại bằng cấp thành công!');
        setFormData({
          title: '',
          level: '',
          major: '',
        });
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

  const handleReset = () => {
    setFormData({
      title: '',
      level: '',
      major: '',
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-light p-4">
      <div className="container bg-white p-4 rounded shadow-sm">
        <div className={styles.borderBox}>
          <h4 className="mb-4 text-center">Thêm loại bằng cấp mới</h4>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {loading && (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3 row align-items-center">
              <label className="col-md-3 col-form-label">Tiêu đề</label>
              <div className="col-md-9">
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  placeholder="Nhập tiêu đề loại bằng (VD: Chứng chỉ A)"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="mb-3 row align-items-center">
              <label className="col-md-3 col-form-label">Cấp độ</label>
              <div className="col-md-9">
                <input
                  type="text"
                  name="level"
                  className="form-control"
                  placeholder="Nhập cấp độ (VD: Chứng chỉ, Cử nhân)"
                  value={formData.level}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="mb-3 row align-items-center">
              <label className="col-md-3 col-form-label">Chuyên ngành</label>
              <div className="col-md-9">
                <input
                  type="text"
                  name="major"
                  className="form-control"
                  placeholder="Nhập chuyên ngành (VD: Lập trình Web)"
                  value={formData.major}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="mt-4 d-flex gap-2 flex-wrap justify-content-center">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                Thêm mới
              </button>
              <button
                className="btn btn-secondary"
                type="reset"
                onClick={handleReset}
                disabled={loading}
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDegreetype;