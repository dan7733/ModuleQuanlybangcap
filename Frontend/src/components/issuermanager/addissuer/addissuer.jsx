import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './addissuer.module.css';
import CryptoJS from 'crypto-js';

const AddIssuer = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactEmail: '',
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
    if (!user || !user.auth || !['admin'].includes(user.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Ánh xạ lỗi server thành thông báo tiếng Việt
  const mapServerErrorToMessage = (serverMessage) => {
    if (serverMessage === 'Missing required issuer fields') {
      return 'Vui lòng điền đầy đủ tên tổ chức.';
    } else if (serverMessage === 'Only certifier or admin can create issuer') {
      return 'Chỉ chứng nhận viên hoặc quản trị viên mới có thể thêm tổ chức.';
    }
    return 'Thêm tổ chức thất bại. Vui lòng thử lại.';
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
        `${process.env.REACT_APP_API_URL}/api/v1/issuer`,
        {
          name: formData.name,
          address: formData.address,
          contactEmail: formData.contactEmail,
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
        setSuccess('Thêm tổ chức thành công!');
        setFormData({
          name: '',
          address: '',
          contactEmail: '',
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
      name: '',
      address: '',
      contactEmail: '',
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-light p-4">
      <div className="container bg-white p-4 rounded shadow-sm">
        <div className={styles.borderBox}>
          <h4 className="mb-4 text-center">Thêm tổ chức mới</h4>

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
              <label className="col-md-3 col-form-label">Tên tổ chức</label>
              <div className="col-md-9">
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Nhập tên tổ chức"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="mb-3 row align-items-center">
              <label className="col-md-3 col-form-label">Địa chỉ</label>
              <div className="col-md-9">
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  placeholder="Nhập địa chỉ (không bắt buộc)"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="mb-3 row align-items-center">
              <label className="col-md-3 col-form-label">Email liên hệ</label>
              <div className="col-md-9">
                <input
                  type="email"
                  name="contactEmail"
                  className="form-control"
                  placeholder="Nhập email liên hệ (không bắt buộc)"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
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

export default AddIssuer;