import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../../login/context';
import styles from './updatedegree.module.css';
import CryptoJS from 'crypto-js';

const UpdateDegree = () => {
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
    email: user?.email || '',
    status: '',
    fileAttachment: '',
    digitalSignature: '',
  });
  const [initialFormData, setInitialFormData] = useState(null); // Store initial data from DB
  const [fileAttachment, setFileAttachment] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cloudFileStatus, setCloudFileStatus] = useState('Chưa đồng bộ lên cloud');
  const [issuers, setIssuers] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [selectedIssuer, setSelectedIssuer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncError, setSyncError] = useState('');
  const [syncSuccess, setSyncSuccess] = useState('');
  const [reuploadError, setReuploadError] = useState('');
  const [reuploadSuccess, setReuploadSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [reuploadLoading, setReuploadLoading] = useState(false);
  const [dobDate, setDobDate] = useState({ day: '', month: '', year: '' });
  const [issueDate, setIssueDate] = useState({ day: '', month: '', year: '' });
  const [dateErrors, setDateErrors] = useState({ recipientDob: '', issueDate: '' });
  const [signatureStatus, setSignatureStatus] = useState('');
  const dobDayRef = useRef(null);
  const dobMonthRef = useRef(null);
  const dobYearRef = useRef(null);
  const issueDayRef = useRef(null);
  const issueMonthRef = useRef(null);
  const issueYearRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // Fetch degree data and issuers
  useEffect(() => {
    if (!user || !user.auth || !['admin', 'manager'].includes(user.role)) {
      setError('Bạn không có quyền truy cập trang này.');
      navigate('/');
      return;
    }

    if (!id || !isValidObjectId(id)) {
      setError('ID văn bằng không hợp lệ.');
      navigate('/diploma-manager');
      return;
    }

    const fetchDegree = async () => {
      try {
        const token = getAccessToken();
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/degree/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.errCode === 0) {
          const degree = response.data.data;
          const formData = {
            recipientName: degree.recipientName || '',
            recipientDob: degree.recipientDob || '',
            placeOfBirth: degree.placeOfBirth || '',
            level: degree.level || '',
            degreeTypeId: degree.degreeTypeId?._id || degree.degreeTypeId || '',
            issueDate: degree.issueDate || '',
            serialNumber: degree.serialNumber || '',
            registryNumber: degree.registryNumber || '',
            placeOfIssue: degree.placeOfIssue || '',
            signer: degree.signer || '',
            issuerId: degree.issuerId?._id || degree.issuerId || '',
            email: user.email,
            status: degree.status || '',
            fileAttachment: degree.fileAttachment || '',
            digitalSignature: degree.digitalSignature || '',
          };
          setFormData(formData);
          setInitialFormData(formData); // Store initial data
          setSelectedIssuer(degree.issuerId?._id || degree.issuerId || '');
          if (degree.fileAttachment) {
            setPreviewUrl(`${process.env.REACT_APP_API_URL}/images/degrees/${degree.fileAttachment}`);
          }
          setCloudFileStatus(degree.cloudFile ? 'Đã đồng bộ lên cloud' : 'Chưa đồng bộ lên cloud');
          console.log('Fetched degree data:', degree);

          if (degree.recipientDob) {
            const dob = new Date(degree.recipientDob);
            setDobDate({
              day: dob.getDate().toString(),
              month: (dob.getMonth() + 1).toString(),
              year: dob.getFullYear().toString(),
            });
          }
          if (degree.issueDate) {
            const issue = new Date(degree.issueDate);
            setIssueDate({
              day: issue.getDate().toString(),
              month: (issue.getMonth() + 1).toString(),
              year: issue.getFullYear().toString(),
            });
          }
        } else {
          setError('Không thể tải thông tin văn bằng.');
        }
      } catch (err) {
        console.error('Lỗi khi tải văn bằng:', err);
        setError('Lỗi khi tải thông tin văn bằng. Vui lòng thử lại.');
      }
    };

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
            console.error('Dữ liệu tổ chức không phải mảng:', response.data.data);
            setError('Dữ liệu tổ chức không hợp lệ.');
          }
        } else {
          setError('Không thể tải danh sách tổ chức.');
        }
      } catch (err) {
        console.error('Lỗi khi tải tổ chức:', err);
        setError('Lỗi khi tải danh sách tổ chức. Vui lòng thử lại.');
      }
    };

    fetchDegree();
    fetchIssuers();
  }, [user, navigate, id]);

  // Fetch degree types when issuer changes
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
              console.error('Dữ liệu loại văn bằng không phải mảng:', response.data.data);
              setError('Dữ liệu loại văn bằng không hợp lệ.');
              setDegreeTypes([]);
            }
          } else {
            setError('Không thể tải danh sách loại văn bằng.');
            setDegreeTypes([]);
          }
        } catch (err) {
          console.error('Lỗi khi tải loại văn bằng:', err);
          setError('Lỗi khi tải danh sách loại văn bằng. Vui lòng thử lại.');
          setDegreeTypes([]);
        }
      };
      fetchDegreeTypes();
      setFormData((prev) => ({ ...prev, issuerId: selectedIssuer }));
    } else {
      setDegreeTypes([]);
      setFormData((prev) => ({ ...prev, degreeTypeId: '', issuerId: '' }));
    }
  }, [selectedIssuer]);

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
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      console.log('New file selected:', file.name);
    }
  };

  const validateAndFormatDate = (day, month, year, fieldName) => {
    if (!day || !month || !year) {
      setDateErrors((prev) => ({ ...prev, [fieldName]: 'Vui lòng nhập đầy đủ ngày, tháng, năm.' }));
      return '';
    }

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
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
    const errorMap = {
      'Missing required degree fields or issuerId': 'Vui lòng điền đầy đủ các trường bắt buộc.',
      'Serial number or registry number already exists': 'Số hiệu hoặc số vào sổ đã tồn tại.',
      'Invalid DegreeType ID': 'Loại văn bằng không hợp lệ.',
      'DegreeType not found': 'Không tìm thấy loại văn bằng.',
      'Selected DegreeType does not belong to the chosen issuer': 'Loại văn bằng không thuộc tổ chức đã chọn.',
      'Invalid User ID': 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      'Only image files are allowed.': 'Chỉ cho phép tải lên file hình ảnh.',
      'File size exceeds 5MB limit.': 'Kích thước file vượt quá giới hạn 5MB.',
      'Degree not found': 'Không tìm thấy văn bằng.',
      'Permission denied': 'Bạn không có quyền cập nhật văn bằng này.',
      'Email does not match authenticated user': 'Email không khớp với người dùng đã đăng nhập.',
      'Digital signature is invalid': 'Chữ ký số không hợp lệ.',
      'No digital signature found': 'Không có chữ ký số.',
      'Invalid degree ID': 'ID văn bằng không hợp lệ.',
    };
    return errorMap[serverMessage] || 'Cập nhật văn bằng thất bại. Vui lòng thử lại.';
  };

  const mapServerSyncErrorToMessage = (serverMessage) => {
    const errorMap = {
      'Invalid Degree ID': 'ID văn bằng không hợp lệ.',
      'Degree not found or not approved': 'Văn bằng không tồn tại hoặc chưa được phê duyệt.',
      'Permission denied': 'Bạn không có quyền đồng bộ văn bằng này.',
      'File not found': 'Không tìm thấy file trên hệ thống.',
      'Local file not found': 'Không tìm thấy file cục bộ.',
      'Failed to delete existing local file': 'Không thể xóa file cục bộ hiện tại.',
      'No file to sync (neither cloudFile nor fileAttachment exists)': 'Không có file để đồng bộ (cả cloudFile và fileAttachment đều không tồn tại).',
      'Error uploading file to Mega.nz': 'Lỗi khi tải file lên Mega.nz.',
      'Error syncing file from Mega.nz': 'Lỗi khi đồng bộ file từ Mega.nz.',
      'Error deleting file from Mega.nz': 'Lỗi khi xóa file trên Mega.nz.',
    };
    return errorMap[serverMessage] || 'Đồng bộ file thất bại. Vui lòng thử lại.';
  };

  const mapServerSuccessToMessage = (serverMessage) => {
    const successMap = {
      'Digital signature is valid': 'Chữ ký số hợp lệ.',
      'Signature is valid': 'Chữ ký số hợp lệ.',
      'Degree status updated successfully': 'Cập nhật trạng thái văn bằng thành công!',
    };
    return successMap[serverMessage] || serverMessage;
  };

  const handleSync = async () => {
    setSyncError('');
    setSyncSuccess('');
    setSyncLoading(true);
    console.log('Starting sync operation');

    const token = getAccessToken();
    if (!token) {
      setSyncError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login');
      setSyncLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/degree/${id}/sync-file`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (response.data.errCode === 0) {
        setSyncSuccess('Đồng bộ file thành công!');
        setCloudFileStatus(response.data.data.cloudFile ? 'Đã đồng bộ lên cloud' : 'Chưa đồng bộ lên cloud');
        if (response.data.data.fileAttachment) {
          setPreviewUrl(`${process.env.REACT_APP_API_URL}/images/degrees/${response.data.data.fileAttachment}`);
          setFormData((prev) => ({ ...prev, fileAttachment: response.data.data.fileAttachment }));
        }
        console.log('Sync successful:', response.data.data);
      } else {
        setSyncError(mapServerSyncErrorToMessage(response.data.message));
        console.log('Sync failed:', response.data.message);
      }
    } catch (err) {
      console.error('Sync error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setSyncError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setSyncError(mapServerSyncErrorToMessage(err.response?.data?.message));
      }
    } finally {
      setSyncLoading(false);
      console.log('Sync operation completed');
    }
  };

  const handleReupload = async () => {
    setReuploadError('');
    setReuploadSuccess('');
    setReuploadLoading(true);
    console.log('Starting reupload operation');

    const token = getAccessToken();
    if (!token) {
      setReuploadError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login');
      setReuploadLoading(false);
      return;
    }

    try {
      let updatedFileAttachment = formData.fileAttachment;
      if (fileAttachment) {
        const updateData = new FormData();
        Object.keys(formData).forEach((key) => {
          if (formData[key]) {
            updateData.append(key, formData[key]);
          }
        });
        updateData.append('fileAttachment', fileAttachment);

        const updateResponse = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/v1/degree/${id}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
            withCredentials: true,
          }
        );

        if (updateResponse.data.errCode !== 0) {
          setReuploadError(mapServerErrorToMessage(updateResponse.data.message));
          setReuploadLoading(false);
          console.log('Update failed:', updateResponse.data.message);
          return;
        }
        updatedFileAttachment = updateResponse.data.data.fileAttachment;
        setFormData((prev) => ({ ...prev, fileAttachment: updatedFileAttachment }));
        setPreviewUrl(`${process.env.REACT_APP_API_URL}/images/degrees/${updatedFileAttachment}`);
        console.log('File updated:', updatedFileAttachment);
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/degree/${id}/reupload-file`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (response.data.errCode === 0) {
        setReuploadSuccess('Tải lại file lên cloud thành công!');
        setCloudFileStatus('Đã đồng bộ lên cloud');
        if (response.data.data.fileAttachment) {
          setPreviewUrl(`${process.env.REACT_APP_API_URL}/images/degrees/${response.data.data.fileAttachment}`);
          setFormData((prev) => ({ ...prev, fileAttachment: response.data.data.fileAttachment }));
        }
        console.log('Reupload successful:', response.data.data);
      } else {
        setReuploadError(mapServerSyncErrorToMessage(response.data.message));
        console.log('Reupload failed:', response.data.message);
      }
    } catch (err) {
      console.error('Reupload error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setReuploadError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setReuploadError(mapServerSyncErrorToMessage(err.response?.data?.message));
      }
    } finally {
      setReuploadLoading(false);
      console.log('Reupload operation completed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    console.log('Submitting form:', formData);

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

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/v1/degree/${id}`,
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
        setSuccess('Cập nhật văn bằng thành công!');
        setCloudFileStatus(response.data.data.cloudFile ? 'Đã đồng bộ lên cloud' : 'Chưa đồng bộ lên cloud');
        if (response.data.data.fileAttachment) {
          setPreviewUrl(`${process.env.REACT_APP_API_URL}/images/degrees/${response.data.data.fileAttachment}`);
          setFormData((prev) => ({ ...prev, fileAttachment: response.data.data.fileAttachment }));
          setInitialFormData((prev) => ({ ...prev, fileAttachment: response.data.data.fileAttachment }));
        }
        console.log('Update successful:', response.data.data);
      } else {
        setError(mapServerErrorToMessage(response.data.message));
        console.log('Update failed:', response.data.message);
      }
    } catch (err) {
      console.error('Update error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        navigate('/');
      } else {
        setError(mapServerErrorToMessage(err.response?.data?.message));
      }
    } finally {
      setLoading(false);
      console.log('Update operation completed');
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

  const handleReset = () => {
    if (initialFormData) {
      setFormData(initialFormData);
      setFileAttachment(null);
      setPreviewUrl(initialFormData.fileAttachment ? `${process.env.REACT_APP_API_URL}/images/degrees/${initialFormData.fileAttachment}` : null);
      fileInputRef.current.value = null;
      setDobDate({
        day: initialFormData.recipientDob ? new Date(initialFormData.recipientDob).getDate().toString() : '',
        month: initialFormData.recipientDob ? (new Date(initialFormData.recipientDob).getMonth() + 1).toString() : '',
        year: initialFormData.recipientDob ? new Date(initialFormData.recipientDob).getFullYear().toString() : '',
      });
      setIssueDate({
        day: initialFormData.issueDate ? new Date(initialFormData.issueDate).getDate().toString() : '',
        month: initialFormData.issueDate ? (new Date(initialFormData.issueDate).getMonth() + 1).toString() : '',
        year: initialFormData.issueDate ? new Date(initialFormData.issueDate).getFullYear().toString() : '',
      });
      setDateErrors({ recipientDob: '', issueDate: '' });
      setSelectedIssuer(initialFormData.issuerId || '');
      setError('');
      setSuccess('');
      setSyncError('');
      setSyncSuccess('');
      setReuploadError('');
      setReuploadSuccess('');
      setSignatureStatus('');
      console.log('Form reset to initial data:', initialFormData);
    } else {
      console.log('No initial data available for reset');
    }
  };

  return (
    <div className="bg-light p-4">
      {(loading || syncLoading || reuploadLoading) && (
        <div className={styles.loadingOverlay}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang xử lý...</span>
          </div>
        </div>
      )}
      <div className="container bg-white p-4 rounded shadow-sm">
        <div className={`d-flex gap-2 mb-3 flex-wrap ${styles.actionButtons}`}>
          <Link to="/listdegree" className={`btn ${styles.bthThembangcap}`}>
            <i className="fas fa-arrow-left"></i> Quay lại
          </Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {syncError && <div className="alert alert-danger">{syncError}</div>}
        {syncSuccess && <div className="alert alert-success">{syncSuccess}</div>}
        {reuploadError && <div className="alert alert-danger">{reuploadError}</div>}
        {reuploadSuccess && <div className="alert alert-success">{reuploadSuccess}</div>}
        {signatureStatus && <div className="alert alert-info">{signatureStatus}</div>}

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
            {[
              { label: 'Tên người nhận', name: 'recipientName', type: 'text', required: true },
              { label: 'Nơi sinh', name: 'placeOfBirth', type: 'text', required: false },
              { label: 'Xếp loại', name: 'level', type: 'text', required: false },
              { label: 'Số hiệu', name: 'serialNumber', type: 'text', required: true },
              { label: 'Số vào sổ', name: 'registryNumber', type: 'text', required: true },
              { label: 'Nơi cấp', name: 'placeOfIssue', type: 'text', required: false },
              { label: 'Người ký', name: 'signer', type: 'text', required: false },
              { label: 'Email', name: 'email', type: 'email', required: true, readOnly: true },
              { label: 'Chữ ký số', name: 'digitalSignature', value: formData.digitalSignature || 'Không có', readOnly: true },
            ].map((field, index) => (
              <div className="col-12 d-flex flex-column flex-md-row mb-2" key={index}>
                <label className="form-label col-md-2 mb-1 mb-md-0">{field.label}</label>
                <input
                  type={field.type || 'text'}
                  name={field.name}
                  className="form-control"
                  value={field.value || formData[field.name]}
                  onChange={handleInputChange}
                  required={field.required}
                  readOnly={field.readOnly}
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
                <label className="form-label col-md-2 mb-1 mb-md-0">Tệp hiện tại</label>
                <img
                  src={previewUrl}
                  alt="Xem trước văn bằng"
                  className={styles.previewImage}
                />
              </div>
            )}
            <div className="col-12 d-flex flex-column flex-md-row mb-2">
              <label className="form-label col-md-2 mb-1 mb-md-0">File cloud</label>
              <span>{cloudFileStatus}</span>
            </div>
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
              <button className="btn btn-primary" type="submit" disabled={loading || syncLoading || reuploadLoading}>
                Cập nhật
              </button>
              {formData.status === 'Approved' && (
                <>
                  <button
                    className="btn btn-warning"
                    type="button"
                    onClick={handleSync}
                    disabled={loading || syncLoading || reuploadLoading}
                  >
                    {syncLoading ? 'Đang đồng bộ...' : 'Đồng bộ Cloud'}
                  </button>
                  {cloudFileStatus === 'Đã đồng bộ lên cloud' && (
                    <button
                      className="btn btn-warning"
                      type="button"
                      onClick={handleReupload}
                      disabled={loading || syncLoading || reuploadLoading}
                    >
                      {reuploadLoading ? 'Đang tải lại...' : 'Tải lại Cloud'}
                    </button>
                  )}
                  <button
                    className="btn btn-info"
                    type="button"
                    onClick={handleVerifySignature}
                    disabled={loading || syncLoading || reuploadLoading || !formData.digitalSignature}
                  >
                    Xác minh chữ ký số
                  </button>
                </>
              )}
              <button className="btn btn-secondary" type="reset" onClick={handleReset} disabled={loading || syncLoading || reuploadLoading}>
                Hủy bỏ
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateDegree;