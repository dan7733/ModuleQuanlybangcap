import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { BrowserQRCodeReader } from '@zxing/library';
import { useParams } from 'react-router-dom';
import styles from './degreelookup.module.css';
import qrImage from '../../assets/degree/qrnew.png';
import logo from '../../assets/logo/logoDHCT.png';

const DegreeLookup = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    fullname: '',
    dob: '',
    issuerId: '',
    degreeTypeId: '',
    serialNumber: '',
    captcha: '',
  });
  const [degrees, setDegrees] = useState([]);
  const [issuers, setIssuers] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [selectedDegree, setSelectedDegree] = useState(null);
  const [selectedQrDegree, setSelectedQrDegree] = useState(null);
  const [qrSuccess, setQrSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [isScanning, setIsScanning] = useState(false);
  const qrReaderRef = useRef(null);
  const fileInputRef = useRef(null);
  const qrCanvasRef = useRef(null);
  const videoRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL;
  const WEBSITE_URL = process.env.REACT_APP_WEBSITE_URL;

  function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setFormData({ ...formData, captcha: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'issuerId') {
      setFormData({ ...formData, issuerId: value, degreeTypeId: '' });
      fetchDegreeTypes(value);
    }
  };

  const fetchIssuers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/public/issuers`);
      if (response.data.errCode === 0) {
        setIssuers(response.data.data);
      } else {
        setError('Không thể lấy danh sách đơn vị cấp');
      }
    } catch (err) {
      setError('Lỗi khi lấy danh sách đơn vị cấp');
    }
  }, [API_URL]);

  const fetchDegreeTypes = async (issuerId) => {
    if (!issuerId) {
      setDegreeTypes([]);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/v1/public/degree-types/by-issuer`, {
        params: { issuerId },
      });
      if (response.data.errCode === 0) {
        setDegreeTypes(response.data.data);
      } else {
        setError('Không thể lấy danh sách loại văn bằng');
        setDegreeTypes([]);
      }
    } catch (err) {
      setError('Lỗi khi lấy danh sách loại văn bằng');
      setDegreeTypes([]);
    }
  };

  useEffect(() => {
    fetchIssuers();
  }, [fetchIssuers]);

  useEffect(() => {
    qrReaderRef.current = new BrowserQRCodeReader();
    return () => {
      if (qrReaderRef.current) {
        qrReaderRef.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (id) {
      const fetchDegreeById = async () => {
        setError('');
        setLoading(true);
        try {
          const response = await axios.get(`${API_URL}/api/v1/public/degree/${id}`);
          if (response.data.errCode === 0) {
            setDegrees([response.data.data]);
            setSelectedDegree(response.data.data);
            setError('');
          } else {
            setError(response.data.message);
            setDegrees([]);
          }
        } catch (err) {
          setError('Lỗi khi lấy chi tiết văn bằng');
          setDegrees([]);
        } finally {
          setLoading(false);
        }
      };
      fetchDegreeById();
    }
  }, [id, API_URL]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setQrSuccess(false);

    if (formData.captcha !== captcha) {
      setError('Mã bảo vệ không đúng');
      setLoading(false);
      return;
    }

    if (formData.serialNumber) {
      if (!formData.serialNumber) {
        setError('Vui lòng nhập số hiệu văn bằng');
        setLoading(false);
        return;
      }
    } else {
      if (!formData.issuerId || !formData.degreeTypeId || !formData.fullname || !formData.dob) {
        setError('Vui lòng điền đầy đủ đơn vị cấp, loại văn bằng, họ tên và ngày sinh');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await axios.get(`${API_URL}/api/v1/public/degrees`, {
        params: {
          fullname: formData.serialNumber ? '' : formData.fullname,
          dob: formData.serialNumber ? '' : formData.dob,
          issuerId: formData.serialNumber ? '' : formData.issuerId,
          degreeTypeId: formData.serialNumber ? '' : formData.degreeTypeId,
          serialNumber: formData.serialNumber,
        },
      });

      if (response.data.errCode === 0) {
        setDegrees(response.data.data);
        setError('');
      } else {
        setError(response.data.message);
        setDegrees([]);
      }
    } catch (err) {
      setError('Lỗi khi tra cứu văn bằng');
      setDegrees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    setError('');
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/public/approveddegree/${id}`);
      if (response.data.errCode === 0) {
        setSelectedDegree(response.data.data);
        setError('');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Lỗi khi lấy chi tiết văn bằng');
    } finally {
      setLoading(false);
    }
  };

  const handleViewQr = (degree) => {
    setSelectedQrDegree(degree);
  };

  const handleDownloadQr = () => {
    if (qrCanvasRef.current) {
      const canvas = qrCanvasRef.current.querySelector('canvas');
      if (canvas) {
        const newCanvas = document.createElement('canvas');
        const ctx = newCanvas.getContext('2d');
        newCanvas.width = 400;
        newCanvas.height = 500;

        // Disable image smoothing for sharper QR code
        ctx.imageSmoothingEnabled = false;

        // Draw white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

        // Draw logo
        const logoImg = new Image();
        logoImg.src = logo;
        logoImg.onload = () => {
          ctx.drawImage(logoImg, 20, 20, 70, 70);

          // Draw university name
          ctx.fillStyle = '#0b619d';
          ctx.font = 'bold 20px "Times New Roman"';
          ctx.textAlign = 'right';
          ctx.fillText('ĐẠI HỌC CẦN THƠ', newCanvas.width - 20, 50);

          // Draw QR code
          ctx.drawImage(canvas, 75, 110, 250, 250);

          // Draw text below QR code
          ctx.fillStyle = '#0b619d';
          ctx.font = 'bold 16px "Times New Roman"';
          ctx.textAlign = 'center';
          ctx.fillText(`Đơn vị cấp: ${selectedQrDegree.issuerName || 'CUSC'}`, newCanvas.width / 2, 380);
          ctx.fillText(`Số hiệu: ${selectedQrDegree.serialNumber}`, newCanvas.width / 2, 400);

          // Download the combined image
          const dataUrl = newCanvas.toDataURL('image/png', 1.0);
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `qr-code-${selectedQrDegree._id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
      }
    }
  };

  const handleQrScan = async () => {
    setError('');
    setQrSuccess(false);
    setIsScanning(true);
    document.getElementById('qr-reader').style.display = 'block';
    document.getElementById('qr-placeholder').style.display = 'none';

    if (qrReaderRef.current && videoRef.current) {
      try {
        await qrReaderRef.current.decodeFromVideoDevice(null, videoRef.current, async (result, err) => {
          if (result) {
            qrReaderRef.current.reset();
            setIsScanning(false);
            document.getElementById('qr-reader').style.display = 'none';
            document.getElementById('qr-placeholder').style.display = 'block';

            const degreeId = result.getText().split('/').pop();
            try {
              const response = await axios.get(`${API_URL}/api/v1/public/degree/${degreeId}`);
              if (response.data.errCode === 0) {
                setDegrees([response.data.data]);
                setQrSuccess(true);
                setError('');
              } else {
                setError(response.data.message);
                setDegrees([]);
              }
            } catch (err) {
              setError('Lỗi khi lấy thông tin văn bằng từ mã QR');
              setDegrees([]);
            }
          }
          if (err && err.name !== 'NotFoundException') {
            console.warn('QR scan error:', err);
            setError('Lỗi khi quét mã QR');
          }
        });
      } catch (err) {
        console.warn('QR scan setup error:', err);
        setError('Không thể khởi động quét mã QR');
        setIsScanning(false);
        document.getElementById('qr-reader').style.display = 'none';
        document.getElementById('qr-placeholder').style.display = 'block';
      }
    }
  };

  const handleStopQrScan = () => {
    if (qrReaderRef.current) {
      qrReaderRef.current.reset();
      setIsScanning(false);
      setError('');
      document.getElementById('qr-reader').style.display = 'none';
      document.getElementById('qr-placeholder').style.display = 'block';
    }
  };

  const handleQrUpload = async (e) => {
    setError('');
    setQrSuccess(false);
    const file = e.target.files[0];
    if (file && qrReaderRef.current) {
      try {
        const imageUrl = URL.createObjectURL(file);
        const result = await qrReaderRef.current.decodeFromImageUrl(imageUrl);
        URL.revokeObjectURL(imageUrl);

        const degreeId = result.getText().split('/').pop();
        try {
          const response = await axios.get(`${API_URL}/api/v1/public/degree/${degreeId}`);
          if (response.data.errCode === 0) {
            setDegrees([response.data.data]);
            setQrSuccess(true);
            setError('');
          } else {
            setError(response.data.message);
            setDegrees([]);
          }
        } catch (err) {
          setError('Lỗi khi lấy thông tin văn bằng từ ảnh QR');
          setDegrees([]);
        }
      } catch (err) {
        console.warn('QR upload error:', err);
        setError('Không thể đọc mã QR từ ảnh');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleReset = () => {
    setFormData({
      fullname: '',
      dob: '',
      issuerId: '',
      degreeTypeId: '',
      serialNumber: '',
      captcha: '',
    });
    setDegrees([]);
    setSelectedDegree(null);
    setSelectedQrDegree(null);
    setQrSuccess(false);
    setError('');
    refreshCaptcha();
    setDegreeTypes([]);
  };

  const closeModal = () => {
    setSelectedDegree(null);
  };

  const closeQrModal = () => {
    setSelectedQrDegree(null);
  };

  return (
    <div className="container mt-4">
      {loading && (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      )}
      <div className="row g-4 align-items-stretch">
        <div className="col-md-6 d-flex">
          <div className="card p-4 shadow-sm w-100 h-100">
            <div className="mb-3">
              <h6 className="fw-bold">Tra cứu văn bằng</h6>
              <p className={styles.searchInstruction}>
                Vui lòng nhập số hiệu văn bằng để tra cứu nhanh, hoặc điền đầy đủ thông tin bao gồm đơn vị cấp, loại văn bằng, họ tên, và ngày sinh. Điền mã bảo vệ để hoàn tất.
              </p>
            </div>
            <form onSubmit={handleSearch}>
              <fieldset className={styles.detailedSearch}>
                <legend>Tra cứu bằng thông tin</legend>
                <div className="mb-2">
                  <label className={`form-label ${styles.requiredLabel}`}>Đơn vị cấp</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fa-solid fa-building"></i></span>
                    <select
                      name="issuerId"
                      className="form-select"
                      value={formData.issuerId}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn đơn vị cấp</option>
                      {issuers.map((issuer) => (
                        <option key={issuer._id} value={issuer._id}>
                          {issuer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-2">
                  <label className={`form-label ${styles.requiredLabel}`}>Loại văn bằng</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fa-solid fa-graduation-cap"></i></span>
                    <select
                      name="degreeTypeId"
                      className="form-select"
                      value={formData.degreeTypeId}
                      onChange={handleInputChange}
                      disabled={!formData.issuerId}
                    >
                      <option value="">Chọn loại văn bằng</option>
                      {degreeTypes.map((degreeType) => (
                        <option key={degreeType._id} value={degreeType._id}>
                          {degreeType.title} {degreeType.level ? `(${degreeType.level})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-2">
                  <label className={`form-label ${styles.requiredLabel}`}>Họ và tên</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fa-solid fa-user"></i></span>
                    <input
                      type="text"
                      name="fullname"
                      className="form-control"
                      placeholder="Nhập họ và tên"
                      value={formData.fullname}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <label className={`form-label ${styles.requiredLabel}`}>Ngày sinh</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fa-solid fa-calendar-days"></i></span>
                    <input
                      type="date"
                      name="dob"
                      className="form-control"
                      value={formData.dob}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </fieldset>
              <fieldset className={styles.serialSearch}>
                <legend>Tra cứu bằng số hiệu</legend>
                <div className="mb-2">
                  <label className={`form-label ${styles.requiredLabel}`}>Số hiệu</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fa-solid fa-tags"></i></span>
                    <input
                      type="text"
                      name="serialNumber"
                      className="form-control"
                      placeholder="Nhập số hiệu"
                      value={formData.serialNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </fieldset>
              <div className="mb-3">
                <label className="form-label">Mã bảo vệ</label>
                <div className="d-flex align-items-center gap-2 flex-nowrap overflow-auto">
                  <div className="input-group flex-shrink-1" style={{ minWidth: 0, maxWidth: 150 }}>
                    <span className="input-group-text"><i className="fa-solid fa-shield"></i></span>
                    <input
                      type="text"
                      name="captcha"
                      className="form-control"
                      placeholder="Nhập mã"
                      value={formData.captcha}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className="input-group-text btn-outline d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ height: 40, width: 40 }}
                    onClick={refreshCaptcha}
                  >
                    <i className="fa-solid fa-rotate-right text-danger"></i>
                  </button>
                  <span
                    className="px-3 py-2 border rounded bg-light fw-bold text-uppercase user-select-none flex-shrink-0"
                    style={{ letterSpacing: '2px', fontFamily: 'monospace' }}
                  >
                    {captcha}
                  </span>
                </div>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="d-flex justify-content-between gap-2 mt-3">
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  disabled={
                    loading ||
                    (!formData.serialNumber &&
                      (!formData.issuerId || !formData.degreeTypeId || !formData.fullname || !formData.dob))
                  }
                >
                  <i className="fa-solid fa-magnifying-glass me-1"></i> Tra cứu
                </button>
                <button type="button" className="btn btn-primary px-4" onClick={handleReset} disabled={loading}>
                  <i className="fa-solid fa-rotate me-1"></i> Hoàn tác
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-md-6 d-flex">
          <div className="card p-4 shadow-sm w-100 h-100 d-flex flex-column justify-content-between">
            <div>
              <h6 className="mb-3 pb-2 border-bottom text-center fw-bold">
                QUÉT MÃ VĂN BẰNG
              </h6>
              <div
                id="qr-placeholder"
                className="qr-placeholder-container position-relative mb-4"
              >
                <img
                  src={qrImage}
                  alt="Minh họa QR"
                  className="img-fluid rounded shadow text-center mx-auto d-block"
                  style={{ maxHeight: '350px', objectFit: 'contain' }}
                />
              </div>
              <div id="qr-reader" className="qr-reader-container mb-4" style={{ display: 'none' }}>
                <video ref={videoRef} style={{ width: '100%', maxHeight: '350px' }} />
              </div>
              {qrSuccess && (
                <div id="qr-result" className="mt-2 fw-bold text-success">
                  Nhận diện mã QR thành công!
                </div>
              )}
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary mt-3 w-100"
                  onClick={handleQrScan}
                  disabled={loading || isScanning}
                >
                  <i className="fa-solid fa-camera me-2"></i> Bấm để quét mã QR
                </button>
                {isScanning && (
                  <button
                    className="btn btn-danger mt-3 w-100"
                    onClick={handleStopQrScan}
                    disabled={loading}
                  >
                    <i className="fa-solid fa-stop me-2"></i> Dừng quét
                  </button>
                )}
              </div>
              <button
                className="btn btn-primary mt-3 w-100"
                onClick={() => fileInputRef.current.click()}
                disabled={loading}
              >
                <i className="fa-solid fa-upload me-2"></i> Tải ảnh mã QR
              </button>
              <input
                type="file"
                accept="image/*"
                id="qr-upload-input"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleQrUpload}
              />
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card mt-4 shadow-sm p-4">
            <h5 className="fw-bold mb-3 text-center">Kết quả tra cứu</h5>
            <div className="table-responsive">
              <table className="table table-bordered text-center align-middle mb-0">
                <thead className="table-secondary">
                  <tr>
                    <th>#</th>
                    <th>Tên người nhận</th>
                    <th>Ngày sinh</th>
                    <th>Tên văn bằng</th>
                    <th>Chuyên ngành</th>
                    <th>Cấp độ</th>
                    <th>Số hiệu</th>
                    <th>Chi tiết</th>
                    <th>Mã QR</th>
                  </tr>
                </thead>
                <tbody>
                  {degrees.length > 0 ? (
                    degrees.map((degree, index) => (
                      <tr key={degree._id}>
                        <td>{index + 1}</td>
                        <td>{degree.recipientName || 'N/A'}</td>
                        <td>{degree.recipientDob ? new Date(degree.recipientDob).toLocaleDateString() : 'N/A'}</td>
                        <td>{degree.degreeTypeName || 'N/A'}</td>
                        <td>{degree.major || 'N/A'}</td>
                        <td>{degree.level || 'N/A'}</td>
                        <td>{degree.serialNumber}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleViewDetails(degree._id)}
                            disabled={loading}
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleViewQr(degree)}
                            disabled={loading}
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9">Không tìm thấy văn bằng</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedDegree && (
          <div className="modal fade show d-block mt-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Chi tiết văn bằng</h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <div className="modal-body">
                  <div className={styles.degreeHeader}>
                    <img src={logo} alt="Logo Đại học Cần Thơ" className={styles.degreeLogo} />
                    <h2 className={styles.universityTitle}>Đại học Cần Thơ</h2>
                  </div>
                  <div className={styles.degreeContent}>
                    <p><strong>Tên người nhận:</strong> <span>{selectedDegree.recipientName || 'N/A'}</span></p>
                    <p><strong>Ngày sinh:</strong> <span>{selectedDegree.recipientDob ? new Date(selectedDegree.recipientDob).toLocaleDateString() : 'N/A'}</span></p>
                    <p><strong>Nơi sinh:</strong> <span>{selectedDegree.placeOfBirth || 'N/A'}</span></p>
                    <p><strong>Tên văn bằng:</strong> <span>{selectedDegree.degreeTypeName || 'N/A'}</span></p>
                    <p><strong>Chuyên ngành:</strong> <span>{selectedDegree.major || 'N/A'}</span></p>
                    <p><strong>Xếp loại:</strong> <span>{selectedDegree.level || 'N/A'}</span></p>
                    <p><strong>Số hiệu:</strong> <span>{selectedDegree.serialNumber || 'N/A'}</span></p>
                    <p><strong>Số đăng ký:</strong> <span>{selectedDegree.registryNumber || 'N/A'}</span></p>
                    <p><strong>Ngày cấp:</strong> <span>{selectedDegree.issueDate ? new Date(selectedDegree.issueDate).toLocaleDateString() : 'N/A'}</span></p>
                    <p><strong>Đơn vị cấp:</strong> <span>{selectedDegree.issuerName || 'N/A'}</span></p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedQrDegree && (
          <div className={`modal fade show d-block mt-0 ${styles.qrModal}`} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Mã QR Văn bằng</h5>
                  <button type="button" className="btn-close" onClick={closeQrModal}></button>
                </div>
                <div className="modal-body">
                  <div className={styles.degreeHeader}>
                    <img src={logo} alt="Logo Đại học Cần Thơ" className={styles.degreeLogo} />
                    <h2 className={styles.universityTitle}>Đại học Cần Thơ</h2>
                  </div>
                  <div className={styles.degreeContent}>
                    <p><strong>Đơn vị cấp:</strong> <span>{selectedQrDegree.issuerName || 'CUSC'}</span></p>
                    <div className={styles.qrCodeContainer} ref={qrCanvasRef}>
                      <QRCodeCanvas value={`${WEBSITE_URL}/degree/${selectedQrDegree._id}`} size={200} />
                    </div>
                    <p><strong>Số hiệu:</strong> <span>{selectedQrDegree.serialNumber}</span></p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-primary" onClick={handleDownloadQr}>
                    <i className="fa-solid fa-download me-1"></i> Tải xuống
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeQrModal}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DegreeLookup;