import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './updateprofile.module.css';
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

const mapErrorMessage = (message) => {
  switch (message) {
    case 'User not found':
      return 'Không tìm thấy người dùng.';
    case 'Invalid phone number':
      return 'Số điện thoại không hợp lệ. Vui lòng nhập số từ 10-15 chữ số.';
    case 'Phone number already exists':
      return 'Số điện thoại đã được sử dụng.';
    case 'Fullname is required':
      return 'Họ và tên không được để trống.';
    case 'Invalid file format':
      return 'Định dạng file không hợp lệ. Chỉ hỗ trợ ảnh (jpg, jpeg, png).';
    case 'File too large':
      return 'File quá lớn. Kích thước tối đa là 5MB.';
    default:
      return 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
  }
};

const UpdateProfile = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    dob: '',
    phonenumber: '',
    avatar: null,
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user || !user.auth) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = getAccessToken();
      if (!token) {
        setError('Không tìm thấy token. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (response.data.errCode === 0) {
          const { fullName, dateOfBirth, phoneNumber, avatar } = response.data.data;
          setFormData({
            fullname: fullName || '',
            dob: dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : '',
            phonenumber: phoneNumber || '',
            avatar: null,
          });
          setAvatarPreview(avatar ? `${process.env.REACT_APP_API_URL}/${avatar}` : null);
          setIsLoadingProfile(false);
        } else {
          setError(mapErrorMessage(response.data.message));
          setIsLoadingProfile(false);
        }
      } catch (err) {
        setIsLoadingProfile(false);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          setError(mapErrorMessage(err.response?.data?.message));
        }
      }
    };

    if (user?.auth) {
      fetchUser();
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar' && files[0]) {
      const file = files[0];
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validImageTypes.includes(file.type)) {
        setError('Định dạng file không hợp lệ. Chỉ hỗ trợ ảnh (jpg, jpeg, png).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File quá lớn. Kích thước tối đa là 5MB.');
        return;
      }
      setFormData((prev) => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError(null);
    setSuccess(null);
  };

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

    if (!formData.fullname.trim()) {
      setError('Họ và tên không được để trống.');
      setLoading(false);
      return;
    }

    if (formData.phonenumber) {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(formData.phonenumber)) {
        setError('Số điện thoại không hợp lệ. Vui lòng nhập số từ 10-15 chữ số.');
        setLoading(false);
        return;
      }
    }

    if (formData.dob && new Date(formData.dob) > new Date()) {
      setError('Ngày sinh không được là ngày trong tương lai.');
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('fullname', formData.fullname);
    if (formData.dob) data.append('dob', formData.dob);
    if (formData.phonenumber) data.append('phonenumber', formData.phonenumber);
    if (formData.avatar) data.append('avatar', formData.avatar);

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/v1/users/update-profile`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );

      if (response.data.errCode === 0) {
        setSuccess('Cập nhật thông tin người dùng thành công!');
        setTimeout(() => navigate('/account'), 2000);
      } else {
        setError(mapErrorMessage(response.data.message));
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setError(mapErrorMessage(err.response?.data?.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullname: '',
      dob: '',
      phonenumber: '',
      avatar: null,
    });
    setAvatarPreview(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoadingProfile) {
    return <div className={`text-center ${styles.loading}`}>Đang tải thông tin...</div>;
  }

  return (
    <div className={`card ${styles.formBox}`}>
      <div className="card-header text-center">
        <h5 className="mb-0">Cập nhật thông tin người dùng</h5>
      </div>
      <div className="card-body">
        {success && (
          <div className={`alert alert-success ${styles.successMessage}`}>
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
                <i className="fas fa-user"></i> Họ và tên
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>
            </div>
            <div className={`row ${styles.infoItem}`}>
              <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
                <i className="fas fa-birthday-cake"></i> Ngày sinh
              </label>
              <div className="col-sm-8">
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>
            <div className={`row ${styles.infoItem}`}>
              <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
                <i className="fas fa-phone"></i> Số điện thoại
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  name="phonenumber"
                  value={formData.phonenumber}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Nhập số điện thoại (không bắt buộc)"
                />
              </div>
            </div>
            <div className={`row ${styles.infoItem}`}>
              <label className={`col-sm-4 col-form-label ${styles.infoLabel}`}>
                <i className="fas fa-image"></i> Ảnh đại diện
              </label>
              <div className="col-sm-8">
                <input
                  type="file"
                  name="avatar"
                  onChange={handleChange}
                  className="form-control"
                  accept="image/jpeg,image/png,image/jpg"
                  ref={fileInputRef}
                />
                {avatarPreview && (
                  <div className="mt-2">
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="text-center mt-4 d-flex gap-2 flex-wrap justify-content-center">
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#005580', borderColor: '#005580' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Đang cập nhật...
                  </>
                ) : (
                  'Cập nhật'
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={loading}
                style={{ backgroundColor: '#6c757d', borderColor: '#6c757d' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/account')}
                style={{ borderColor: '#6c757d', color: '#6c757d' }}
              >
                Quay lại
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;