import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './adddegreeimage.module.css';

const getAccessToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  return user.accessToken || null;
};

// Ánh xạ mã lỗi sang thông báo tiếng Việt
const errorMessages = {
  1: 'Thiếu thông tin bắt buộc (ví dụ: Tên người nhận, Số hiệu, Số vào sổ).',
  2: 'Số hiệu hoặc Số vào sổ đã tồn tại trong hệ thống.',
  3: 'Đơn vị cấp hoặc loại văn bằng không hợp lệ.',
  4: 'Lỗi khi trích xuất thông tin từ ảnh.',
  'N/A': 'Lỗi không xác định. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
};

const AddDegreeImage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [folderFiles, setFolderFiles] = useState([]);
  const [issuers, setIssuers] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [selectedIssuer, setSelectedIssuer] = useState('');
  const [selectedDegreeType, setSelectedDegreeType] = useState('');
  const [addedDegrees, setAddedDegrees] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Kiểm tra quyền
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    if (!storedUser || !storedUser.auth || !['admin', 'manager'].includes(storedUser.role)) {
      console.log('Access denied:', { auth: storedUser.auth, role: storedUser.role });
      navigate('/');
    }
  }, [navigate]);

  // Lấy danh sách issuer
  useEffect(() => {
    const fetchIssuers = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          setError('Không tìm thấy token. Vui lòng đăng nhập lại.');
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/issuers`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        console.log('Issuers response:', response.data);
        if (response.data.errCode === 0) {
          setIssuers(response.data.data || []);
        } else {
          setError('Không thể tải danh sách đơn vị cấp.');
        }
      } catch (err) {
        console.error('Error fetching issuers:', err);
        setError('Lỗi khi tải danh sách đơn vị cấp. Vui lòng thử lại.');
      }
    };
    fetchIssuers();
  }, []);

  // Lấy danh sách degree types khi chọn issuer
  useEffect(() => {
    if (selectedIssuer) {
      const fetchDegreeTypes = async () => {
        try {
          const token = getAccessToken();
          if (!token) {
            setError('Không tìm thấy token. Vui lòng đăng nhập lại.');
            return;
          }
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/v1/degree-types/by-issuer?issuerId=${selectedIssuer}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('Degree types response:', response.data);
          if (response.data.errCode === 0) {
            setDegreeTypes(response.data.data || response.data.data.degreeTypes || []);
          } else {
            setError('Không thể tải danh sách loại văn bằng.');
          }
        } catch (err) {
          console.error('Error fetching degree types:', err);
          setError('Lỗi khi tải danh sách loại văn bằng. Vui lòng thử lại.');
        }
      };
      fetchDegreeTypes();
    } else {
      setDegreeTypes([]);
      setSelectedDegreeType('');
    }
  }, [selectedIssuer]);

  const handleFileClick = () => fileInputRef.current.click();
  const handleFolderClick = () => folderInputRef.current.click();

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFolderFiles([]);
      setAddedDegrees([]);
      setError('');
      setSuccess('');
    } else {
      alert('Chỉ chấp nhận định dạng ảnh (.jpg, .png, .jpeg, ...)');
      event.target.value = '';
      setSelectedImage(null);
      setPreviewUrl(null);
      setError('Định dạng file không hợp lệ.');
    }
  };

  const handleFolderChange = (event) => {
    const files = Array.from(event.target.files).filter(file =>
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      setFolderFiles(files);
      setSelectedImage(null);
      setPreviewUrl(null);
      setAddedDegrees([]);
      setError('');
      setSuccess('');
    } else {
      alert('Thư mục không chứa ảnh hợp lệ.');
      setFolderFiles([]);
      setError('Thư mục không chứa ảnh hợp lệ.');
    }
  };

  const handleUploadSingle = async () => {
    if (!selectedImage) {
      alert('Vui lòng chọn ảnh để tải lên.');
      setError('Không có ảnh được chọn.');
      return;
    }
    if (!selectedIssuer || !selectedDegreeType) {
      alert('Vui lòng chọn đơn vị cấp và loại văn bằng.');
      setError('Vui lòng chọn đơn vị cấp và loại văn bằng.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('issuerId', selectedIssuer);
      formData.append('degreeTypeId', selectedDegreeType);

      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/degree/extract`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );

      console.log('Extract response:', response.data);
      if (response.data.errCode === 0) {
        setSuccess('Tạo văn bằng thành công!');
        setAddedDegrees([{ ...response.data.data, status: 'success' }]);
        setSelectedImage(null);
        setPreviewUrl(null);
        fileInputRef.current.value = '';
      } else {
        const errorMessage = errorMessages[response.data.errCode] || 'Lỗi khi xử lý ảnh. Vui lòng kiểm tra lại.';
        setError(errorMessage);
        setAddedDegrees([{
          fileName: selectedImage.name,
          error: errorMessage,
          errCode: response.data.errCode || 'N/A',
          data: response.data.data || {},
          status: 'error'
        }]);
      }
    } catch (err) {
      console.error('Error uploading image:', err.response?.data || err.message);
      const errorMessage = errorMessages[err.response?.data?.errCode] || 'Lỗi khi tải lên ảnh. Vui lòng thử lại.';
      setError(errorMessage);
      setAddedDegrees([{
        fileName: selectedImage.name,
        error: errorMessage,
        errCode: err.response?.data?.errCode || 'N/A',
        data: err.response?.data?.data || {},
        status: 'error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFolder = async () => {
    if (folderFiles.length === 0) {
      alert('Vui lòng chọn thư mục chứa ảnh.');
      setError('Không có thư mục được chọn.');
      return;
    }
    if (!selectedIssuer || !selectedDegreeType) {
      alert('Vui lòng chọn đơn vị cấp và loại văn bằng.');
      setError('Vui lòng chọn đơn vị cấp và loại văn bằng.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const newDegrees = [];
      let successCount = 0;
      let errorCount = 0;

      for (const file of folderFiles) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('issuerId', selectedIssuer);
        formData.append('degreeTypeId', selectedDegreeType);

        for (let pair of formData.entries()) {
          console.log(`${pair[0]}: ${pair[1]}`);
        }

        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/v1/degree/extract`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
              withCredentials: true,
            }
          );

          console.log(`Extract response for ${file.name}:`, response.data);
          if (response.data.errCode === 0) {
            newDegrees.push({ ...response.data.data, status: 'success' });
            successCount++;
          } else {
            const errorMessage = errorMessages[response.data.errCode] || 'Lỗi khi xử lý ảnh. Vui lòng kiểm tra lại.';
            newDegrees.push({
              fileName: file.name,
              error: errorMessage,
              errCode: response.data.errCode || 'N/A',
              data: response.data.data || {},
              status: 'error'
            });
            errorCount++;
          }
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err.response?.data || err.message);
          const errorMessage = errorMessages[err.response?.data?.errCode] || 'Lỗi khi tải lên ảnh. Vui lòng thử lại.';
          newDegrees.push({
            fileName: file.name,
            error: errorMessage,
            errCode: err.response?.data?.errCode || 'N/A',
            data: err.response?.data?.data || {},
            status: 'error'
          });
          errorCount++;
        }
      }

      const summaryMessage = `Đã xử lý ${folderFiles.length} ảnh: ${successCount} thành công, ${errorCount} thất bại.`;
      setSuccess(summaryMessage);
      setAddedDegrees(newDegrees);
      setFolderFiles([]);
      folderInputRef.current.value = '';
    } catch (err) {
      console.error('Error uploading folder:', err.response?.data || err.message);
      setError('Lỗi hệ thống khi tải lên thư mục. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.appContainer}>
      {/* Loading Indicator */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Đang xử lý...</span>
            </div>
            <p className={styles.loadingText}>Đang xử lý, vui lòng đợi...</p>
          </div>
        </div>
      )}

      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <h1 className="text-center mb-4" style={{ color: '#0B619D' }}>
            <i className="fas fa-image"></i> Tải Ảnh Văn Bằng
          </h1>

          {/* Lựa chọn đơn vị cấp và loại văn bằng */}
          <div className={styles.uploadSection}>
            <h3 className={styles.sectionTitle}>Chọn đơn vị cấp và loại văn bằng</h3>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Đơn vị cấp</label>
                <select
                  className="form-control"
                  value={selectedIssuer}
                  onChange={(e) => setSelectedIssuer(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Chọn đơn vị cấp</option>
                  {issuers.length > 0 ? (
                    issuers.map(issuer => (
                      <option key={issuer._id} value={issuer._id}>{issuer.name}</option>
                    ))
                  ) : (
                    <option disabled>Không có đơn vị cấp</option>
                  )}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Loại văn bằng</label>
                <select
                  className="form-control"
                  value={selectedDegreeType}
                  onChange={(e) => setSelectedDegreeType(e.target.value)}
                  disabled={!selectedIssuer || loading}
                >
                  <option value="">Chọn loại văn bằng</option>
                  {degreeTypes.length > 0 ? (
                    degreeTypes.map(type => (
                      <option key={type._id} value={type._id}>{type.title}</option>
                    ))
                  ) : (
                    <option disabled>Không có loại văn bằng</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Thêm Ảnh Đơn */}
          <div className={styles.uploadSection}>
            <h3 className={styles.sectionTitle}>Thêm Ảnh</h3>
            <div className={styles.buttonGroup}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="d-none"
                onChange={handleImageChange}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.selectButton}
                onClick={handleFileClick}
                disabled={loading}
              >
                <i className="fas fa-image"></i> Chọn Ảnh
              </button>
              <button
                type="button"
                className={styles.uploadButton}
                onClick={handleUploadSingle}
                disabled={!selectedImage || !selectedIssuer || !selectedDegreeType || loading}
              >
                <i className="fas fa-upload"></i> Tải Lên
              </button>
            </div>
            {selectedImage && (
              <div className={styles.previewContainer}>
                <p className={styles.previewText}>
                  Ảnh đã chọn: <span className={styles.fileName}>{selectedImage.name}</span>
                </p>
                <img
                  src={previewUrl}
                  alt="Xem trước"
                  className={styles.previewImageSmall}
                />
              </div>
            )}
          </div>

          {/* Thêm Thư Mục */}
          <div className={styles.uploadSection}>
            <h3 className={styles.sectionTitle}>Thêm Thư Mục</h3>
            <div className={styles.buttonGroup}>
              <input
                type="file"
                ref={folderInputRef}
                className="d-none"
                onChange={handleFolderChange}
                webkitdirectory="true"
                directory="true"
                multiple
                accept="image/*"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.selectButton}
                onClick={handleFolderClick}
                disabled={loading}
              >
                <i className="fas fa-folder"></i> Chọn Thư Mục
              </button>
              <button
                type="button"
                className={styles.uploadButton}
                onClick={handleUploadFolder}
                disabled={folderFiles.length === 0 || !selectedIssuer || !selectedDegreeType || loading}
              >
                <i className="fas fa-upload"></i> Tải Thư Mục
              </button>
            </div>
            {folderFiles.length > 0 && (
              <div className={styles.fileListContainer}>
                <p className={styles.fileCount}>Đã chọn {folderFiles.length} ảnh:</p>
                <ul className={styles.fileList}>
                  {folderFiles.slice(0, 5).map((file, index) => (
                    <li key={index} className={styles.fileItem}>
                      {file.webkitRelativePath || file.name}
                    </li>
                  ))}
                  {folderFiles.length > 5 && <li className={styles.fileItem}>...</li>}
                </ul>
              </div>
            )}
          </div>

          {/* Hiển thị thông báo lỗi/thành công */}
          {error && <div className="alert alert-danger mt-3">{error}</div>}
          {success && <div className="alert alert-success mt-3">{success}</div>}

          {/* Hiển thị thông tin văn bằng vừa được thêm */}
          {addedDegrees.length > 0 && (
            <div className={styles.uploadSection}>
              <h3 className={styles.sectionTitle}>Thông tin văn bằng vừa thêm</h3>
              {addedDegrees.map((degree, index) => (
                <div key={index} className={`card mb-3 ${degree.status === 'error' ? 'border-danger' : 'border-success'}`}>
                  <div className="card-body">
                    {degree.status === 'error' ? (
                      <>
                        <p className="text-danger">
                          <strong>Lỗi xử lý ảnh:</strong> {degree.fileName}
                        </p>
                        <p className="text-danger">
                          <strong>Mã lỗi:</strong> {degree.errCode}
                        </p>
                        <p className="text-danger">
                          <strong>Thông báo lỗi:</strong> {degree.error}
                        </p>
                        {Object.keys(degree.data).length > 0 && (
                          <>
                            <p><strong>Thông tin trích xuất (không đầy đủ):</strong></p>
                            <p><strong>Tên người nhận:</strong> {degree.data.recipientName || 'Không rõ'}</p>
                            <p><strong>Ngày sinh:</strong> {degree.data.recipientDob || 'Không rõ'}</p>
                            <p><strong>Nơi sinh:</strong> {degree.data.placeOfBirth || 'Không rõ'}</p>
                            <p><strong>Xếp loại:</strong> {degree.data.level || 'Không rõ'}</p>
                            <p><strong>Ngày cấp:</strong> {degree.data.issueDate || 'Không rõ'}</p>
                            <p><strong>Địa điểm cấp:</strong> {degree.data.placeOfIssue || 'Không rõ'}</p>
                            <p><strong>Người cấp:</strong> {degree.data.signer || 'Không rõ'}</p>
                            <p><strong>Số hiệu:</strong> {degree.data.serialNumber || 'Không rõ'}</p>
                            <p><strong>Số vào sổ:</strong> {degree.data.registryNumber || 'Không rõ'}</p>
                            {degree.data.fileAttachment && (
                              <p><strong>File đính kèm:</strong> {degree.data.fileAttachment}</p>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-success">
                          <strong>Thành công:</strong> Văn bằng đã được tạo (File: {degree.fileAttachment})
                        </p>
                        <p><strong>Tên người nhận:</strong> {degree.recipientName || 'Không rõ'}</p>
                        <p><strong>Ngày sinh:</strong> {degree.recipientDob || 'Không rõ'}</p>
                        <p><strong>Nơi sinh:</strong> {degree.placeOfBirth || 'Không rõ'}</p>
                        <p><strong>Xếp loại:</strong> {degree.level || 'Không rõ'}</p>
                        <p><strong>Ngày cấp:</strong> {degree.issueDate || 'Không rõ'}</p>
                        <p><strong>Địa điểm cấp:</strong> {degree.placeOfIssue || 'Không rõ'}</p>
                        <p><strong>Người cấp:</strong> {degree.signer || 'Không rõ'}</p>
                        <p><strong>Số hiệu:</strong> {degree.serialNumber || 'Không rõ'}</p>
                        <p><strong>Số vào sổ:</strong> {degree.registryNumber || 'Không rõ'}</p>
                        {degree.fileAttachment && (
                          <p><strong>File đính kèm:</strong> {degree.fileAttachment}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nút Quay Lại */}
          <div className={styles.backButtonWrapper}>
            <button
              type="button"
              className={styles.selectButton}
              onClick={() => navigate('/diploma-manager')}
              disabled={loading}
            >
              <i className="fas fa-arrow-left"></i> Quay Lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDegreeImage;