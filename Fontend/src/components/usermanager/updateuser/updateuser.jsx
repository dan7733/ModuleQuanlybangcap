import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './updateuser.module.css';

const UpdateUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(Context);
  const [formData, setFormData] = useState({
    fullname: '',
    dob: '',
    phonenumber: '',
    email: '',
    roleid: '',
    status: '',
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
    }
  }, [user, navigate]);

  // Lấy danh sách issuers
  useEffect(() => {
    const fetchIssuers = async () => {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/issuers`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });

        if (response.data.errCode === 0) {
          setIssuers(response.data.data);
        } else {
          setError('Không thể tải danh sách tổ chức phát hành.');
        }
      } catch (err) {
        setError('Lỗi khi tải danh sách tổ chức phát hành. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchIssuers();
  }, [navigate]);

  // Lấy thông tin người dùng theo ID
  useEffect(() => {
    const fetchUser = async () => {
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
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/user/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });

        if (response.data.errCode === 0) {
          const userData = response.data.data;
          setFormData({
            fullname: userData.fullname,
            dob: userData.dob ? new Date(userData.dob).toISOString().split('T')[0] : '',
            phonenumber: userData.phonenumber || '',
            email: userData.email || '',
            roleid: userData.roleid.toString(),
            status: userData.status || '',
            issuerId: userData.issuerId || '',
          });
        } else {
          setError('Không thể tải thông tin người dùng.');
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          setError('Lỗi khi tải thông tin người dùng. Vui lòng thử lại.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Ánh xạ lỗi server
  const mapServerErrorToMessage = (serverMessage) => {
    if (serverMessage === 'Missing required user fields') {
      return 'Vui lòng điền đầy đủ các trường bắt buộc (họ tên, email).';
    }
    if (serverMessage === 'User not found') {
      return 'Người dùng không tồn tại.';
    }
    if (serverMessage === 'Only admin can update user') {
      return 'Chỉ admin mới có quyền cập nhật người dùng.';
    }
    if (serverMessage === 'Email or phone number already exists') {
      return 'Email hoặc số điện thoại đã tồn tại.';
    }
    if (serverMessage === 'Invalid Issuer ID') {
      return 'ID tổ chức phát hành không hợp lệ.';
    }
    if (serverMessage === 'Issuer not found') {
      return 'Tổ chức phát hành không tồn tại.';
    }
    return 'Cập nhật người dùng thất bại. Vui lòng thử lại.';
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
        `${process.env.REACT_APP_API_URL}/api/v1/user/${id}`,
        {
          fullname: formData.fullname,
          dob: formData.dob || null,
          phonenumber: formData.phonenumber || null,
          email: formData.email,
          roleid: parseInt(formData.roleid),
          status: formData.status || null,
          issuerId: formData.issuerId || null,
          adminEmail: user.email,
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
        setSuccess('Cập nhật người dùng thành công!');
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
      fullname: '',
      dob: '',
      phonenumber: '',
      email: '',
      roleid: '',
      status: '',
      issuerId: '',
    });
    setError('');
    setSuccess('');
    navigate('/listuser');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <div className={styles.borderBox}>
          <h4 className={styles.formTitle}>Cập nhật người dùng</h4>

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
              <label className={styles.formLabel}>Họ và tên</label>
              <input
                type="text"
                name="fullname"
                className={styles.formInput}
                placeholder="Nhập họ và tên"
                value={formData.fullname}
                onChange={handleInputChange}
                required
                aria-label="Họ và tên"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ngày sinh</label>
              <input
                type="date"
                name="dob"
                className={styles.formInput}
                value={formData.dob}
                onChange={handleInputChange}
                aria-label="Ngày sinh"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Số điện thoại</label>
              <input
                type="text"
                name="phonenumber"
                className={styles.formInput}
                placeholder="Nhập số điện thoại"
                value={formData.phonenumber}
                onChange={handleInputChange}
                aria-label="Số điện thoại"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input
                type="email"
                name="email"
                className={styles.formInput}
                placeholder="Nhập email"
                value={formData.email}
                onChange={handleInputChange}
                required
                aria-label="Email"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Vai trò</label>
              <select
                name="roleid"
                className={styles.formInput}
                value={formData.roleid}
                onChange={handleInputChange}
                required
                aria-label="Vai trò"
              >
                <option value="">Chọn vai trò</option>
                <option value="3">Admin</option>
                <option value="2">Manager</option>
                <option value="1">Certifier</option>
                <option value="0">User</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Trạng thái</label>
              <select
                name="status"
                className={styles.formInput}
                value={formData.status}
                onChange={handleInputChange}
                required
                aria-label="Trạng thái"
              >
                <option value="">Chọn trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tổ chức phát hành</label>
              <select
                name="issuerId"
                className={styles.formInput}
                value={formData.issuerId}
                onChange={handleInputChange}
                required
                aria-label="Tổ chức phát hành"
              >
                <option value="">Chọn tổ chức phát hành</option>
                {issuers.map((issuer) => (
                  <option key={issuer._id} value={issuer._id}>
                    {issuer.name}
                  </option>
                ))}
              </select>
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

export default UpdateUser;