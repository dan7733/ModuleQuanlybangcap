import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './degreedetails.module.css';
import CryptoJS from 'crypto-js';

const DegreeVerificationDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(Context);
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientDob: '',
    placeOfBirth: '',
    level: '',
    degreeTypeId: '',
    issueDate: '',
    serialNumber: '',
    registryNumber: '',
    placeOfIssue: '',
    signer: '',
    issuerId: '',
    status: 'Pending',
    digitalSignature: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState('');

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

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  // Fetch degree data
  useEffect(() => {
    if (!user || !user.auth || !['admin', 'certifier'].includes(user.role)) {
      setError('Bạn không có quyền truy cập trang này.');
      navigate('/');
      return;
    }

    if (!id || !isValidObjectId(id)) {
      setError('ID văn bằng không hợp lệ.');
      navigate('/listverificationdegree');
      return;
    }

    const fetchDegree = async () => {
      try {
        const token = getAccessToken();
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/verification/degree/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.errCode === 0) {
          const degree = response.data.data;
          setFormData({
            recipientName: degree.recipientName || '',
            recipientDob: degree.recipientDob ? new Date(degree.recipientDob).toLocaleDateString('vi-VN') : '',
            placeOfBirth: degree.placeOfBirth || '',
            level: degree.level || '',
            degreeTypeId: degree.degreeTypeId?.title || degree.degreeTypeId || '',
            issueDate: degree.issueDate ? new Date(degree.issueDate).toLocaleDateString('vi-VN') : '',
            serialNumber: degree.serialNumber || '',
            registryNumber: degree.registryNumber || '',
            placeOfIssue: degree.placeOfIssue || '',
            signer: degree.signer || '',
            issuerId: degree.issuerId?.name || degree.issuerId || '',
            status: degree.status || 'Pending',
            digitalSignature: degree.digitalSignature || '',
          });
        } else {
          setError('Không thể tải thông tin văn bằng.');
        }
      } catch (err) {
        console.error('Lỗi khi tải văn bằng:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          setError('Lỗi khi tải thông tin văn bằng. Vui lòng thử lại.');
        }
      }
    };

    fetchDegree();
  }, [user, navigate, id]);

  const handleStatusChange = (e) => {
    setFormData((prev) => ({ ...prev, status: e.target.value }));
  };

  const mapServerErrorToMessage = (serverMessage) => {
    const errorMap = {
      'Degree not found': 'Không tìm thấy văn bằng.',
      'Permission denied': 'Bạn không có quyền cập nhật văn bằng này.',
      'Email does not match authenticated user': 'Email không khớp với người dùng đã đăng nhập.',
      'Invalid Degree ID': 'ID văn bằng không hợp lệ.',
      'Invalid status value': 'Trạng thái không hợp lệ.',
      'User not found': 'Không tìm thấy người dùng.',
      'No digital signature available': 'Không có chữ ký số.',
      'Signature is invalid': 'Chữ ký số không hợp lệ.',
      'Digital signature is invalid': 'Chữ ký số không hợp lệ.',
      'No digital signature found': 'Không có chữ ký số.',
      'Invalid degree ID': 'ID văn bằng không hợp lệ.',
    };
    return errorMap[serverMessage] || 'Có lỗi xảy ra. Vui lòng thử lại.';
  };

  const mapServerSuccessToMessage = (serverMessage) => {
    const successMap = {
      'Signature is valid': 'Chữ ký số hợp lệ.',
      'Digital signature is valid': 'Chữ ký số hợp lệ.',
      'Degree status updated successfully': 'Cập nhật trạng thái văn bằng thành công!',
      'Digital signature is invalid': 'Chữ ký số không hợp lệ! đã bị thay đổi hoặc không hợp lệ.',
    };
    return successMap[serverMessage] || serverMessage;
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
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/v1/verification/degree/${id}`,
        { status: formData.status, email: user.email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (response.data.errCode === 0) {
        setSuccess('Cập nhật trạng thái văn bằng thành công!');
        setFormData((prev) => ({ ...prev, digitalSignature: response.data.data.digitalSignature || '' }));
      } else {
        setError(mapServerErrorToMessage(response.data.message));
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật:', err);
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

  const handleVerifySignature = async () => {
    setError('');
    setSuccess('');
    setSignatureStatus('');
    setLoading(true);

    try {
      const token = getAccessToken();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/verification/degree/${id}/verify-signature`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.errCode === 0) {
        setSignatureStatus(mapServerSuccessToMessage(response.data.message));
      } else {
        setError(mapServerErrorToMessage(response.data.message));
      }
    } catch (err) {
      setError('Lỗi khi xác minh chữ ký số. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light p-4">
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang xử lý...</span>
          </div>
        </div>
      )}
      <div className="container bg-white p-4 rounded shadow-sm">
        <div className={`d-flex gap-2 mb-3 flex-wrap ${styles.actionButtons}`}>
          <Link to="/listverificationdegree" className={`btn ${styles.bthThembangcap}`}>
            <i className="fas fa-arrow-left"></i> Quay lại
          </Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {signatureStatus && <div className="alert alert-info">{signatureStatus}</div>}

        <form onSubmit={handleSubmit} className={styles.borderBox}>
          <div className="row g-3">
            {[
              { label: 'Tên đơn vị quản lý', name: 'issuerId', value: formData.issuerId },
              { label: 'Tên văn bằng', name: 'degreeTypeId', value: formData.degreeTypeId },
              { label: 'Tên người nhận', name: 'recipientName', value: formData.recipientName },
              { label: 'Ngày sinh', name: 'recipientDob', value: formData.recipientDob },
              { label: 'Nơi sinh', name: 'placeOfBirth', value: formData.placeOfBirth },
              { label: 'Xếp loại', name: 'level', value: formData.level },
              { label: 'Số hiệu', name: 'serialNumber', value: formData.serialNumber },
              { label: 'Số vào sổ', name: 'registryNumber', value: formData.registryNumber },
              { label: 'Ngày cấp', name: 'issueDate', value: formData.issueDate },
              { label: 'Nơi cấp', name: 'placeOfIssue', value: formData.placeOfIssue },
              { label: 'Người ký', name: 'signer', value: formData.signer },
              { label: 'Chữ ký số', name: 'digitalSignature', value: formData.digitalSignature || 'Không có' },
            ].map((field, index) => (
              <div className="col-12 d-flex flex-column flex-md-row mb-2" key={index}>
                <label className="form-label col-md-2 mb-1 mb-md-0">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  className="form-control"
                  value={field.value}
                  readOnly
                  aria-readonly="true"
                />
              </div>
            ))}
            <div className="col-12 d-flex flex-column flex-md-row mb-2">
              <label className="form-label col-md-2 mb-1 mb-md-0">Trạng thái</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleStatusChange}
                required
                aria-required="true"
              >
                <option value="Pending">Chờ duyệt</option>
                <option value="Approved">Đã duyệt</option>
                <option value="Rejected">Đã từ chối</option>
              </select>
            </div>
            <div className="mt-4 d-flex gap-2 flex-wrap justify-content-center">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                Cập nhật trạng thái
              </button>
              <button
                className="btn btn-info"
                type="button"
                onClick={handleVerifySignature}
                disabled={loading || !formData.digitalSignature}
              >
                Xác minh chữ ký số
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => navigate('/listverificationdegree')}
                disabled={loading}
              >
                Hủy
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DegreeVerificationDetails;