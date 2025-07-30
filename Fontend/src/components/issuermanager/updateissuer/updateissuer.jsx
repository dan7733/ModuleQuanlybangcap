import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './updateissuer.module.css';

const UpdateIssuer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(Context);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactEmail: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Get access token
  const getAccessToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    return user.accessToken || null;
  };

  // Check authentication and role
  useEffect(() => {
    if (!user || !user.auth || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch issuer by ID
  useEffect(() => {
    const fetchIssuer = async () => {
      setLoading(true);
      setError('');
      const token = getAccessToken();
      console.log('Fetching issuer with ID:', id, 'Token:', token); // Debug log
      if (!token) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/issuer/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });

        console.log('API Response:', response.data); // Debug log
        if (response.data.errCode === 0) {
          const issuerData = response.data.data;
          setFormData({
            name: issuerData.name || '',
            address: issuerData.address || '',
            contactEmail: issuerData.contactEmail || '',
          });
        } else {
          setError(response.data.message || 'Không thể tải thông tin tổ chức phát hành.');
        }
      } catch (err) {
        console.error('Fetch Issuer Error:', err.response || err); // Debug log
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else if (err.response?.status === 404) {
          setError('Tổ chức phát hành không tồn tại.');
        } else {
          setError(err.response?.data?.message || 'Lỗi khi tải thông tin tổ chức phát hành. Vui lòng thử lại.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchIssuer();
  }, [id, navigate]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Map server error messages to user-friendly messages
  const mapServerErrorToMessage = (serverMessage) => {
    if (serverMessage === 'Missing required issuer fields') {
      return 'Vui lòng điền đầy đủ các trường bắt buộc (tên tổ chức).';
    }
    if (serverMessage === 'Issuer not found') {
      return 'Tổ chức phát hành không tồn tại.';
    }
    if (serverMessage === 'Issuer name already exists') {
      return 'Tên tổ chức đã tồn tại.';
    }
    return 'Cập nhật tổ chức phát hành thất bại. Vui lòng thử lại.';
  };

  // Handle form submission
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
        `${process.env.REACT_APP_API_URL}/api/v1/issuer/${id}`,
        {
          name: formData.name,
          address: formData.address || null,
          contactEmail: formData.contactEmail || null,
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

      console.log('Update Response:', response.data); // Debug log
      if (response.data.errCode === 0) {
        setSuccess('Cập nhật tổ chức phát hành thành công!');
      } else {
        setError(mapServerErrorToMessage(response.data.message));
      }
    } catch (err) {
      console.error('Update Issuer Error:', err.response || err); // Debug log
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

  // Handle back button
  const handleBack = () => {
    setFormData({
      name: '',
      address: '',
      contactEmail: '',
    });
    setError('');
    setSuccess('');
    navigate('/listissuer');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <div className={styles.borderBox}>
          <h4 className={styles.formTitle}>Cập nhật tổ chức phát hành</h4>

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
              <label className={styles.formLabel}>Tên tổ chức</label>
              <input
                type="text"
                name="name"
                className={styles.formInput}
                placeholder="Nhập tên tổ chức"
                value={formData.name}
                onChange={handleInputChange}
                required
                aria-label="Tên tổ chức"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Địa chỉ</label>
              <input
                type="text"
                name="address"
                className={styles.formInput}
                placeholder="Nhập địa chỉ"
                value={formData.address}
                onChange={handleInputChange}
                aria-label="Địa chỉ"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email liên hệ</label>
              <input
                type="email"
                name="contactEmail"
                className={styles.formInput}
                placeholder="Nhập email liên hệ"
                value={formData.contactEmail}
                onChange={handleInputChange}
                aria-label="Email liên hệ"
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

export default UpdateIssuer;