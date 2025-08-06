import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './adddegree.module.css';

const AddDegree = () => {
  const navigate = useNavigate();
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
  });
  const [fileAttachment, setFileAttachment] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // State cho ảnh xem trước
  const [issuers, setIssuers] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [selectedIssuer, setSelectedIssuer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDegreeForm, setShowDegreeForm] = useState(false);
  const [dobDate, setDobDate] = useState({ day: '', month: '', year: '' });
  const [issueDate, setIssueDate] = useState({ day: '', month: '', year: '' });
  const [dateErrors, setDateErrors] = useState({ recipientDob: '', issueDate: '' });
  const dobDayRef = useRef(null);
  const dobMonthRef = useRef(null);
  const dobYearRef = useRef(null);
  const issueDayRef = useRef(null);
  const issueMonthRef = useRef(null);
  const issueYearRef = useRef(null);
  const fileInputRef = useRef(null);

  const getAccessToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    return user.accessToken || null;
  };

  useEffect(() => {
    if (!user || !user.auth || !['admin', 'manager'].includes(user.role)) {
      navigate('/');
    } else {
      const fetchIssuers = async () => {
        try {
          const token = getAccessToken();
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/issuers`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.errCode === 0) {
            if (Array.isArray(response.data.data)) {
              setIssuers(response.data.data);
            } else {
              console.error('Issuers data is not an array:', response.data.data);
              setError('Dữ liệu tổ chức không hợp lệ.');
            }
          } else {
            setError('Không thể tải danh sách tổ chức.');
          }
        } catch (err) {
          console.error('Error fetching issuers:', err);
          setError('Lỗi khi tải danh sách tổ chức. Vui lòng thử lại.');
        }
      };
      fetchIssuers();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (selectedIssuer) {
      const fetchDegreeTypes = async () => {
        try {
          const token = getAccessToken();
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/v1/degree-types/by-issuer?issuerId=${selectedIssuer}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.errCode === 0) {
            if (Array.isArray(response.data.data)) {
              setDegreeTypes(response.data.data);
            } else {
              console.error('Degree types data is not an array:', response.data.data);
              setError('Dữ liệu loại văn bằng không hợp lệ.');
              setDegreeTypes([]);
            }
          } else {
            setError('Không thể tải danh sách loại văn bằng.');
            setDegreeTypes([]);
          }
        } catch (err) {
          console.error('Error fetching degree types:', err);
          setError('Lỗi khi tải danh sách loại văn bằng. Vui lòng thử lại.');
          setDegreeTypes([]);
        }
      };
      fetchDegreeTypes();
      setFormData((prev) => ({ ...prev, issuerId: selectedIssuer }));
    } else {
      setDegreeTypes([]);
      setFormData((prev) => ({ ...prev, degreeTypeId: '', issuerId: '' }));
      setShowDegreeForm(false);
    }
  }, [selectedIssuer]);

  useEffect(() => {
    setShowDegreeForm(!!formData.degreeTypeId);
  }, [formData.degreeTypeId]);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => 1900 + i).reverse();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'issuerId') {
      setSelectedIssuer(value);
      setFormData((prev) => ({ ...prev, degreeTypeId: '', issuerId: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Chỉ cho phép tải lên file hình ảnh.');
        setFileAttachment(null);
        setPreviewUrl(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước file vượt quá giới hạn 5MB.');
        setFileAttachment(null);
        setPreviewUrl(null);
        return;
      }
      setFileAttachment(file);
      setPreviewUrl(URL.createObjectURL(file)); // Tạo URL xem trước
      setError('');
    }
  };

  const validateAndFormatDate = (day, month, year, fieldName) => {
    if (!day || !month || !year) {
      setDateErrors((prev) => ({ ...prev, [fieldName]: 'Vui lòng nhập đầy đủ ngày, tháng, năm.' }));
      return '';
    }

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10); // Chuẩn hóa tháng
    const yearNum = parseInt(year, 10);

    if (dayNum < 1 || dayNum > 31) {
      setDateErrors((prev) => ({ ...prev, [fieldName]: 'Ngày phải từ 1 đến 31.' }));
      return '';
    }
    if (monthNum < 1 || monthNum > 12) {
      setDateErrors((prev) => ({ ...prev, [fieldName]: 'Tháng phải từ 1 đến 12.' }));
      return '';
    }
    if (yearNum < 1900 || yearNum > currentYear) {
      setDateErrors((prev) => ({ ...prev, [fieldName]: `Năm phải từ 1900 đến ${currentYear}.` }));
      return '';
    }

    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (
      date.getFullYear() === yearNum &&
      date.getMonth() === monthNum - 1 &&
      date.getDate() === dayNum
    ) {
      setDateErrors((prev) => ({ ...prev, [fieldName]: '' }));
      return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    } else {
      setDateErrors((prev) => ({ ...prev, [fieldName]: 'Ngày tháng năm không hợp lệ.' }));
      return '';
    }
  };

  const handleDateTextChange = (type, field, value, nextRef) => {
    if (value && !/^\d*$/.test(value)) return;

    // Chuẩn hóa giá trị: loại bỏ số 0 ở đầu
    const normalizedValue = value ? parseInt(value, 10).toString() : '';

    if (type === 'dob') {
      setDobDate((prev) => {
        const newDob = { ...prev, [field]: normalizedValue };
        const formattedDate = validateAndFormatDate(newDob.day, newDob.month, newDob.year, 'recipientDob');
        setFormData((prevForm) => ({ ...prevForm, recipientDob: formattedDate }));
        return newDob;
      });
      if ((field === 'day' && value.length === 2) || (field === 'month' && value.length >= 1 && value.length <= 2)) {
        nextRef.current?.focus();
      }
    } else if (type === 'issue') {
      setIssueDate((prev) => {
        const newIssue = { ...prev, [field]: normalizedValue };
        const formattedDate = validateAndFormatDate(newIssue.day, newIssue.month, newIssue.year, 'issueDate');
        setFormData((prevForm) => ({ ...prevForm, issueDate: formattedDate }));
        return newIssue;
      });
      if ((field === 'day' && value.length === 2) || (field === 'month' && value.length >= 1 && value.length <= 2)) {
        nextRef.current?.focus();
      }
    }
  };

  const handleDateSelectChange = (type, field, value) => {
    // Chuẩn hóa giá trị từ select
    const normalizedValue = value ? parseInt(value, 10).toString() : '';

    if (type === 'dob') {
      setDobDate((prev) => {
        const newDob = { ...prev, [field]: normalizedValue };
        const formattedDate = validateAndFormatDate(newDob.day, newDob.month, newDob.year, 'recipientDob');
        setFormData((prevForm) => ({ ...prevForm, recipientDob: formattedDate }));
        return newDob;
      });
    } else if (type === 'issue') {
      setIssueDate((prev) => {
        const newIssue = { ...prev, [field]: normalizedValue };
        const formattedDate = validateAndFormatDate(newIssue.day, newIssue.month, newIssue.year, 'issueDate');
        setFormData((prevForm) => ({ ...prevForm, issueDate: formattedDate }));
        return newIssue;
      });
    }
  };

  const mapServerErrorToMessage = (serverMessage) => {
    if (serverMessage === 'Missing required degree fields or issuerId') {
      return 'Vui lòng điền đầy đủ các trường bắt buộc.';
    } else if (serverMessage === 'Serial number or registry number already exists') {
      return 'Số hiệu hoặc số vào sổ đã tồn tại.';
    } else if (serverMessage === 'Invalid DegreeType ID') {
      return 'Loại văn bằng không hợp lệ.';
    } else if (serverMessage === 'DegreeType not found') {
      return 'Không tìm thấy loại văn bằng.';
    } else if (serverMessage === 'Selected DegreeType does not belong to the chosen issuer') {
      return 'Loại văn bằng không thuộc tổ chức đã chọn.';
    } else if (serverMessage === 'Invalid User ID') {
      return 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.';
    } else if (serverMessage === 'Only image files are allowed.') {
      return 'Chỉ cho phép tải lên file hình ảnh.';
    } else if (serverMessage === 'File size exceeds 5MB limit.') {
      return 'Kích thước file vượt quá giới hạn 5MB.';
    }
    return 'Thêm văn bằng thất bại. Vui lòng thử lại.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (dateErrors.recipientDob || dateErrors.issueDate) {
      setError('Vui lòng sửa các lỗi ngày tháng trước khi gửi.');
      setLoading(false);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      navigate('/');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });
      if (fileAttachment) {
        data.append('fileAttachment', fileAttachment);
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/degree`,
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
        setSuccess('Thêm văn bằng thành công!');
        setFormData({
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
        });
        setFileAttachment(null);
        setPreviewUrl(null); // Reset ảnh xem trước
        fileInputRef.current.value = null;
        setDobDate({ day: '', month: '', year: '' });
        setIssueDate({ day: '', month: '', year: '' });
        setDateErrors({ recipientDob: '', issueDate: '' });
        setSelectedIssuer('');
        setShowDegreeForm(false);
      } else {
        setError(mapServerErrorToMessage(response.data.message));
      }
    } catch (err) {
      console.error('Error submitting degree:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/');
      } else {
        setError(mapServerErrorToMessage(err.response?.data?.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
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
    });
    setFileAttachment(null);
    setPreviewUrl(null); // Reset ảnh xem trước
    fileInputRef.current.value = null;
    setDobDate({ day: '', month: '', year: '' });
    setIssueDate({ day: '', month: '', year: '' });
    setDateErrors({ recipientDob: '', issueDate: '' });
    setSelectedIssuer('');
    setShowDegreeForm(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-light p-4">
      <div className="container bg-white p-4 rounded shadow-sm">
        <div className={`d-flex gap-2 mb-3 flex-wrap ${styles.actionButtons}`}>
          <button className={`btn ${styles.bthThembangcap}`} onClick={() => navigate('/listdegree')}>
            <i className="fas fa-arrow-left"></i> Quay lại
          </button>
          <button className={`btn ${styles.bthThembangcap}`}>
            <i className="fas fa-file-import"></i> Mẫu Import
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {loading && (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.borderBox}>
          <div className="row g-3">
            <div className="col-12 d-flex flex-column flex-md-row mb-2">
              <label className="form-label col-md-2 mb-1 mb-md-0">Tên đơn vị quản lý</label>
              <select
                name="issuerId"
                className="form-select"
                value={selectedIssuer}
                onChange={handleInputChange}
                required
                aria-required="true"
              >
                <option value="">Chọn tổ chức</option>
                {Array.isArray(issuers) &&
                  issuers.map((issuer) => (
                    <option key={issuer._id} value={issuer._id}>
                      {issuer.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="col-12 d-flex flex-column flex-md-row mb-2">
              <label className="form-label col-md-2 mb-1 mb-md-0">Tên văn bằng</label>
              <select
                name="degreeTypeId"
                className="form-select"
                value={formData.degreeTypeId}
                onChange={handleInputChange}
                required
                disabled={!selectedIssuer}
                aria-required="true"
              >
                <option value="">Chọn loại văn bằng</option>
                {Array.isArray(degreeTypes) &&
                  degreeTypes.map((degreeType) => (
                    <option key={degreeType._id} value={degreeType._id}>
                      {degreeType.title}
                    </option>
                  ))}
              </select>
            </div>
            {showDegreeForm && (
              <>
                {[
                  { label: 'Tên người nhận', name: 'recipientName', type: 'text', required: true },
                  { label: 'Nơi sinh', name: 'placeOfBirth', type: 'text', required: false },
                  { label: 'Xếp loại', name: 'level', type: 'text', required: false },
                  { label: 'Số hiệu', name: 'serialNumber', type: 'text', required: true },
                  { label: 'Số vào sổ', name: 'registryNumber', type: 'text', required: true },
                  { label: 'Nơi cấp', name: 'placeOfIssue', type: 'text', required: false },
                  { label: 'Người ký', name: 'signer', type: 'text', required: false },
                ].map((field, index) => (
                  <div className="col-12 d-flex flex-column flex-md-row mb-2" key={index}>
                    <label className="form-label col-md-2 mb-1 mb-md-0">{field.label}</label>
                    <input
                      type={field.type}
                      name={field.name}
                      className="form-control"
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      required={field.required}
                      aria-required={field.required}
                    />
                  </div>
                ))}
                <div className="col-12 d-flex flex-column flex-md-row mb-2">
                  <label className="form-label col-md-2 mb-1 mb-md-0">File đính kèm</label>
                  <input
                    type="file"
                    className={`form-control ${styles.fileInput}`}
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    aria-label="File đính kèm"
                    aria-describedby={error ? 'file-error' : undefined}
                  />
                </div>
                {previewUrl && (
                  <div className="col-12 d-flex flex-column flex-md-row mb-2">
                    <label className="form-label col-md-2 mb-1 mb-md-0">Xem trước</label>
                    <img src={previewUrl} alt="Preview" className={styles.previewImage} />
                  </div>
                )}
                <div className="col-12 d-flex flex-column flex-md-row mb-2">
                  <label className="form-label col-md-2 mb-1 mb-md-0">Ngày sinh</label>
                  <div className={styles.datePicker}>
                    <div className={styles.dateInputs}>
                      <input
                        type="text"
                        className={`form-control ${styles.dateInput} ${dateErrors.recipientDob ? styles.invalid : ''}`}
                        value={dobDate.day}
                        onChange={(e) => handleDateTextChange('dob', 'day', e.target.value, dobMonthRef)}
                        placeholder="DD"
                        maxLength="2"
                        ref={dobDayRef}
                        aria-label="Ngày sinh"
                        required
                      />
                      <span>/</span>
                      <input
                        type="text"
                        className={`form-control ${styles.dateInput} ${dateErrors.recipientDob ? styles.invalid : ''}`}
                        value={dobDate.month}
                        onChange={(e) => handleDateTextChange('dob', 'month', e.target.value, dobYearRef)}
                        placeholder="MM"
                        maxLength="2"
                        ref={dobMonthRef}
                        aria-label="Tháng sinh"
                        required
                      />
                      <span>/</span>
                      <input
                        type="text"
                        className={`form-control ${styles.dateInput} ${dateErrors.recipientDob ? styles.invalid : ''}`}
                        value={dobDate.year}
                        onChange={(e) => handleDateTextChange('dob', 'year', e.target.value, null)}
                        placeholder="YYYY"
                        maxLength="4"
                        ref={dobYearRef}
                        aria-label="Năm sinh"
                        required
                      />
                    </div>
                    {dateErrors.recipientDob && (
                      <div className={styles.dateError}>{dateErrors.recipientDob}</div>
                    )}
                    <div className={styles.dateSelects}>
                      <select
                        className={styles.dateSelect}
                        value={dobDate.day}
                        onChange={(e) => handleDateSelectChange('dob', 'day', e.target.value)}
                        aria-label="Chọn ngày sinh"
                      >
                        <option value="">Ngày</option>
                        {days.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <select
                        className={styles.dateSelect}
                        value={dobDate.month}
                        onChange={(e) => handleDateSelectChange('dob', 'month', e.target.value)}
                        aria-label="Chọn tháng sinh"
                      >
                        <option value="">Tháng</option>
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                      <select
                        className={styles.dateSelect}
                        value={dobDate.year}
                        onChange={(e) => handleDateSelectChange('dob', 'year', e.target.value)}
                        aria-label="Chọn năm sinh"
                      >
                        <option value="">Năm</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="col-12 d-flex flex-column flex-md-row mb-2">
                  <label className="form-label col-md-2 mb-1 mb-md-0">Ngày cấp</label>
                  <div className={styles.datePicker}>
                    <div className={styles.dateInputs}>
                      <input
                        type="text"
                        className={`form-control ${styles.dateInput} ${dateErrors.issueDate ? styles.invalid : ''}`}
                        value={issueDate.day}
                        onChange={(e) => handleDateTextChange('issue', 'day', e.target.value, issueMonthRef)}
                        placeholder="DD"
                        maxLength="2"
                        ref={issueDayRef}
                        aria-label="Ngày cấp"
                        required
                      />
                      <span>/</span>
                      <input
                        type="text"
                        className={`form-control ${styles.dateInput} ${dateErrors.issueDate ? styles.invalid : ''}`}
                        value={issueDate.month}
                        onChange={(e) => handleDateTextChange('issue', 'month', e.target.value, issueYearRef)}
                        placeholder="MM"
                        maxLength="2"
                        ref={issueMonthRef}
                        aria-label="Tháng cấp"
                        required
                      />
                      <span>/</span>
                      <input
                        type="text"
                        className={`form-control ${styles.dateInput} ${dateErrors.issueDate ? styles.invalid : ''}`}
                        value={issueDate.year}
                        onChange={(e) => handleDateTextChange('issue', 'year', e.target.value, null)}
                        placeholder="YYYY"
                        maxLength="4"
                        ref={issueYearRef}
                        aria-label="Năm cấp"
                        required
                      />
                    </div>
                    {dateErrors.issueDate && (
                      <div className={styles.dateError}>{dateErrors.issueDate}</div>
                    )}
                    <div className={styles.dateSelects}>
                      <select
                        className={styles.dateSelect}
                        value={issueDate.day}
                        onChange={(e) => handleDateSelectChange('issue', 'day', e.target.value)}
                        aria-label="Chọn ngày cấp"
                      >
                        <option value="">Ngày</option>
                        {days.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <select
                        className={styles.dateSelect}
                        value={issueDate.month}
                        onChange={(e) => handleDateSelectChange('issue', 'month', e.target.value)}
                        aria-label="Chọn tháng cấp"
                      >
                        <option value="">Tháng</option>
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                      <select
                        className={styles.dateSelect}
                        value={issueDate.year}
                        onChange={(e) => handleDateSelectChange('issue', 'year', e.target.value)}
                        aria-label="Chọn năm cấp"
                      >
                        <option value="">Năm</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mt-4 d-flex gap-2 flex-wrap justify-content-center">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    Thêm mới
                  </button>
                  <button className="btn btn-secondary" type="reset" onClick={handleReset} disabled={loading}>
                    Hủy bỏ
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDegree;