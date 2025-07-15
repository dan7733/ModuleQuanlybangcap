import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { BrowserQRCodeReader } from '@zxing/library';
import { useParams } from 'react-router-dom';
import styles from './diplomalookup.module.css';
import qrImage from '../../assets/diplomalookup/qrnew.png';

const DiplomaLookup = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    fullname: '',
    dob: '',
    serialNumber: '',
    registryNumber: '',
    captcha: '',
  });
  const [degrees, setDegrees] = useState([]);
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
  };

  useEffect(() => {
    qrReaderRef.current = new BrowserQRCodeReader();
    return () => {
      if (qrReaderRef.current) {
        qrReaderRef.current.reset();
      }
    };
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/refresh-token`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('refreshToken')}`,
        },
      });
      if (response.data.errCode === 0) {
        localStorage.setItem('accessToken', response.data.accessToken);
        return response.data.accessToken;
      } else {
        // Handle token refresh failure
        setError('Không thể làm mới token');
        return null;
      }
    } catch (err) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return null;
    }
  }, [API_URL]);

  useEffect(() => {
    if (id) {
      const fetchDegreeById = async () => {
        setError('');
        setLoading(true);
        try {
          let token = localStorage.getItem('accessToken');
          let response = await axios.get(`${API_URL}/api/v1/degree/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data.errCode === 1 && response.data.message.includes('token')) {
            token = await refreshToken();
            if (!token) {
              setLoading(false);
              return;
            }
            response = await axios.get(`${API_URL}/api/v1/degree/${id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshToken]); // Suppress warning for API_URL

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

    if (!formData.serialNumber && !formData.registryNumber) {
      setError('Vui lòng nhập ít nhất một trong hai: số hiệu hoặc số vào sổ');
      setLoading(false);
      return;
    }

    try {
      let token = localStorage.getItem('accessToken');
      let response = await axios.get(`${API_URL}/api/v1/degrees`, {
        params: {
          serialNumber: formData.serialNumber,
          registryNumber: formData.registryNumber,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.errCode === 1 && response.data.message.includes('token')) {
        token = await refreshToken();
        if (!token) {
          setLoading(false);
          return;
        }
        response = await axios.get(`${API_URL}/api/v1/degrees`, {
          params: {
            serialNumber: formData.serialNumber,
            registryNumber: formData.registryNumber,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

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
      let token = localStorage.getItem('accessToken');
      let response = await axios.get(`${API_URL}/api/v1/degree/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.errCode === 1 && response.data.message.includes('token')) {
        token = await refreshToken();
        if (!token) {
          setLoading(false);
          return;
        }
        response = await axios.get(`${API_URL}/api/v1/degree/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

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
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `qr-code-${selectedQrDegree._id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
              let token = localStorage.getItem('accessToken');
              let response = await axios.get(`${API_URL}/api/v1/degree/${degreeId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.data.errCode === 1 && response.data.message.includes('token')) {
                token = await refreshToken();
                if (!token) return;
                response = await axios.get(`${API_URL}/api/v1/degree/${degreeId}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
              }

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
          let token = localStorage.getItem('accessToken');
          let response = await axios.get(`${API_URL}/api/v1/degree/${degreeId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data.errCode === 1 && response.data.message.includes('token')) {
            token = await refreshToken();
            if (!token) return;
            response = await axios.get(`${API_URL}/api/v1/degree/${degreeId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          }

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
      serialNumber: '',
      registryNumber: '',
      captcha: '',
    });
    setDegrees([]);
    setSelectedDegree(null);
    setSelectedQrDegree(null);
    setQrSuccess(false);
    setError('');
    refreshCaptcha();
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
            <form onSubmit={handleSearch}>
              <div className="mb-2">
                <label className="form-label">Họ và tên</label>
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
                <label className="form-label">Ngày sinh</label>
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
              <div className="mb-2">
                <label className="form-label">Số hiệu</label>
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
              <div className="mb-2">
                <label className="form-label">Số vào sổ</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa-solid fa-user-secret"></i></span>
                  <input
                    type="text"
                    name="registryNumber"
                    className="form-control"
                    placeholder="Nhập số vào sổ"
                    value={formData.registryNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
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
                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                  <i className="fa-solid fa-magnifying-glass me-1"></i> Tra cứu
                </button>
                <button typeButton="button" className="btn btn-primary px-4" onClick={handleReset} disabled={loading}>
                  <i className="fa-solid fa-rotate me-1"></i> Hoàn tác
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-md-6 d-flex">
          <div className="card p-4 shadow-sm w-100 h-100 d-flex flex-column justify-content-between">
            <div>
              <h6 className={`${styles.detailproductQm} mb-3 pb-2 border-bottom text-center`}>
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
                    <th>Tên văn bằng</th>
                    <th>Chuyên ngành</th>
                    <th>Cấp độ</th>
                    <th>Số hiệu</th>
                    <th>Số vào sổ</th>
                    <th>Chi tiết</th>
                    <th>Mã QR</th>
                  </tr>
                </thead>
                <tbody>
                  {degrees.length > 0 ? (
                    degrees.map((degree, index) => (
                      <tr key={degree._id}>
                        <td>{index + 1}</td>
                        <td>{degree.title}</td>
                        <td>{degree.major}</td>
                        <td>{degree.level}</td>
                        <td>{degree.serialNumber}</td>
                        <td>{degree.registryNumber}</td>
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
                      <td colSpan="8">Không tìm thấy văn bằng</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedDegree && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Chi tiết văn bằng</h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <div className="modal-body">
                  <p><strong>Tên văn bằng:</strong> {selectedDegree.title}</p>
                  <p><strong>Chuyên ngành:</strong> {selectedDegree.major}</p>
                  <p><strong>Cấp độ:</strong> {selectedDegree.level}</p>
                  <p><strong>Ngày cấp:</strong> {new Date(selectedDegree.issueDate).toLocaleDateString()}</p>
                  <p><strong>Số hiệu:</strong> {selectedDegree.serialNumber}</p>
                  <p><strong>Số vào sổ:</strong> {selectedDegree.registryNumber}</p>
                  <p><strong>Người cấp:</strong> {selectedDegree.issuerId}</p>
                  {selectedDegree.fileAttachment && (
                    <p><strong>Tệp đính kèm:</strong> <a href={selectedDegree.fileAttachment} target="_blank" rel="noreferrer">Tải xuống</a></p>
                  )}
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
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Mã QR Văn bằng</h5>
                  <button type="button" className="btn-close" onClick={closeQrModal}></button>
                </div>
                <div className="modal-body text-center">
                  <p><strong>Đơn vị cấp văn bằng:</strong> CUSC (Trung tâm Công nghệ Phần mềm Cần Thơ)</p>
                  <div ref={qrCanvasRef}>
                    <QRCodeCanvas value={`${WEBSITE_URL}/degree/${selectedQrDegree._id}`} size={200} />
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

export default DiplomaLookup;