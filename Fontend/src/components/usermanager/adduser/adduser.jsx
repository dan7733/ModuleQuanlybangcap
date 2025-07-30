import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './adduser.module.css';

const AddUser = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    roleid: '',
    issuerId: '',
  });
  const [issuers, setIssuers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Hàm lấy accessToken
  const getAccessToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    return user.accessToken || null;
  };

  // Kiểm tra xác thực và vai trò
  useEffect(() => {
    if (!user || !user.auth || user.role !== 'admin') {
      navigate('/');
    } else {
      // Fetch issuers for dropdown
      const fetchIssuers = async () => {
        try {
          const token = getAccessToken();
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/issuers`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.data.errCode === 0) {
            setIssuers(response.data.data);
          } else {
            setError('Không thể tải danh sách tổ chức.');
          }
        } catch (err) {
          setError('Lỗi khi tải danh sách tổ chức. Vui lòng thử lại.');
        }
      };
      fetchIssuers();
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Ánh xạ lỗi server thành thông báo tiếng Việt
  const mapServerErrorToMessage = (serverMessage) => {
    if (serverMessage === 'Missing required user fields') {
      return 'Vui lòng điền đầy đủ các trường bắt buộc (họ tên, email, mật khẩu, vai trò, tổ chức).';
    } else if (serverMessage === 'Email already exists') {
      return 'Email đã tồn tại. Vui lòng sử dụng email khác.';
    } else if (serverMessage === 'Invalid issuer ID') {
      return 'Tổ chức không hợp lệ. Vui lòng chọn lại.';
    }
    return 'Thêm người dùng thất bại. Vui lòng thử lại.';
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
        `${process.env.REACT_APP_API_URL}/api/v1/user`,
        {
          fullname: formData.fullname,
          email: formData.email,
          password: formData.password,
          roleid: parseInt(formData.roleid),
          issuerId: formData.issuerId,
          creatorEmail: user.email, // Gửi email của người tạo
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
        setSuccess('Thêm người dùng thành công!');
        setFormData({
          fullname: '',
          email: '',
          password: '',
          roleid: '',
          issuerId: '',
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
      fullname: '',
      email: '',
      password: '',
      roleid: '',
      issuerId: '',
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-light p-4">
      <div className="container bg-white p-4 rounded shadow-sm">
        <div className={styles.borderBox}>
          <h4 className="mb-4 text-center">Thêm người dùng mới</h4>

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
              <label className="col-md-3 col-form-label">Họ và tên</label>
              <div className="col-md-9">
                <input
                  type="text"
                  name="fullname"
                  className="form-control"
                  placeholder="Nhập họ và tên"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="mb-3 row align-items-center">
              <label className="col-md-3 col-form-label">Email</label>
              <div className="col-md-9">
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="mb-3 row align-items-center">
              <label className="col-md-3 col-form-label">Mật khẩu</label>
              <div className="col-md-9">
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="mb-3 row align-items-center">
              <label className="col-md-3 col-form-label">Vai trò</label>
              <div className="col-md-9">
                <select
                  name="roleid"
                  className="form-select"
                  value={formData.roleid}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Chọn vai trò</option>
                  <option value="0">Người dùng</option>
                  <option value="1">Chứng nhận viên</option>
                  <option value="2">Quản lý</option>
                  <option value="3">Quản trị viên</option>
                </select>
              </div>
            </div>
            <div className="mb-3 row align-items-center">
              <label className="col-md-3 col-form-label">Tổ chức</label>
              <div className="col-md-9">
                <select
                  name="issuerId"
                  className="form-select"
                  value={formData.issuerId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Chọn tổ chức</option>
                  {issuers.map((issuer) => (
                    <option key={issuer._id} value={issuer._id}>
                      {issuer.name}
                    </option>
                  ))}
                </select>
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

export default AddUser;